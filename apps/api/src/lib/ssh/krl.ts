import { SSHReader, SSHWriter } from "./wire";

/**
 * OpenSSH Key Revocation List (KRL) binary format constants conforming to PROTOCOL.krl.
 */
export const KRL_MAGIC = 0x5353484b524c0a00n; // "SSHKRL\n\0"
export const KRL_FORMAT_VERSION = 1;

export const KRL_SECTION_CERTIFICATES = 1;
export const KRL_SECTION_EXPLICIT_KEY = 2;
export const KRL_SECTION_FINGERPRINT_SHA1 = 3;
export const KRL_SECTION_SIGNATURE = 4;
export const KRL_SECTION_FINGERPRINT_SHA256 = 5;
export const KRL_SECTION_EXTENSION = 255;

export const KRL_SECTION_CERT_SERIAL_LIST = 0x20;
export const KRL_SECTION_CERT_SERIAL_RANGE = 0x21;
export const KRL_SECTION_CERT_SERIAL_BITMAP = 0x22;
export const KRL_SECTION_CERT_KEY_ID = 0x23;
export const KRL_SECTION_CERT_EXTENSION = 0x39;

const MAX_UINT64 = 0xffffffffffffffffn;

export interface BuildKrlOptions {
	/**
	 * Wire-serialized CA public key. If omitted or empty, the certificate revocation
	 * section applies to all CAs (wildcard CA).
	 */
	caWireKey?: Uint8Array;
	/**
	 * Revoked certificate serial numbers (bigint, number, or string representation).
	 */
	serials?: (bigint | number | string)[];
	/**
	 * Monotonic KRL version counter (default: 0).
	 */
	version?: bigint | number;
	/**
	 * Generation timestamp in seconds since UNIX epoch (default: current time).
	 */
	generatedDate?: bigint | number;
	/**
	 * Optional human-readable comment embedded in the KRL header.
	 */
	comment?: string;
}

export interface ParsedKrlCertSection {
	/** Wire-serialized CA public key, or undefined for wildcard CA. */
	caKey?: Uint8Array;
	/** List of revoked certificate serial numbers in this section. */
	serials: bigint[];
}

export interface ParsedKrl {
	version: bigint;
	generatedDate: bigint;
	flags: bigint;
	comment: string;
	certSections: ParsedKrlCertSection[];
}

/**
 * Builds an OpenSSH Key Revocation List (KRL) binary buffer adhering to OpenSSH PROTOCOL.krl.
 *
 * @param options KRL build configuration including CA wire key, serials, and version metadata.
 * @returns Complete binary KRL buffer ready for direct use by `sshd` RevokedKeys.
 */
export function buildKrl(options: BuildKrlOptions = {}): Uint8Array {
	const writer = new SSHWriter();

	// 1. KRL Header (44 bytes when comment is empty)
	writer.writeUint64(KRL_MAGIC);
	writer.writeUint32(KRL_FORMAT_VERSION);
	writer.writeUint64(BigInt(options.version ?? 0));

	const generatedDate =
		options.generatedDate !== undefined
			? BigInt(options.generatedDate)
			: BigInt(Math.floor(Date.now() / 1000));
	writer.writeUint64(generatedDate);
	writer.writeUint64(0n); // flags (none currently defined)
	writer.writeString(""); // reserved
	writer.writeString(options.comment ?? "");

	// 2. Revoked Certificate Section
	const rawSerials = options.serials ?? [];
	if (rawSerials.length > 0) {
		const parsedSerials = rawSerials.map((s) => {
			const b = BigInt(s);
			if (b < 0n || b > MAX_UINT64) {
				throw new RangeError(
					`Certificate serial out of 64-bit unsigned range: ${s}`,
				);
			}
			return b;
		});

		// Deduplicate and sort ascending
		const serials = Array.from(new Set(parsedSerials)).sort((a, b) =>
			a < b ? -1 : a > b ? 1 : 0,
		);

		// Subsection: KRL_SECTION_CERT_SERIAL_LIST (0x20)
		const subSectionWriter = new SSHWriter();
		for (const serial of serials) {
			subSectionWriter.writeUint64(serial);
		}

		// Section: KRL_SECTION_CERTIFICATES (1)
		const certSectionWriter = new SSHWriter();
		if (options.caWireKey && options.caWireKey.length > 0) {
			certSectionWriter.writeBytes(options.caWireKey);
		} else {
			certSectionWriter.writeBytes(new Uint8Array(0));
		}
		certSectionWriter.writeString(""); // reserved

		// Append serial list subsection
		certSectionWriter.writeUint8(KRL_SECTION_CERT_SERIAL_LIST);
		certSectionWriter.writeBytes(subSectionWriter.toUint8Array());

		// Outer section wrapper
		writer.writeUint8(KRL_SECTION_CERTIFICATES);
		writer.writeBytes(certSectionWriter.toUint8Array());
	}

	return writer.toUint8Array();
}

/**
 * Parses an OpenSSH Key Revocation List (KRL) binary buffer.
 *
 * @param buffer Raw binary KRL buffer.
 * @returns Parsed header and revocation section details.
 */
export function parseKrl(buffer: Uint8Array): ParsedKrl {
	const reader = new SSHReader(buffer);

	const magic = reader.readUint64();
	if (magic !== KRL_MAGIC) {
		throw new Error(
			`Invalid KRL magic number: expected 0x${KRL_MAGIC.toString(16)}, got 0x${magic.toString(16)}`,
		);
	}

	const formatVersion = reader.readUint32();
	if (formatVersion !== KRL_FORMAT_VERSION) {
		throw new Error(
			`Unsupported KRL format version: expected ${KRL_FORMAT_VERSION}, got ${formatVersion}`,
		);
	}

	const version = reader.readUint64();
	const generatedDate = reader.readUint64();
	const flags = reader.readUint64();
	reader.readBytes(); // reserved
	const comment = reader.readString();

	const certSections: ParsedKrlCertSection[] = [];

	while (reader.hasRemaining()) {
		const sectionType = reader.readUint8();
		const sectionBytes = reader.readBytes();

		if (sectionType === KRL_SECTION_CERTIFICATES) {
			const secReader = new SSHReader(sectionBytes);
			const caKeyBytes = secReader.readBytes();
			secReader.readBytes(); // reserved

			const serials: bigint[] = [];
			while (secReader.hasRemaining()) {
				const certSecType = secReader.readUint8();
				const certSecBytes = secReader.readBytes();

				if (certSecType === KRL_SECTION_CERT_SERIAL_LIST) {
					const subReader = new SSHReader(certSecBytes);
					while (subReader.hasRemaining()) {
						serials.push(subReader.readUint64());
					}
				}
			}

			certSections.push({
				caKey: caKeyBytes.length > 0 ? caKeyBytes : undefined,
				serials,
			});
		}
	}

	return {
		version,
		generatedDate,
		flags,
		comment,
		certSections,
	};
}
