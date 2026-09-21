import { base64UrlEncode } from "../bytes/base64";
import { getKeyId, importPrivateKey, sign } from "./keys";

const encoder = new TextEncoder();

function encodeJson(value: unknown): string {
	return base64UrlEncode(encoder.encode(JSON.stringify(value)));
}

export interface CreateJwtAccessTokenInput {
	privateKey: string;
	issuer: string;
	clientId: string;
	sub: string;
	audience?: string | string[];
	scope: string;
	expiresIn: number;
}

/**
 * Creates an RFC 9068 conformant signed JWT access token.
 *
 * @param input Token generation parameters.
 * @returns The serialized and signed JWT string.
 */
export async function createJwtAccessToken(
	input: CreateJwtAccessTokenInput,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	const header = {
		alg: "ES256",
		typ: "at+jwt",
		kid: getKeyId(),
	};

	const payload: Record<string, unknown> = {
		iss: input.issuer,
		sub: input.sub,
		aud: input.audience ?? input.clientId,
		client_id: input.clientId,
		scope: input.scope,
		jti: crypto.randomUUID(),
		iat: now,
		exp: now + input.expiresIn,
	};

	const encodedHeader = encodeJson(header);
	const encodedPayload = encodeJson(payload);

	const signingInput = encoder.encode(`${encodedHeader}.${encodedPayload}`);

	const privateKey = await importPrivateKey(input.privateKey);
	const signature = await sign(privateKey, signingInput);
	const encodedSignature = base64UrlEncode(new Uint8Array(signature));

	return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}
