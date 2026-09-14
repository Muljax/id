import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { users } from "./users";

export const oauthClients = sqliteTable("oauth_clients", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	clientType: text("client_type").notNull(),
	clientSecretHash: text("client_secret_hash"),
	redirectUris: text("redirect_uris").notNull(),
	scopes: text("scopes").notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const oauthAuthorizationCodes = sqliteTable(
	"oauth_authorization_codes",
	{
		id: text("id").primaryKey(),

		clientId: text("client_id")
			.notNull()
			.references(() => oauthClients.id, {
				onDelete: "cascade",
			}),

		userId: text("user_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),

		codeHash: text("code_hash").notNull().unique(),

		redirectUri: text("redirect_uri").notNull(),
		scope: text("scope").notNull(),

		nonce: text("nonce"),

		codeChallenge: text("code_challenge"),
		codeChallengeMethod: text("code_challenge_method"),

		acr: text("acr"),

		authTime: integer("auth_time"),
		expiresAt: integer("expires_at").notNull(),
		createdAt: integer("created_at").notNull(),
		usedAt: integer("used_at"),
		claims: text("claims"),
	},
);

export const oauthRefreshTokens = sqliteTable("oauth_refresh_tokens", {
	id: text("id").primaryKey(),

	clientId: text("client_id")
		.notNull()
		.references(() => oauthClients.id, {
			onDelete: "cascade",
		}),

	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),

	tokenHash: text("token_hash").notNull().unique(),

	scope: text("scope").notNull(),

	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").notNull(),
	revokedAt: integer("revoked_at"),
	replacedBy: text("replaced_by"),
});

export const oauthAccessTokens = sqliteTable("oauth_access_tokens", {
	id: text("id").primaryKey(),

	clientId: text("client_id")
		.notNull()
		.references(() => oauthClients.id, {
			onDelete: "cascade",
		}),

	userId: text("user_id").references(() => users.id, {
		onDelete: "cascade",
	}),

	tokenHash: text("token_hash").notNull().unique(),

	scope: text("scope").notNull(),

	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").notNull(),
	revokedAt: integer("revoked_at"),

	authorizationCodeId: text("authorization_code_id").references(
		() => oauthAuthorizationCodes.id,
		{
			onDelete: "cascade",
		},
	),
});

export const oauthGrants = sqliteTable(
	"oauth_grants",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		clientId: text("client_id")
			.notNull()
			.references(() => oauthClients.id, { onDelete: "cascade" }),
		scopes: text("scopes").notNull(),
		grantedAt: integer("granted_at").notNull(),
		revokedAt: integer("revoked_at"),
	},
	(table) => [
		uniqueIndex("oauth_grants_user_client_idx").on(
			table.userId,
			table.clientId,
		),
	],
);
