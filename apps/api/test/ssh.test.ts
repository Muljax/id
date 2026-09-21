import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
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
} from "../src/lib/ssh";

describe("SSH Wire Format (RFC 4251)", () => {
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

describe("SSH Public Keys & Validation", () => {
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

	test("rejects all-zeros Ed25519 public key", () => {
		const zeroKey = new Uint8Array(32);
		expect(() => formatOpenSshEd25519PublicKey(zeroKey)).toThrow(
			SshValidationError,
		);
	});

	test("rejects public keys exceeding maximum byte length", () => {
		const hugeKey = `ssh-ed25519 ${"A".repeat(3000)} comment`;
		expect(() => parseOpenSshPublicKey(hugeKey)).toThrow(SshValidationError);
	});
});

describe("SSH Certificate Authority Engine & Input Hardening", () => {
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
		)) as CryptoKeyPair;
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
		expect(result.caFingerprint).toBe(fingerprint);
		expect(result.validBefore - result.validAfter).toBe(3660);

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

		const verifyKey = await crypto.subtle.importKey(
			"raw",
			ca.rawPublicKey,
			{ name: "Ed25519" },
			false,
			["verify"],
		);

		const sigBlockLength = 4 + (4 + 11) + (4 + 64);
		const signedPayload = result.wireBytes.subarray(
			0,
			result.wireBytes.length - sigBlockLength,
		);

		const isValidSig = await crypto.subtle.verify(
			{ name: "Ed25519" },
			verifyKey,
			parsedCert.caSignature.signature,
			signedPayload,
		);
		expect(isValidSig).toBe(true);

		const certPath = resolve(
			tmpdir(),
			`test-cert-${Date.now()}-${Math.random().toString(36).slice(2)}.pub`,
		);
		try {
			writeFileSync(certPath, result.certificate);
			const inspectOutput = execSync(`ssh-keygen -L -f ${certPath}`).toString();

			expect(inspectOutput).toContain(
				"ssh-ed25519-cert-v01@openssh.com user certificate",
			);
			expect(inspectOutput).toContain('Key ID: "hazel@example.com"');
			expect(inspectOutput).toContain("hazel");
			expect(inspectOutput).toContain("ubuntu");
			expect(inspectOutput).toContain("root");
			expect(inspectOutput).toContain("permit-pty");
		} finally {
			try {
				unlinkSync(certPath);
			} catch {}
		}
	});

	test("rejects issuance with empty or invalid principals", async () => {
		const { privateKeyJwk } = await generateCaKeyPairJwk();
		const ca = await createSshCaContext(privateKeyJwk);
		const clientKey = formatOpenSshEd25519PublicKey(
			crypto.getRandomValues(new Uint8Array(32)),
		);

		// Empty principals list
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "user@test.org",
				principals: [],
			}),
		).rejects.toThrow(SshValidationError);

		// Principal injection with commas
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "user@test.org",
				principals: ["user,root"],
			}),
		).rejects.toThrow(SshValidationError);

		// Principal starting with hyphen
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "user@test.org",
				principals: ["-flag"],
			}),
		).rejects.toThrow(SshValidationError);

		// Principal with spaces
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "user@test.org",
				principals: ["user name"],
			}),
		).rejects.toThrow(SshValidationError);
	});

	test("rejects key IDs with log injection or control characters", async () => {
		const { privateKeyJwk } = await generateCaKeyPairJwk();
		const ca = await createSshCaContext(privateKeyJwk);
		const clientKey = formatOpenSshEd25519PublicKey(
			crypto.getRandomValues(new Uint8Array(32)),
		);

		// Newline log injection
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "admin\nAccepted password for root",
				principals: ["ubuntu"],
			}),
		).rejects.toThrow(SshValidationError);

		// Carriage return
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "admin\r\n",
				principals: ["ubuntu"],
			}),
		).rejects.toThrow(SshValidationError);

		// Empty key ID
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "",
				principals: ["ubuntu"],
			}),
		).rejects.toThrow(SshValidationError);
	});

	test("validates critical options like source-address CIDR", async () => {
		const { privateKeyJwk } = await generateCaKeyPairJwk();
		const ca = await createSshCaContext(privateKeyJwk);
		const clientKey = formatOpenSshEd25519PublicKey(
			crypto.getRandomValues(new Uint8Array(32)),
		);

		// Valid CIDR source address
		const validCert = await issueUserCertificate(ca, {
			userPublicKey: clientKey,
			keyId: "vpn-user",
			principals: ["dev"],
			criticalOptions: {
				"source-address": "10.0.0.0/8,192.168.1.100/32",
			},
		});
		expect(validCert.certificate).toBeDefined();

		// Invalid CIDR source address
		expect(
			issueUserCertificate(ca, {
				userPublicKey: clientKey,
				keyId: "bad-vpn-user",
				principals: ["dev"],
				criticalOptions: {
					"source-address": "not-an-ip",
				},
			}),
		).rejects.toThrow(SshValidationError);
	});
});

describe("SSH Principals Derivation & Access Control", () => {
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

		expect(
			deriveDefaultPrincipal({
				id: "3",
				email: "---weird---@test.org",
			}),
		).toBe("weird___");
	});

	test("restricts standard users to their derived principal", () => {
		const user = { id: "user-1", email: "alice@test.org" };
		const principals = getPermittedPrincipals(user, ["user"], new Set());
		expect(principals).toEqual(["alice"]);
	});

	test("grants admin principals when user has admin role or ssh:* permission", () => {
		const user = { id: "admin-1", email: "admin@test.org" };

		// Via admin role
		const adminRolePrincipals = getPermittedPrincipals(
			user,
			["admin"],
			new Set(),
		);
		expect(adminRolePrincipals).toContain("admin");
		expect(adminRolePrincipals).toContain("root");
		expect(adminRolePrincipals).toContain("ubuntu");

		// Via ssh:* wildcard permission
		const sshWildcardPrincipals = getPermittedPrincipals(
			user,
			["user"],
			new Set(["ssh:*"]),
		);
		expect(sshWildcardPrincipals).toContain("root");
		expect(sshWildcardPrincipals).toContain("admin");
	});

	test("grants specific custom principals when user has ssh:principal:<name> permissions", () => {
		const user = { id: "dev-1", email: "bob@company.com" };
		const permissions = new Set([
			"ssh:cert:issue",
			"ssh:keys:manage",
			"ssh:ca:read",
			"ssh:principal:deploy",
			"ssh:principal:staging-runner",
		]);

		const permitted = getPermittedPrincipals(user, ["user"], permissions);
		expect(permitted).toContain("bob");
		expect(permitted).toContain("deploy");
		expect(permitted).toContain("staging-runner");
		expect(permitted).not.toContain("root");
		expect(permitted).not.toContain("admin");
	});

	test("grants admin principals when user has ssh:principal:* permission", () => {
		const user = { id: "ops-1", email: "ops@company.com" };
		const permissions = new Set(["ssh:cert:issue", "ssh:principal:*"]);

		const permitted = getPermittedPrincipals(user, ["user"], permissions);
		expect(permitted).toContain("ops");
		expect(permitted).toContain("root");
		expect(permitted).toContain("admin");
		expect(permitted).toContain("ubuntu");
	});
});

describe("Universal 'Everyone' Role & Read-Only Permissions", () => {
	test("identifies read-only permissions correctly", async () => {
		const { isReadOnlyPermission, SYSTEM_ROLE_IDS, DEFAULT_ROLES } =
			await import("../src/lib/rbac/constants");

		expect(isReadOnlyPermission("ssh:ca:read")).toBe(true);
		expect(isReadOnlyPermission("users:read")).toBe(true);
		expect(isReadOnlyPermission("roles:read")).toBe(true);
		expect(isReadOnlyPermission("settings:read")).toBe(true);

		expect(isReadOnlyPermission("ssh:cert:issue")).toBe(false);
		expect(isReadOnlyPermission("ssh:keys:manage")).toBe(false);
		expect(isReadOnlyPermission("ssh:cert:revoke")).toBe(false);
		expect(isReadOnlyPermission("users:write")).toBe(false);
		expect(isReadOnlyPermission("*")).toBe(false);

		const everyoneRole = DEFAULT_ROLES.find(
			(r) => r.id === SYSTEM_ROLE_IDS.EVERYONE,
		);
		expect(everyoneRole).toBeDefined();
		expect(everyoneRole?.permissions).toContain("ssh:ca:read");
		expect(everyoneRole?.isSystem).toBe(true);
	});
});

describe("OpenSSH Key Revocation List (KRL Binary Wire Format)", () => {
	test("builds and parses empty KRL conforming to 44-byte PROTOCOL.krl header", () => {
		const krlBytes = buildKrl({ comment: "" });
		// Header without comment payload is exactly 44 bytes
		expect(krlBytes.length).toBe(44);

		const rawReader = new SSHReader(krlBytes);
		expect(rawReader.readUint64()).toBe(KRL_MAGIC);
		expect(rawReader.readUint32()).toBe(KRL_FORMAT_VERSION);

		const parsed = parseKrl(krlBytes);
		expect(parsed.version).toBe(0n);
		expect(parsed.comment).toBe("");
		expect(parsed.certSections).toHaveLength(0);

		// Validate with native ssh-keygen -Q -l -f
		const krlPath = resolve(
			tmpdir(),
			`test-empty-krl-${Date.now()}-${Math.random().toString(36).slice(2)}.krl`,
		);
		try {
			writeFileSync(krlPath, krlBytes);
			const inspectOutput = execSync(
				`ssh-keygen -Q -l -f ${krlPath}`,
			).toString();
			expect(inspectOutput).toContain("# KRL version 0");
		} finally {
			try {
				unlinkSync(krlPath);
			} catch {}
		}
	});

	test("builds and parses KRL with wildcard CA and verifies with ssh-keygen", () => {
		const krlBytes = buildKrl({
			serials: [100n, 200n],
			comment: "Wildcard CA test",
		});

		const parsed = parseKrl(krlBytes);
		expect(parsed.comment).toBe("Wildcard CA test");
		expect(parsed.certSections).toHaveLength(1);
		expect(parsed.certSections[0].caKey).toBeUndefined();
		expect(parsed.certSections[0].serials).toEqual([100n, 200n]);

		const krlPath = resolve(
			tmpdir(),
			`test-wildcard-krl-${Date.now()}-${Math.random().toString(36).slice(2)}.krl`,
		);
		try {
			writeFileSync(krlPath, krlBytes);
			const inspectOutput = execSync(
				`ssh-keygen -Q -l -f ${krlPath}`,
			).toString();
			expect(inspectOutput).toContain("# Wildcard CA");
			expect(inspectOutput).toContain("serial: 100");
			expect(inspectOutput).toContain("serial: 200");
		} finally {
			try {
				unlinkSync(krlPath);
			} catch {}
		}
	});

	test("builds KRL scoped to CA public key and revokes issued certificate", async () => {
		const { privateKeyJwk } = await generateCaKeyPairJwk();
		const ca = await createSshCaContext(privateKeyJwk);

		const clientKeyA = formatOpenSshEd25519PublicKey(
			crypto.getRandomValues(new Uint8Array(32)),
		);
		const clientKeyB = formatOpenSshEd25519PublicKey(
			crypto.getRandomValues(new Uint8Array(32)),
		);

		const certA = await issueUserCertificate(ca, {
			userPublicKey: clientKeyA,
			keyId: "revoked-user@test.org",
			principals: ["revoked-user"],
			serial: 1001n,
		});

		const certB = await issueUserCertificate(ca, {
			userPublicKey: clientKeyB,
			keyId: "valid-user@test.org",
			principals: ["valid-user"],
			serial: 1002n,
		});

		const krlBytes = buildKrl({
			caWireKey: ca.publicWire,
			serials: [1001n],
			comment: "Revoke certA",
		});

		const parsed = parseKrl(krlBytes);
		expect(parsed.certSections).toHaveLength(1);
		expect(parsed.certSections[0].caKey).toBeDefined();
		expect(parsed.certSections[0].serials).toEqual([1001n]);

		const baseTmp = `${tmpdir()}/krl-revocation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		const krlPath = `${baseTmp}.krl`;
		const certAPath = `${baseTmp}-a.pub`;
		const certBPath = `${baseTmp}-b.pub`;

		try {
			writeFileSync(krlPath, krlBytes);
			writeFileSync(certAPath, certA.certificate);
			writeFileSync(certBPath, certB.certificate);

			// Inspect list
			const inspectOutput = execSync(
				`ssh-keygen -Q -l -f ${krlPath}`,
			).toString();
			expect(inspectOutput).toContain(ca.fingerprint);
			expect(inspectOutput).toContain("serial: 1001");
			expect(inspectOutput).not.toContain("serial: 1002");

			// Query certA: must be detected as REVOKED (ssh-keygen returns exit status 1)
			let certARevoked = false;
			try {
				execSync(`ssh-keygen -Q -f ${krlPath} ${certAPath}`);
			} catch (err: unknown) {
				const execErr = err as {
					status?: number;
					stdout?: Buffer;
					stderr?: Buffer;
				};
				certARevoked =
					execErr.status === 1 &&
					(execErr.stdout?.toString().includes("REVOKED") ||
						execErr.stderr?.toString().includes("REVOKED"));
			}
			expect(certARevoked).toBe(true);

			// Query certB: must succeed (exit code 0, not revoked)
			const queryB = execSync(
				`ssh-keygen -Q -f ${krlPath} ${certBPath}`,
			).toString();
			expect(queryB).not.toContain("REVOKED");
		} finally {
			try {
				unlinkSync(krlPath);
				unlinkSync(certAPath);
				unlinkSync(certBPath);
			} catch {}
		}
	});

	test("deduplicates and sorts serial numbers ascending", () => {
		const krlBytes = buildKrl({
			serials: ["9999", "100", 500, 100n, "500"],
		});
		const parsed = parseKrl(krlBytes);
		expect(parsed.certSections[0].serials).toEqual([100n, 500n, 9999n]);
	});

	test("rejects invalid and out-of-range serial numbers", () => {
		expect(() => buildKrl({ serials: [-1n] })).toThrow(RangeError);
		expect(() => buildKrl({ serials: [0xffffffffffffffffn + 1n] })).toThrow(
			RangeError,
		);
	});
});

describe("SSH CA Public Key Content Negotiation", () => {
	test("serves raw OpenSSH key on format=raw, format=text, or Accept: text/plain", async () => {
		const { default: caPublicKeyRoute } = await import(
			"../src/routes/ssh/ca/public-key/get"
		);
		const { privateKeyJwk } = await generateCaKeyPairJwk();

		const app = caPublicKeyRoute;

		// 1. JSON default
		const resJson = await app.request(
			"http://localhost/",
			{
				headers: {
					accept: "application/json",
				},
			},
			{
				SSH_CA_PRIVATE_KEY: privateKeyJwk,
			} as never,
		);
		expect(resJson.status).toBe(200);
		const jsonData = (await resJson.json()) as {
			algorithm: string;
			publicKey: string;
			fingerprint: string;
		};
		expect(jsonData.algorithm).toBe("ssh-ed25519");
		expect(jsonData.publicKey.startsWith("ssh-ed25519 ")).toBe(true);

		// 2. Query param ?format=raw
		const resRaw = await app.request("http://localhost/?format=raw", {}, {
			SSH_CA_PRIVATE_KEY: privateKeyJwk,
		} as never);
		expect(resRaw.status).toBe(200);
		expect(resRaw.headers.get("content-type")).toContain("text/plain");
		const rawText = await resRaw.text();
		expect(rawText.startsWith("ssh-ed25519 ")).toBe(true);

		// 3. Header Accept: text/plain
		const resAcceptText = await app.request(
			"http://localhost/",
			{
				headers: {
					accept: "text/plain",
				},
			},
			{
				SSH_CA_PRIVATE_KEY: privateKeyJwk,
			} as never,
		);
		expect(resAcceptText.status).toBe(200);
		expect(resAcceptText.headers.get("content-type")).toContain("text/plain");
		const acceptText = await resAcceptText.text();
		expect(acceptText.startsWith("ssh-ed25519 ")).toBe(true);
	});
});
