export class SshValidationError extends Error {
	constructor(
		message: string,
		public readonly code:
			| "INVALID_KEY_FORMAT"
			| "UNSUPPORTED_ALGORITHM"
			| "INVALID_KEY_LENGTH"
			| "INVALID_KEY_ID"
			| "INVALID_PRINCIPALS"
			| "INVALID_TTL"
			| "INVALID_EXTENSION"
			| "INVALID_CRITICAL_OPTION"
			| "INVALID_SERIAL",
	) {
		super(message);
		this.name = "SshValidationError";
	}
}

/**
 * Validates principal names (UNIX usernames or hostnames).
 *
 * Constraints:
 * - Must be 1 to 64 characters long.
 * - Allowed characters: ASCII alphanumeric, underscore, period, hyphen.
 * - Must not start with a hyphen (prevents command-line argument injection).
 * - Must not contain commas, colons, spaces, null bytes, or control characters
 *   (prevents OpenSSH `AuthorizedPrincipalsFile` parser confusion and log injection).
 */
const PRINCIPAL_REGEX = /^[a-zA-Z0-9_.][a-zA-Z0-9_.-]{0,63}$/;

/**
 * Validates key ID strings (embedded identity, e.g. email or username).
 *
 * Constraints:
 * - Must be 1 to 256 characters long.
 * - Printable ASCII characters only (code points 32 to 126).
 * - Must not contain newlines, carriage returns, tabs, or terminal escapes
 *   (prevents syslog forging and log injection on SSH servers).
 */
const KEY_ID_REGEX = /^[\x20-\x7E]{1,256}$/;

/**
 * Validates extension names.
 */
const EXTENSION_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Validates CIDR notation for the `source-address` critical option.
 */
const CIDR_REGEX =
	/^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?(,([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?)*$/;

/**
 * Validates an identity Key ID string.
 *
 * @param keyId User identifier to embed in the certificate.
 * @returns Trimmed, validated key ID.
 * @throws SshValidationError if invalid.
 */
export function validateKeyId(keyId: string): string {
	if (!keyId || typeof keyId !== "string" || !KEY_ID_REGEX.test(keyId)) {
		throw new SshValidationError(
			"Invalid Key ID: must contain only printable ASCII characters (1-256 chars) without newlines or control characters.",
			"INVALID_KEY_ID",
		);
	}
	return keyId;
}

/**
 * Validates and deduplicates a list of authorized UNIX principals.
 *
 * A certificate MUST have at least one principal. An empty principals list
 * in OpenSSH makes the certificate valid for ANY user on the server (including root).
 *
 * @param principals Array of requested principal names.
 * @returns Deduplicated array of valid principal names.
 * @throws SshValidationError if empty or if any principal is malformed.
 */
export function validatePrincipals(principals: string[]): string[] {
	if (!principals || principals.length === 0) {
		throw new SshValidationError(
			"Principals list cannot be empty. An empty principals list grants universal access in OpenSSH.",
			"INVALID_PRINCIPALS",
		);
	}

	const seen = new Set<string>();
	const validated: string[] = [];

	for (const p of principals) {
		const trimmed = p.trim();
		if (!PRINCIPAL_REGEX.test(trimmed)) {
			throw new SshValidationError(
				`Invalid principal '${trimmed}': must be 1-64 characters (alphanumeric, '.', '_', '-'), cannot start with '-', and cannot contain commas or spaces.`,
				"INVALID_PRINCIPALS",
			);
		}
		if (!seen.has(trimmed)) {
			seen.add(trimmed);
			validated.push(trimmed);
		}
	}

	return validated;
}

/**
 * Validates certificate validity duration (TTL).
 *
 * @param requestedTtl Requested TTL in seconds (optional).
 * @param maxTtl Maximum permitted TTL in seconds (default: 86400 / 24h).
 * @param minTtl Minimum permitted TTL in seconds (default: 300 / 5m).
 * @returns Clamped, validated TTL in seconds.
 * @throws SshValidationError if parameters are non-numeric or negative.
 */
export function validateTtl(
	requestedTtl?: number,
	maxTtl = 86400,
	minTtl = 300,
): number {
	const ttl = requestedTtl ?? 28800; // default 8 hours
	if (typeof ttl !== "number" || Number.isNaN(ttl) || ttl <= 0) {
		throw new SshValidationError(
			"TTL must be a positive number of seconds.",
			"INVALID_TTL",
		);
	}
	return Math.max(minTtl, Math.min(ttl, maxTtl));
}

/**
 * Validates an incoming OpenSSH public key line.
 *
 * @param keyString The single-line public key string.
 * @param maxByteLength Maximum allowed byte length (default: 2048 bytes).
 * @throws SshValidationError if key exceeds length limit or has malformed structure.
 */
export function validatePublicKeyString(
	keyString: string,
	maxByteLength = 2048,
): void {
	if (!keyString || typeof keyString !== "string") {
		throw new SshValidationError(
			"SSH public key must be a non-empty string.",
			"INVALID_KEY_FORMAT",
		);
	}

	if (keyString.length > maxByteLength) {
		throw new SshValidationError(
			`SSH public key exceeds maximum allowed length of ${maxByteLength} bytes.`,
			"INVALID_KEY_LENGTH",
		);
	}

	const parts = keyString.trim().split(/\s+/);
	if (parts.length < 2) {
		throw new SshValidationError(
			"Invalid OpenSSH public key format: expected `<type> <base64> [comment]`.",
			"INVALID_KEY_FORMAT",
		);
	}
}

/**
 * Validates raw Ed25519 public key bytes.
 *
 * @param rawKey 32-byte Ed25519 public key.
 * @throws SshValidationError if length is not 32 bytes or if the key point is invalid/all-zeros.
 */
export function validateEd25519RawKey(rawKey: Uint8Array): void {
	if (rawKey.length !== 32) {
		throw new SshValidationError(
			`Ed25519 public key must be exactly 32 bytes, got ${rawKey.length}.`,
			"INVALID_KEY_LENGTH",
		);
	}

	let isAllZeros = true;
	for (let i = 0; i < rawKey.length; i++) {
		if (rawKey[i] !== 0) {
			isAllZeros = false;
			break;
		}
	}

	if (isAllZeros) {
		throw new SshValidationError(
			"Ed25519 public key cannot be all zeros.",
			"INVALID_KEY_FORMAT",
		);
	}
}

/**
 * Validates extension names and options.
 *
 * @param extensions Array of extension names or name-value mapping.
 * @throws SshValidationError if an extension name contains invalid characters.
 */
export function validateExtensions(
	extensions?: string[] | Record<string, string>,
): void {
	if (!extensions) return;

	const names = Array.isArray(extensions)
		? extensions
		: Object.keys(extensions);
	for (const name of names) {
		if (!EXTENSION_NAME_REGEX.test(name)) {
			throw new SshValidationError(
				`Invalid extension name '${name}': must be alphanumeric with hyphens or underscores (max 64 chars).`,
				"INVALID_EXTENSION",
			);
		}
	}
}

/**
 * Validates critical options such as `source-address` and `force-command`.
 *
 * @param criticalOptions Mapping of critical options.
 * @throws SshValidationError if critical options contain invalid syntax.
 */
export function validateCriticalOptions(
	criticalOptions?: Record<string, string>,
): void {
	if (!criticalOptions) return;

	for (const [name, val] of Object.entries(criticalOptions)) {
		if (!EXTENSION_NAME_REGEX.test(name)) {
			throw new SshValidationError(
				`Invalid critical option name '${name}'.`,
				"INVALID_CRITICAL_OPTION",
			);
		}

		if (name === "source-address" && !CIDR_REGEX.test(val)) {
			throw new SshValidationError(
				`Invalid source-address '${val}': must be a comma-separated list of CIDR addresses (e.g. '192.168.1.0/24').`,
				"INVALID_CRITICAL_OPTION",
			);
		}

		if (name === "force-command" && (val.length === 0 || val.includes("\0"))) {
			throw new SshValidationError(
				"Invalid force-command: cannot be empty or contain null bytes.",
				"INVALID_CRITICAL_OPTION",
			);
		}
	}
}

/**
 * Validates certificate serial number.
 *
 * @param serial BigInt serial number.
 * @throws SshValidationError if serial is non-positive.
 */
export function validateSerial(serial: bigint): void {
	if (serial <= 0n) {
		throw new SshValidationError(
			"Certificate serial must be a positive integer greater than zero.",
			"INVALID_SERIAL",
		);
	}
}
