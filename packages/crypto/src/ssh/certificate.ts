import { base64Decode, base64Encode } from "../bytes/base64";
import { SSHReader, SSHWriter } from "./wire";

export const SSH_CERT_TYPE_USER = 1 as const;
export const SSH_CERT_TYPE_HOST = 2 as const;
export type OpenSshCertificateType =
	| typeof SSH_CERT_TYPE_USER
	| typeof SSH_CERT_TYPE_HOST;

export const ED25519_CERT_KEY_TYPE =
	"ssh-ed25519-cert-v01@openssh.com" as const;

export const DEFAULT_USER_EXTENSIONS: readonly string[] = [
	"permit-X11-forwarding",
	"permit-agent-forwarding",
	"permit-port-forwarding",
	"permit-pty",
	"permit-user-rc",
] as const;

export interface CertificateSigningData {
	/** Certified client raw Ed25519 public key (32 bytes). */
	rawClientPublicKey: Uint8Array;
	/** Monotonically increasing certificate serial number. */
	serial: bigint;
	/** Certificate type (1 = User, 2 = Host). Defaults to User. */
	type?: OpenSshCertificateType;
	/** Human-readable key identity (e.g. user email). */
	keyId: string;
	/** Valid UNIX principals (usernames or hostnames). */
	principals: string[];
	/** Valid after (UNIX epoch seconds). */
	validAfter: bigint;
	/** Valid before (UNIX epoch seconds). */
	validBefore: bigint;
	/** Critical options key-value mapping. */
	criticalOptions?: Record<string, string>;
	/** Allowed extensions or name-value mappings. */
	extensions?: string[] | Record<string, string>;
	/** CA public key wire blob. */
	caPublicWire: Uint8Array;
	/** Optional explicit nonce (16-32 random bytes; generated if omitted). */
	nonce?: Uint8Array;
}

export interface ParsedOpenSshCertificate {
	/** Certificate algorithm identifier. */
	certType: string;
	/** Cryptographic nonce. */
	nonce: Uint8Array;
	/** Certified client raw public key bytes. */
	rawClientPublicKey: Uint8Array;
	/** Certificate serial number. */
	serial: bigint;
	/** Certificate role type (1 = User, 2 = Host). */
	type: number;
	/** Key identity string. */
	keyId: string;
	/** Authorized principals list. */
	principals: string[];
	/** Validity start timestamp in UNIX epoch seconds. */
	validAfter: bigint;
	/** Validity expiration timestamp in UNIX epoch seconds. */
	validBefore: bigint;
	/** Map of critical options. */
	criticalOptions: Record<string, string>;
	/** Map of enabled extensions. */
	extensions: Record<string, string>;
	/** CA public key wire blob. */
	caPublicWire: Uint8Array;
	/** CA signature details. */
	caSignature: {
		algorithm: string;
		signature: Uint8Array;
	};
}

/**
 * Encodes the unsigned certificate payload per OpenSSH PROTOCOL.certkeys.
 *
 * This payload includes all certificate fields from key_type through
 * signature_key, and represents the byte sequence signed by the CA private key.
 *
 * @param data Parameters describing the certificate to assemble.
 * @returns Unsigned certificate wire payload.
 */
export function buildCertificateToSign(
	data: CertificateSigningData,
): Uint8Array {
	if (data.rawClientPublicKey.length !== 32) {
		throw new Error(
			`Certified client Ed25519 key must be 32 bytes, got ${data.rawClientPublicKey.length}`,
		);
	}

	const writer = new SSHWriter();

	writer.writeString(ED25519_CERT_KEY_TYPE);

	const nonce = data.nonce ?? crypto.getRandomValues(new Uint8Array(16));
	writer.writeBytes(nonce);

	writer.writeBytes(data.rawClientPublicKey);
	writer.writeUint64(data.serial);
	writer.writeUint32(data.type ?? SSH_CERT_TYPE_USER);
	writer.writeString(data.keyId);

	const principalsWriter = new SSHWriter();
	for (const principal of data.principals) {
		principalsWriter.writeString(principal);
	}
	writer.writeBytes(principalsWriter.toUint8Array());

	writer.writeUint64(data.validAfter);
	writer.writeUint64(data.validBefore);

	const strcmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

	const critWriter = new SSHWriter();
	if (data.criticalOptions) {
		const sortedOptions = Object.entries(data.criticalOptions).sort(
			([a], [b]) => strcmp(a, b),
		);
		for (const [name, val] of sortedOptions) {
			critWriter.writeString(name);
			const innerWriter = new SSHWriter();
			innerWriter.writeString(val);
			critWriter.writeBytes(innerWriter.toUint8Array());
		}
	}
	writer.writeBytes(critWriter.toUint8Array());

	const extWriter = new SSHWriter();
	if (Array.isArray(data.extensions)) {
		const sortedExts = [...data.extensions].sort(strcmp);
		for (const extName of sortedExts) {
			extWriter.writeString(extName);
			extWriter.writeBytes(new Uint8Array(0));
		}
	} else if (data.extensions) {
		const sortedExts = Object.entries(data.extensions).sort(([a], [b]) =>
			strcmp(a, b),
		);
		for (const [name, val] of sortedExts) {
			extWriter.writeString(name);
			if (val) {
				const innerWriter = new SSHWriter();
				innerWriter.writeString(val);
				extWriter.writeBytes(innerWriter.toUint8Array());
			} else {
				extWriter.writeBytes(new Uint8Array(0));
			}
		}
	} else {
		const sortedExts = [...DEFAULT_USER_EXTENSIONS].sort(strcmp);
		for (const extName of sortedExts) {
			extWriter.writeString(extName);
			extWriter.writeBytes(new Uint8Array(0));
		}
	}
	writer.writeBytes(extWriter.toUint8Array());

	writer.writeBytes(new Uint8Array(0));
	writer.writeBytes(data.caPublicWire);

	return writer.toUint8Array();
}

export function buildSignedCertificateWire(
	toSign: Uint8Array,
	rawSignature: Uint8Array,
	sigAlgorithm = "ssh-ed25519",
): Uint8Array {
	const sigBlockWriter = new SSHWriter();
	sigBlockWriter.writeString(sigAlgorithm);
	sigBlockWriter.writeBytes(rawSignature);
	const sigBlock = sigBlockWriter.toUint8Array();

	const fullWriter = new SSHWriter();
	fullWriter.writeRaw(toSign);
	fullWriter.writeBytes(sigBlock);

	return fullWriter.toUint8Array();
}

/**
 * Formats a binary OpenSSH certificate wire blob into standard file format (`<type> <base64> [comment]`).
 *
 * @param certWireBytes Complete binary certificate bytes.
 * @param comment Optional trailing comment identifier.
 * @returns Single-line OpenSSH certificate string suitable for `.pub` certificate files.
 */
export function formatOpenSshCertificate(
	certWireBytes: Uint8Array,
	comment?: string,
): string {
	const b64 = base64Encode(certWireBytes);
	return comment
		? `${ED25519_CERT_KEY_TYPE} ${b64} ${comment}\n`
		: `${ED25519_CERT_KEY_TYPE} ${b64}\n`;
}

/**
 * Parses and deserializes a binary OpenSSH certificate wire blob (or base64 string).
 *
 * @param input The OpenSSH certificate string (or raw Uint8Array wire bytes).
 * @returns Deserialized certificate fields and public key data.
 */
export function parseOpenSshCertificate(
	input: string | Uint8Array,
): ParsedOpenSshCertificate {
	let wireBytes: Uint8Array;

	if (typeof input === "string") {
		const parts = input.trim().split(/\s+/);
		if (parts.length < 2) {
			throw new Error("Invalid OpenSSH certificate string");
		}
		wireBytes = base64Decode(parts[1]);
	} else {
		wireBytes = input;
	}

	const reader = new SSHReader(wireBytes);
	const certType = reader.readString();
	if (certType !== ED25519_CERT_KEY_TYPE) {
		throw new Error(`Unsupported certificate algorithm: '${certType}'`);
	}

	const nonce = reader.readBytes();
	const rawClientPublicKey = reader.readBytes();
	const serial = reader.readUint64();
	const type = reader.readUint32();
	const keyId = reader.readString();

	const principalsBytes = reader.readBytes();
	const principalsReader = new SSHReader(principalsBytes);
	const principals: string[] = [];
	while (principalsReader.hasRemaining()) {
		principals.push(principalsReader.readString());
	}

	const validAfter = reader.readUint64();
	const validBefore = reader.readUint64();

	const critBytes = reader.readBytes();
	const critReader = new SSHReader(critBytes);
	const criticalOptions: Record<string, string> = {};
	while (critReader.hasRemaining()) {
		const name = critReader.readString();
		const valBytes = critReader.readBytes();
		if (valBytes.length > 0) {
			try {
				const valReader = new SSHReader(valBytes);
				criticalOptions[name] = valReader.readString();
			} catch {
				criticalOptions[name] = new TextDecoder().decode(valBytes);
			}
		} else {
			criticalOptions[name] = "";
		}
	}

	const extBytes = reader.readBytes();
	const extReader = new SSHReader(extBytes);
	const extensions: Record<string, string> = {};
	while (extReader.hasRemaining()) {
		const name = extReader.readString();
		const valBytes = extReader.readBytes();
		if (valBytes.length > 0) {
			try {
				const valReader = new SSHReader(valBytes);
				extensions[name] = valReader.readString();
			} catch {
				extensions[name] = new TextDecoder().decode(valBytes);
			}
		} else {
			extensions[name] = "";
		}
	}

	reader.readBytes();

	const caPublicWire = reader.readBytes();

	const sigBlockBytes = reader.readBytes();
	const sigBlockReader = new SSHReader(sigBlockBytes);
	const sigAlgorithm = sigBlockReader.readString();
	const signature = sigBlockReader.readBytes();

	return {
		certType,
		nonce,
		rawClientPublicKey,
		serial,
		type,
		keyId,
		principals,
		validAfter,
		validBefore,
		criticalOptions,
		extensions,
		caPublicWire,
		caSignature: {
			algorithm: sigAlgorithm,
			signature,
		},
	};
}
