import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { users } from "./users";

/**
 * Registered OAuth 2.0 / OpenID Connect client applications.
 */
export const oauthClients = sqliteTable("oauth_clients", {
	/**
	 * OAuth 2.0 Client ID presented during authorization requests.
	 */
	id: text("id").primaryKey(),

	/**
	 * Human-readable application name displayed on consent screens.
	 */
	name: text("name").notNull(),

	/**
	 * Client classification: 'confidential' (can secure secret) or 'public' (SPA/mobile with PKCE).
	 */
	clientType: text("client_type").notNull(),

	/**
	 * Hashed client secret for confidential client basic/POST authentication.
	 */
	clientSecretHash: text("client_secret_hash"),

	/**
	 * Space-delimited or JSON list of authorized callback redirect URIs.
	 */
	redirectUris: text("redirect_uris").notNull(),

	/**
	 * Space-delimited list of OAuth scopes this client is authorized to request.
	 */
	scopes: text("scopes").notNull(),

	/**
	 * Epoch timestamp (ms) when this client application was registered.
	 */
	createdAt: integer("created_at").notNull(),

	/**
	 * Epoch timestamp (ms) when client details were last modified.
	 */
	updatedAt: integer("updated_at").notNull(),
});

/**
 * Short-lived authorization codes exchanged for access and ID tokens via PKCE.
 */
export const oauthAuthorizationCodes = sqliteTable(
	"oauth_authorization_codes",
	{
		/**
		 * Unique identifier for the authorization code record.
		 */
		id: text("id").primaryKey(),

		/**
		 * Client application requesting authentication.
		 */
		clientId: text("client_id")
			.notNull()
			.references(() => oauthClients.id, {
				onDelete: "cascade",
			}),

		/**
		 * Authenticated user consenting to the authorization.
		 */
		userId: text("user_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),

		/**
		 * SHA-256 hash of the issued authorization code string.
		 */
		codeHash: text("code_hash").notNull().unique(),

		/**
		 * Exact redirect URI supplied in the initial authorization request.
		 */
		redirectUri: text("redirect_uri").notNull(),

		/**
		 * Space-delimited scopes granted during the authorization flow.
		 */
		scope: text("scope").notNull(),

		/**
		 * OIDC client nonce used to mitigate replay attacks.
		 */
		nonce: text("nonce"),

		/**
		 * PKCE code challenge string (RFC 7636).
		 */
		codeChallenge: text("code_challenge"),

		/**
		 * PKCE code challenge method ('S256' or 'plain').
		 */
		codeChallengeMethod: text("code_challenge_method"),

		/**
		 * Authentication Context Class Reference claim value.
		 */
		acr: text("acr"),

		/**
		 * Unix timestamp (seconds) when user authentication occurred.
		 */
		authTime: integer("auth_time"),

		/**
		 * Epoch timestamp (ms) when this authorization code expires (max 10 minutes).
		 */
		expiresAt: integer("expires_at").notNull(),

		/**
		 * Epoch timestamp (ms) when the authorization code was issued.
		 */
		createdAt: integer("created_at").notNull(),

		/**
		 * Epoch timestamp (ms) when the code was exchanged (single-use validation).
		 */
		usedAt: integer("used_at"),

		/**
		 * JSON-serialized OIDC claims specifically requested by the client.
		 */
		claims: text("claims"),
	},
);

/**
 * Long-lived refresh tokens used to obtain new access tokens with automatic rotation.
 */
export const oauthRefreshTokens = sqliteTable("oauth_refresh_tokens", {
	/**
	 * Unique identifier for the refresh token record.
	 */
	id: text("id").primaryKey(),

	/**
	 * Client application holding the refresh grant.
	 */
	clientId: text("client_id")
		.notNull()
		.references(() => oauthClients.id, {
			onDelete: "cascade",
		}),

	/**
	 * User account that authorized the refresh token.
	 */
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),

	/**
	 * SHA-256 hash of the refresh token secret.
	 */
	tokenHash: text("token_hash").notNull().unique(),

	/**
	 * Space-delimited scopes authorized for tokens derived from this refresh grant.
	 */
	scope: text("scope").notNull(),

	/**
	 * Epoch timestamp (ms) when the refresh token expires.
	 */
	expiresAt: integer("expires_at").notNull(),

	/**
	 * Epoch timestamp (ms) when the refresh token was issued.
	 */
	createdAt: integer("created_at").notNull(),

	/**
	 * Timestamp when this refresh token was revoked, or null if active.
	 */
	revokedAt: integer("revoked_at"),

	/**
	 * ID of the replacement refresh token when rotated.
	 */
	replacedBy: text("replaced_by"),
});

/**
 * Opaque bearer access tokens used by clients to access protected resource APIs.
 */
export const oauthAccessTokens = sqliteTable("oauth_access_tokens", {
	/**
	 * Unique identifier for the access token record.
	 */
	id: text("id").primaryKey(),

	/**
	 * Client application that requested the token.
	 */
	clientId: text("client_id")
		.notNull()
		.references(() => oauthClients.id, {
			onDelete: "cascade",
		}),

	/**
	 * User account represented by this token (null for client credentials).
	 */
	userId: text("user_id").references(() => users.id, {
		onDelete: "cascade",
	}),

	/**
	 * SHA-256 hash of the bearer access token string.
	 */
	tokenHash: text("token_hash").notNull().unique(),

	/**
	 * Space-delimited scopes granted to this specific access token.
	 */
	scope: text("scope").notNull(),

	/**
	 * Epoch timestamp (ms) when this access token expires (typically 1 hour).
	 */
	expiresAt: integer("expires_at").notNull(),

	/**
	 * Epoch timestamp (ms) when the access token was issued.
	 */
	createdAt: integer("created_at").notNull(),

	/**
	 * Timestamp when the token was explicitly revoked.
	 */
	revokedAt: integer("revoked_at"),

	/**
	 * Authorization code that originated this access token (if code flow).
	 */
	authorizationCodeId: text("authorization_code_id").references(
		() => oauthAuthorizationCodes.id,
		{
			onDelete: "cascade",
		},
	),
});

/**
 * Persistent user consent decisions granting application access to specific scopes.
 */
export const oauthGrants = sqliteTable(
	"oauth_grants",
	{
		/**
		 * Unique identifier for the persistent grant record.
		 */
		id: text("id").primaryKey(),

		/**
		 * User who provided consent.
		 */
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		/**
		 * Client application authorized by the user.
		 */
		clientId: text("client_id")
			.notNull()
			.references(() => oauthClients.id, { onDelete: "cascade" }),

		/**
		 * Space-delimited list of approved scopes.
		 */
		scopes: text("scopes").notNull(),

		/**
		 * Epoch timestamp (ms) when consent was granted.
		 */
		grantedAt: integer("granted_at").notNull(),

		/**
		 * Epoch timestamp (ms) when consent was revoked.
		 */
		revokedAt: integer("revoked_at"),
	},
	(table) => [
		uniqueIndex("oauth_grants_user_client_idx").on(
			table.userId,
			table.clientId,
		),
	],
);

/**
 * Short-lived device authorization codes for headless and browser-constrained devices (RFC 8628).
 */
export const oauthDeviceCodes = sqliteTable("oauth_device_codes", {
	/**
	 * Unique identifier for the device authorization record.
	 */
	id: text("id").primaryKey(),

	/**
	 * Client application requesting device authorization.
	 */
	clientId: text("client_id")
		.notNull()
		.references(() => oauthClients.id, {
			onDelete: "cascade",
		}),

	/**
	 * SHA-256 hash of the device verification code polled by the client.
	 */
	deviceCodeHash: text("device_code_hash").notNull().unique(),

	/**
	 * Short, human-friendly user code entered at the verification URI (e.g. WDJB-4921).
	 */
	userCode: text("user_code").notNull().unique(),

	/**
	 * Space-delimited scopes requested by the device.
	 */
	scope: text("scope").notNull(),

	/**
	 * Authenticated user who approved the device authorization (null while pending).
	 */
	userId: text("user_id").references(() => users.id, {
		onDelete: "cascade",
	}),

	/**
	 * Lifecycle status: 'pending', 'approved', or 'denied'.
	 */
	status: text("status").notNull().default("pending"),

	/**
	 * Minimum polling interval in seconds enforced against rate-limiting (RFC 8628 §3.5).
	 */
	pollingInterval: integer("polling_interval").notNull().default(5),

	/**
	 * Epoch timestamp (ms) of the most recent token poll from the device.
	 */
	lastPolledAt: integer("last_polled_at"),

	/**
	 * Epoch timestamp (ms) when this device authorization request expires (max 10 minutes).
	 */
	expiresAt: integer("expires_at").notNull(),

	/**
	 * Epoch timestamp (ms) when the device authorization was initiated.
	 */
	createdAt: integer("created_at").notNull(),
});

export type OauthClient = typeof oauthClients.$inferSelect;
export type NewOauthClient = typeof oauthClients.$inferInsert;
export type OauthAuthorizationCode =
	typeof oauthAuthorizationCodes.$inferSelect;
export type NewOauthAuthorizationCode =
	typeof oauthAuthorizationCodes.$inferInsert;
export type OauthRefreshToken = typeof oauthRefreshTokens.$inferSelect;
export type NewOauthRefreshToken = typeof oauthRefreshTokens.$inferInsert;
export type OauthAccessToken = typeof oauthAccessTokens.$inferSelect;
export type NewOauthAccessToken = typeof oauthAccessTokens.$inferInsert;
export type OauthGrant = typeof oauthGrants.$inferSelect;
export type NewOauthGrant = typeof oauthGrants.$inferInsert;
export type OauthDeviceCode = typeof oauthDeviceCodes.$inferSelect;
export type NewOauthDeviceCode = typeof oauthDeviceCodes.$inferInsert;
