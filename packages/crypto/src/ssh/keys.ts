import { base64Decode, base64Encode } from "../bytes/base64";
import {
	SshValidationError,
	validateEd25519RawKey,
	validatePublicKeyString,
} from "./validation";
import { SSHReader, SSHWriter } from "./wire";

export interface ParsedSshPublicKey {
	/** Key algorithm identifier (e.g. "ssh-ed25519"). */
	algorithm: string;
	/** Raw public key bytes. */
	rawKey: Uint8Array;
	/** Wire-encoded public key payload. */
	wireBytes: Uint8Array;
	/** Trailing comment string from the public key line, if present. */
	comment?: string;
}

/**
 * Calculates the standard OpenSSH SHA-256 fingerprint for a public key wire blob.
 *
 * @param wireBytes Complete SSH wire format public key bytes.
 * @returns Fingerprint in OpenSSH format (`SHA256:<base64-without-padding>`).
 */
export async function calculateFingerprint(
	wireBytes: Uint8Array,
): Promise<string> {
	const hashBuffer = await crypto.subtle.digest(
		"SHA-256",
		wireBytes as BufferSource,
	);
	const hashBytes = new Uint8Array(hashBuffer);
	return `SHA256:${base64Encode(hashBytes, true)}`;
}

/**
 * Parses and validates an OpenSSH single-line public key (`<type> <base64> [comment]`).
 *
 * @param keyString The single-line public key string.
 * @returns Parsed key details containing the raw public key bytes and wire blob.
 * @throws SshValidationError if the key format is malformed or uses an unsupported algorithm.
 */
export function parseOpenSshPublicKey(keyString: string): ParsedSshPublicKey {
	validatePublicKeyString(keyString);

	const parts = keyString.trim().split(/\s+/);
	const [algorithmType, base64Blob, ...commentParts] = parts;
	const comment = commentParts.length > 0 ? commentParts.join(" ") : undefined;

	let wireBytes: Uint8Array;
	try {
		wireBytes = base64Decode(base64Blob);
	} catch {
		throw new SshValidationError(
			"Invalid base64 encoding in SSH public key.",
			"INVALID_KEY_FORMAT",
		);
	}

	try {
		const reader = new SSHReader(wireBytes);
		const algorithm = reader.readString();

		if (algorithm !== algorithmType) {
			throw new SshValidationError(
				`Algorithm mismatch in SSH public key: prefix is '${algorithmType}' but wire format header is '${algorithm}'.`,
				"INVALID_KEY_FORMAT",
			);
		}

		if (algorithm === "ssh-ed25519") {
			const rawKey = reader.readBytes();
			validateEd25519RawKey(rawKey);

			return {
				algorithm,
				rawKey,
				wireBytes,
				comment,
			};
		}

		throw new SshValidationError(
			`Unsupported SSH public key algorithm '${algorithm}'. Only 'ssh-ed25519' is supported.`,
			"UNSUPPORTED_ALGORITHM",
		);
	} catch (error) {
		if (error instanceof SshValidationError) {
			throw error;
		}
		throw new SshValidationError(
			"Malformed SSH public key wire format.",
			"INVALID_KEY_FORMAT",
		);
	}
}

/**
 * Serializes an Ed25519 raw public key into an OpenSSH single-line string.
 *
 * @param rawPublicKey 32-byte Ed25519 public key.
 * @param comment Optional comment appended to the key line.
 * @returns Formatted OpenSSH public key line.
 */
export function formatOpenSshEd25519PublicKey(
	rawPublicKey: Uint8Array,
	comment?: string,
): string {
	validateEd25519RawKey(rawPublicKey);

	const writer = new SSHWriter();
	writer.writeString("ssh-ed25519");
	writer.writeBytes(rawPublicKey);
	const wireBytes = writer.toUint8Array();

	const b64 = base64Encode(wireBytes);
	return comment ? `ssh-ed25519 ${b64} ${comment}\n` : `ssh-ed25519 ${b64}\n`;
}

/**
 * Builds the RFC 4251 wire format representation of an Ed25519 public key.
 *
 * @param rawPublicKey 32-byte Ed25519 public key.
 * @returns Wire-encoded byte array (`string "ssh-ed25519"`, `string rawPublicKey`).
 */
export function buildEd25519PublicWire(rawPublicKey: Uint8Array): Uint8Array {
	validateEd25519RawKey(rawPublicKey);

	const writer = new SSHWriter();
	writer.writeString("ssh-ed25519");
	writer.writeBytes(rawPublicKey);
	return writer.toUint8Array();
}
