import { base64UrlDecode } from "../bytes/base64";
import {
	buildCertificateToSign,
	buildSignedCertificateWire,
	DEFAULT_USER_EXTENSIONS,
	formatOpenSshCertificate,
	SSH_CERT_TYPE_USER,
} from "./certificate";
import {
	buildEd25519PublicWire,
	calculateFingerprint,
	formatOpenSshEd25519PublicKey,
	parseOpenSshPublicKey,
} from "./keys";
import {
	validateCriticalOptions,
	validateExtensions,
	validateKeyId,
	validatePrincipals,
	validateSerial,
	validateTtl,
} from "./validation";

export interface SshCaContext {
	/** WebCrypto private signing key. */
	privateKey: CryptoKey;
	/** 32-byte raw Ed25519 public key. */
	rawPublicKey: Uint8Array;
	/** Binary wire format of the CA public key. */
	publicWire: Uint8Array;
	/** Formatted OpenSSH single-line public key for `TrustedUserCAKeys`. */
	publicOpenSsh: string;
	/** OpenSSH SHA-256 fingerprint of the CA public key. */
	fingerprint: string;
}

export interface IssueUserCertificateParams {
	/** The client's OpenSSH public key (`ssh-ed25519 AAAAC3... user@host`). */
	userPublicKey: string;
	/** Human-readable identity of the user (e.g. user email). */
	keyId: string;
	/** List of authorized UNIX principals (e.g. `["hazel", "ubuntu"]`). */
	principals: string[];
	/** Requested validity duration in seconds (default: 8 hours / 28800s). */
	ttlSeconds?: number;
	/** Maximum permitted validity duration in seconds (default: 24 hours / 86400s). */
	maxTtlSeconds?: number;
	/** Optional explicit serial number (defaults to monotonic microsecond timestamp). */
	serial?: bigint;
	/** Allowed extensions (defaults to standard OpenSSH interactive & forwarding permissions). */
	extensions?: string[] | Record<string, string>;
	/** Critical options (default: none). */
	criticalOptions?: Record<string, string>;
	/** Comment appended to the certificate line (e.g. "user@domain-cert"). */
	comment?: string;
}

export interface IssuedCertificateResult {
	/** Single-line OpenSSH certificate content ready to save as `id_ed25519-cert.pub`. */
	certificate: string;
	/** Serial number assigned to the certificate. */
	serial: bigint;
	/** Validity start timestamp in UNIX epoch seconds. */
	validAfter: number;
	/** Validity expiration timestamp in UNIX epoch seconds. */
	validBefore: number;
	/** Principals granted by this certificate. */
	principals: string[];
	/** Identity string embedded in the certificate. */
	keyId: string;
	/** SHA-256 fingerprint of the certified user key. */
	fingerprint: string;
	/** SHA-256 fingerprint of the CA key that signed it. */
	caFingerprint: string;
	/** Complete binary wire bytes of the certificate. */
	wireBytes: Uint8Array;
}

/**
 * Generates an Ed25519 CA key pair in JWK format.
 *
 * @returns Serialized JWK private key, OpenSSH public key line, and SHA-256 fingerprint.
 */
export async function generateCaKeyPairJwk(): Promise<{
	privateKeyJwk: string;
	publicOpenSsh: string;
	fingerprint: string;
}> {
	const keyPair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
		"sign",
		"verify",
	])) as unknown as CryptoKeyPair;

	const jwk = (await crypto.subtle.exportKey(
		"jwk",
		keyPair.privateKey,
	)) as JsonWebKey;
	if (!jwk.x || !jwk.d) {
		throw new Error("Failed to export Ed25519 JWK");
	}

	const rawPub = new Uint8Array(
		(await crypto.subtle.exportKey("raw", keyPair.publicKey)) as ArrayBuffer,
	);
	const publicWire = buildEd25519PublicWire(rawPub);
	const publicOpenSsh = formatOpenSshEd25519PublicKey(
		rawPub,
		"ssh-ca@muljax-id",
	);
	const fingerprint = await calculateFingerprint(publicWire);

	return {
		privateKeyJwk: JSON.stringify({
			kty: jwk.kty,
			crv: jwk.crv,
			x: jwk.x,
			d: jwk.d,
		}),
		publicOpenSsh,
		fingerprint,
	};
}

/**
 * Initializes an SSH CA context from a serialized JWK string or object.
 *
 * @param privateKeyInput Serialized JWK string or parsed JsonWebKey object.
 * @param comment Optional comment for the exported CA public key line.
 * @returns Initialized CA context with imported WebCrypto keys and derived metadata.
 */
export async function createSshCaContext(
	privateKeyInput: string | JsonWebKey,
	comment = "ssh-ca@muljax-id",
): Promise<SshCaContext> {
	const jwk =
		typeof privateKeyInput === "string"
			? (JSON.parse(privateKeyInput) as JsonWebKey)
			: privateKeyInput;

	if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || !jwk.x || !jwk.d) {
		throw new Error(
			"Invalid SSH CA private key: expected an OKP / Ed25519 JWK with 'x' and 'd' parameters.",
		);
	}

	const rawPublicKey = base64UrlDecode(jwk.x);
	const publicWire = buildEd25519PublicWire(rawPublicKey);
	const publicOpenSsh = formatOpenSshEd25519PublicKey(rawPublicKey, comment);
	const fingerprint = await calculateFingerprint(publicWire);

	const privateKey = await crypto.subtle.importKey(
		"jwk",
		jwk,
		{ name: "Ed25519" },
		false,
		["sign"],
	);

	return {
		privateKey,
		rawPublicKey,
		publicWire,
		publicOpenSsh,
		fingerprint,
	};
}

/**
 * Issues a signed short-lived OpenSSH user certificate with strict input validation.
 *
 * Validates the client public key, sanitizes key ID and principals, bounds validity duration,
 * and signs the certificate using the CA's Ed25519 private key.
 *
 * @param ca The active SSH CA context.
 * @param params Certificate issuance options including public key, identity, and principals.
 * @returns Issued certificate details and formatted single-line certificate string.
 * @throws SshValidationError if any input parameter fails validation constraints.
 */
export async function issueUserCertificate(
	ca: SshCaContext,
	params: IssueUserCertificateParams,
): Promise<IssuedCertificateResult> {
	const validatedKeyId = validateKeyId(params.keyId);
	const validatedPrincipals = validatePrincipals(params.principals);
	const ttlSeconds = validateTtl(params.ttlSeconds, params.maxTtlSeconds);

	validateExtensions(params.extensions);
	validateCriticalOptions(params.criticalOptions);

	const parsedKey = parseOpenSshPublicKey(params.userPublicKey);
	const userFingerprint = await calculateFingerprint(parsedKey.wireBytes);

	const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
	const validAfter = nowSeconds - 60n;
	const validBefore = nowSeconds + BigInt(ttlSeconds);

	let serial = params.serial;
	if (serial !== undefined) {
		validateSerial(serial);
	} else {
		const randBytes = new Uint32Array(1);
		crypto.getRandomValues(randBytes);
		serial = BigInt(Date.now()) * 65536n + BigInt(randBytes[0] % 65536);
	}

	const unsignedPayload = buildCertificateToSign({
		rawClientPublicKey: parsedKey.rawKey,
		serial,
		type: SSH_CERT_TYPE_USER,
		keyId: validatedKeyId,
		principals: validatedPrincipals,
		validAfter,
		validBefore,
		criticalOptions: params.criticalOptions,
		extensions: params.extensions ?? [...DEFAULT_USER_EXTENSIONS],
		caPublicWire: ca.publicWire,
	});

	const signatureBuffer = await crypto.subtle.sign(
		{ name: "Ed25519" },
		ca.privateKey,
		unsignedPayload as BufferSource,
	);
	const rawSignature = new Uint8Array(signatureBuffer);

	const certWireBytes = buildSignedCertificateWire(
		unsignedPayload,
		rawSignature,
		"ssh-ed25519",
	);

	const comment = params.comment ?? `${validatedKeyId}-cert`;
	const certificate = formatOpenSshCertificate(certWireBytes, comment);

	return {
		certificate,
		serial,
		validAfter: Number(validAfter),
		validBefore: Number(validBefore),
		principals: validatedPrincipals,
		keyId: validatedKeyId,
		fingerprint: userFingerprint,
		caFingerprint: ca.fingerprint,
		wireBytes: certWireBytes,
	};
}
