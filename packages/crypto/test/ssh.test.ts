import { describe, expect, test } from "bun:test";
import {
	buildKrl,
	createSshCaContext,
	DEFAULT_USER_EXTENSIONS,
	deriveDefaultPrincipal,
	formatOpenSshEd25519PublicKey,
	generateCaKeyPairJwk,
	getPermittedPrincipals,
	issueUserCertificate,
	KRL_FORMAT_VERSION,
	KRL_MAGIC,
	parseKrl,
	parseOpenSshCertificate,
	parseOpenSshPublicKey,
	SSHReader,
	SSHWriter,
	SshValidationError,
} from "../src/ssh";

describe("@id/crypto: SSH Wire Format (RFC 4251)", () => {
	test("serializes and deserializes uint32, uint64, string, and bytes", () => {
		const writer = new SSHWriter();
		writer.writeUint32(42);
		writer.writeUint64(9007199254740993n);
		writer.writeString("hello-openssh");
		writer.writeBytes(new Uint8Array([10, 20, 30, 40]));

		const buffer = writer.toUint8Array();
		const reader = new SSHReader(buffer);

		expect(reader.readUint32()).toBe(42);
		expect(reader.readUint64()).toBe(9007199254740993n);
		expect(reader.readString()).toBe("hello-openssh");
		expect(Array.from(reader.readBytes())).toEqual([10, 20, 30, 40]);
		expect(reader.hasRemaining()).toBe(false);
	});
});

describe("@id/crypto: SSH Public Keys & Validation", () => {
	test("formats and parses Ed25519 public keys", () => {
		const rawKey = crypto.getRandomValues(new Uint8Array(32));
		const formatted = formatOpenSshEd25519PublicKey(rawKey, "test@host");

		expect(formatted.startsWith("ssh-ed25519 ")).toBe(true);
		expect(formatted.endsWith(" test@host\n")).toBe(true);

		const parsed = parseOpenSshPublicKey(formatted);
		expect(parsed.algorithm).toBe("ssh-ed25519");
		expect(Array.from(parsed.rawKey)).toEqual(Array.from(rawKey));
		expect(parsed.comment).toBe("test@host");
	});

	test("rejects invalid key formats and unsupported algorithms", () => {
		expect(() => parseOpenSshPublicKey("")).toThrow(SshValidationError);
		expect(() => parseOpenSshPublicKey("invalid-key")).toThrow(
			SshValidationError,
		);
		expect(() => parseOpenSshPublicKey("ssh-rsa AAAA invalid-key")).toThrow(
			SshValidationError,
		);
	});
});

describe("@id/crypto: SSH CA & Certificate Issuance", () => {
	test("generates CA key pair and issues verified certificate", async () => {
		const { privateKeyJwk, publicOpenSsh, fingerprint } =
			await generateCaKeyPairJwk();
		expect(privateKeyJwk).toBeDefined();
		expect(publicOpenSsh.startsWith("ssh-ed25519 ")).toBe(true);
		expect(fingerprint.startsWith("SHA256:")).toBe(true);

		const ca = await createSshCaContext(privateKeyJwk);
		expect(ca.fingerprint).toBe(fingerprint);

		const clientKeyPair = (await crypto.subtle.generateKey(
			{ name: "Ed25519" },
			true,
			["sign", "verify"],
		)) as unknown as CryptoKeyPair;
		const clientRawPub = new Uint8Array(
			(await crypto.subtle.exportKey(
				"raw",
				clientKeyPair.publicKey,
			)) as ArrayBuffer,
		);
		const clientOpenSsh = formatOpenSshEd25519PublicKey(
			clientRawPub,
			"hazel@laptop",
		);

		const result = await issueUserCertificate(ca, {
			userPublicKey: clientOpenSsh,
			keyId: "hazel@example.com",
			principals: ["hazel", "ubuntu", "root"],
			ttlSeconds: 3600,
		});

		expect(result.certificate).toBeDefined();
		expect(
			result.certificate.startsWith("ssh-ed25519-cert-v01@openssh.com "),
		).toBe(true);
		expect(result.keyId).toBe("hazel@example.com");
		expect(result.principals).toEqual(["hazel", "ubuntu", "root"]);

		const parsedCert = parseOpenSshCertificate(result.certificate);
		expect(parsedCert.certType).toBe("ssh-ed25519-cert-v01@openssh.com");
		expect(parsedCert.keyId).toBe("hazel@example.com");
		expect(parsedCert.principals).toEqual(["hazel", "ubuntu", "root"]);
		expect(Array.from(parsedCert.rawClientPublicKey)).toEqual(
			Array.from(clientRawPub),
		);
		expect(Object.keys(parsedCert.extensions)).toEqual(
			expect.arrayContaining([...DEFAULT_USER_EXTENSIONS]),
		);
	});
});

describe("@id/crypto: SSH Principals Derivation", () => {
	test("derives POSIX usernames safely from email and display name", () => {
		expect(
			deriveDefaultPrincipal({
				id: "1",
				email: "hazel@example.com",
				displayName: "Hazel",
			}),
		).toBe("hazel");

		expect(
			deriveDefaultPrincipal({
				id: "2",
				email: "john.doe+work@company.com",
			}),
		).toBe("john_doe_work");
	});

	test("calculates permitted principals based on roles and permissions", () => {
		const user = { id: "user-1", email: "alice@test.org" };
		const principals = getPermittedPrincipals(user, ["user"], new Set());
		expect(principals).toEqual(["alice"]);
	});
});

describe("@id/crypto: SSH Key Revocation List (KRL)", () => {
	test("builds and parses empty KRL", () => {
		const krlBytes = buildKrl({ comment: "" });
		expect(krlBytes.length).toBe(44);

		const rawReader = new SSHReader(krlBytes);
		expect(rawReader.readUint64()).toBe(KRL_MAGIC);
		expect(rawReader.readUint32()).toBe(KRL_FORMAT_VERSION);

		const parsed = parseKrl(krlBytes);
		expect(parsed.version).toBe(0n);
		expect(parsed.comment).toBe("");
	});

	test("builds and parses KRL with serial list", () => {
		const krlBytes = buildKrl({
			serials: [100n, 200n],
			comment: "Revocation test",
		});

		const parsed = parseKrl(krlBytes);
		expect(parsed.comment).toBe("Revocation test");
		expect(parsed.certSections).toHaveLength(1);
		expect(parsed.certSections[0].serials).toEqual([100n, 200n]);
	});
});
