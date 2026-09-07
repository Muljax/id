import { eq } from "drizzle-orm";

import type { Database } from "../../db";
import { oauthClients } from "../../db/schema";
import { hashToken } from "../token";

/**
 * Supported OAuth client types.
 */
export const OAUTH_CLIENT_TYPES = ["public", "confidential"] as const;

export type OAuthClientType = (typeof OAUTH_CLIENT_TYPES)[number];

/**
 * OIDC scopes supported by Muljax ID.
 */
export const OIDC_SCOPES = ["openid", "profile", "email"] as const;

export type OIDCScope = (typeof OIDC_SCOPES)[number];

interface CreateOAuthClientInput {
	name: string;
	clientType: OAuthClientType;
	clientSecretHash?: string;
	redirectUris: string[];
	scopes: string[];
}

/**
 * Creates an OAuth client.
 *
 * @param db The database connection.
 * @param input The OAuth client configuration.
 * @returns The newly created OAuth client.
 */
export async function createOAuthClient(
	db: Database,
	input: CreateOAuthClientInput,
) {
	const now = Date.now();
	const id = crypto.randomUUID();

	await db.insert(oauthClients).values({
		id,
		name: input.name,
		clientType: input.clientType,
		clientSecretHash: input.clientSecretHash,
		redirectUris: JSON.stringify(input.redirectUris),
		scopes: JSON.stringify(input.scopes),
		createdAt: now,
		updatedAt: now,
	});

	return getOAuthClient(db, id);
}

/**
 * Retrieves an OAuth client by its client ID.
 *
 * @param db The database connection.
 * @param clientId The OAuth client ID.
 * @returns The OAuth client, or `null` if it does not exist.
 */
export async function getOAuthClient(db: Database, clientId: string) {
	const result = await db
		.select()
		.from(oauthClients)
		.where(eq(oauthClients.id, clientId))
		.limit(1);

	const client = result[0];

	if (!client) {
		return null;
	}

	return {
		...client,
		redirectUris: parseStringArray(client.redirectUris),
		scopes: parseStringArray(client.scopes),
	};
}

/**
 * Validates whether a redirect URI is registered for an OAuth client.
 *
 * @param client The OAuth client to validate against.
 * @param redirectUri The redirect URI to validate.
 * @returns `true` when the redirect URI is registered; otherwise, `false`.
 */
export function validateRedirectUri(
	client: Awaited<ReturnType<typeof getOAuthClient>>,
	redirectUri: string,
) {
	if (!client) {
		return false;
	}

	return client.redirectUris.includes(redirectUri);
}

/**
 * Validates that an OAuth client exists.
 *
 * @param client The OAuth client to validate.
 * @returns `true` when the client exists; otherwise, `false`.
 */
export function validateClient(
	client: Awaited<ReturnType<typeof getOAuthClient>>,
) {
	return client !== null;
}

/**
 * Checks whether an OAuth client supports a scope.
 *
 * @param client The OAuth client to check.
 * @param scope The scope to validate.
 * @returns `true` when the client supports the scope; otherwise, `false`.
 */
export function clientSupportsScope(
	client: Awaited<ReturnType<typeof getOAuthClient>>,
	scope: string,
) {
	if (!client) {
		return false;
	}

	return client.scopes.includes(scope);
}

/**
 * Checks whether an OAuth client supports all requested scopes.
 *
 * @param client The OAuth client to check.
 * @param scopes The scopes to validate.
 * @returns `true` when the client supports every requested scope; otherwise, `false`.
 */
export function clientSupportsScopes(
	client: Awaited<ReturnType<typeof getOAuthClient>>,
	scopes: string[],
) {
	if (!client) {
		return false;
	}

	return scopes.every((scope) => client.scopes.includes(scope));
}

/**
 * Checks whether a value is a supported OAuth client type.
 *
 * @param value The value to validate.
 * @returns `true` when the value is a supported OAuth client type; otherwise, `false`.
 */
export function isOAuthClientType(value: string): value is OAuthClientType {
	return OAUTH_CLIENT_TYPES.includes(value as OAuthClientType);
}

function parseStringArray(value: string): string[] {
	try {
		const parsed: unknown = JSON.parse(value);

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((item): item is string => typeof item === "string");
	} catch {
		return [];
	}
}

/**
 * Verifies a confidential OAuth client's secret.
 *
 * @param client The OAuth client to verify.
 * @param clientSecret The client secret to verify.
 * @returns `true` when the secret matches; otherwise, `false`.
 */
export async function verifyClientSecret(
	client: Awaited<ReturnType<typeof getOAuthClient>>,
	clientSecret: string,
) {
	if (client?.clientType !== "confidential" || !client?.clientSecretHash) {
		return false;
	}

	const hash = await hashToken(clientSecret);

	return hash === client.clientSecretHash;
}

/**
 * Retrieves all registered OAuth clients.
 *
 * @param db The database connection.
 * @returns The registered OAuth clients ordered by creation time.
 */
export async function getOAuthClients(db: Database) {
	const clients = await db
		.select()
		.from(oauthClients)
		.orderBy(oauthClients.createdAt);

	return clients.map((client) => ({
		...client,
		redirectUris: parseStringArray(client.redirectUris),
		scopes: parseStringArray(client.scopes),
	}));
}

/**
 * Updates an OAuth client's name, redirect URIs, and scopes.
 *
 * @param db The database connection.
 * @param clientId The OAuth client ID to update.
 * @param input The updated OAuth client configuration.
 * @returns The updated OAuth client, or `null` if it does not exist.
 */
export async function updateOAuthClient(
	db: Database,
	clientId: string,
	input: {
		name: string;
		redirectUris: string[];
		scopes: string[];
	},
) {
	await db
		.update(oauthClients)
		.set({
			name: input.name,
			redirectUris: JSON.stringify(input.redirectUris),
			scopes: JSON.stringify(input.scopes),
			updatedAt: Date.now(),
		})
		.where(eq(oauthClients.id, clientId));

	return getOAuthClient(db, clientId);
}

/**
 * Deletes an OAuth client.
 *
 * @param db The database connection.
 * @param clientId The OAuth client ID to delete.
 * @returns The deleted OAuth client, or `null` if it does not exist.
 */
export async function deleteOAuthClient(db: Database, clientId: string) {
	const existing = await getOAuthClient(db, clientId);

	if (!existing) {
		return null;
	}

	await db.delete(oauthClients).where(eq(oauthClients.id, clientId));

	return existing;
}
