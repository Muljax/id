import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { createDb } from "@/db";
import { oauthAuthorizationCodes, users } from "@/db/schema";
import { getAccessToken } from "@/lib/oauth/tokens";
import { isUserDisabled } from "@/lib/user";

type UserInfoContext = {
	user: {
		id: string;
		email: string;
		displayName: string | null;
		givenName: string | null;
		familyName: string | null;
		middleName: string | null;
		nickname: string | null;
		preferredUsername: string | null;
		profileUrl: string | null;
		profileImageKey: string | null;
		website: string | null;
		gender: string | null;
		birthdate: string | null;
		zoneinfo: string | null;
		locale: string | null;
		emailVerifiedAt: number | null;
		updatedAt: number;
	};
	origin: string;
};

type UserInfoClaimDefinition = {
	scope?: string;
	get: (context: UserInfoContext) => unknown;
};

function getUserInfoClaimDefinitions(): Record<
	string,
	UserInfoClaimDefinition
> {
	return {
		name: {
			scope: "profile",
			get: ({ user }) => user.displayName,
		},
		given_name: {
			scope: "profile",
			get: ({ user }) => user.givenName,
		},
		family_name: {
			scope: "profile",
			get: ({ user }) => user.familyName,
		},
		middle_name: {
			scope: "profile",
			get: ({ user }) => user.middleName,
		},
		nickname: {
			scope: "profile",
			get: ({ user }) => user.nickname,
		},
		preferred_username: {
			scope: "profile",
			get: ({ user }) => user.preferredUsername,
		},
		profile: {
			scope: "profile",
			get: ({ user }) => user.profileUrl,
		},
		picture: {
			scope: "profile",
			get: ({ user, origin }) =>
				user.profileImageKey
					? `${origin}/oauth/avatar/${encodeURIComponent(user.id)}`
					: null,
		},
		website: {
			scope: "profile",
			get: ({ user }) => user.website,
		},
		gender: {
			scope: "profile",
			get: ({ user }) => user.gender,
		},
		birthdate: {
			scope: "profile",
			get: ({ user }) => user.birthdate,
		},
		zoneinfo: {
			scope: "profile",
			get: ({ user }) => user.zoneinfo,
		},
		locale: {
			scope: "profile",
			get: ({ user }) => user.locale,
		},
		updated_at: {
			scope: "profile",
			get: ({ user }) => Math.floor(user.updatedAt / 1000),
		},
		email: {
			scope: "email",
			get: ({ user }) => user.email,
		},
		email_verified: {
			scope: "email",
			get: ({ user }) => user.emailVerifiedAt !== null,
		},
	};
}

export async function userinfo(c: Context<{ Bindings: Env }>) {
	const authorization = c.req.header("Authorization");

	let token: string | undefined;

	if (authorization) {
		const match = authorization.match(/^Bearer\s+(.+)$/i);

		if (!match) {
			c.header("WWW-Authenticate", 'Bearer error="invalid_token"');
			return c.json(
				{
					error: "invalid_token",
				},
				401,
			);
		}

		token = match[1];
	} else if (c.req.method === "POST") {
		const contentType = c.req.header("Content-Type") ?? "";

		if (
			contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")
		) {
			const body = await c.req.parseBody();

			if (typeof body.access_token === "string") {
				token = body.access_token;
			}
		}
	}

	if (!token) {
		c.header("WWW-Authenticate", "Bearer");
		return c.json(
			{
				error: "invalid_token",
			},
			401,
		);
	}

	const db = createDb(c.env.DB);
	const accessToken = await getAccessToken(db, token);

	if (!accessToken) {
		c.header("WWW-Authenticate", 'Bearer error="invalid_token"');
		return c.json(
			{
				error: "invalid_token",
			},
			401,
		);
	}

	if (!accessToken.userId) {
		c.header("WWW-Authenticate", 'Bearer error="invalid_token"');
		return c.json(
			{
				error: "invalid_token",
			},
			401,
		);
	}

	const result = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
			givenName: users.givenName,
			familyName: users.familyName,
			middleName: users.middleName,
			nickname: users.nickname,
			preferredUsername: users.preferredUsername,
			profileUrl: users.profileUrl,
			profileImageKey: users.profileImageKey,
			website: users.website,
			gender: users.gender,
			birthdate: users.birthdate,
			zoneinfo: users.zoneinfo,
			locale: users.locale,
			emailVerifiedAt: users.emailVerifiedAt,
			disabledAt: users.disabledAt,
			updatedAt: users.updatedAt,
		})
		.from(users)
		.where(eq(users.id, accessToken.userId))
		.limit(1);

	const user = result[0];

	if (!user || isUserDisabled(user)) {
		c.header("WWW-Authenticate", 'Bearer error="invalid_token"');
		return c.json(
			{
				error: "invalid_token",
			},
			401,
		);
	}

	const scopes = new Set(accessToken.scope.split(" ").filter(Boolean));

	if (!scopes.has("openid")) {
		c.header(
			"WWW-Authenticate",
			'Bearer error="insufficient_scope", error_description="The access token must contain the \'openid\' scope to access userinfo."',
		);
		return c.json(
			{
				error: "insufficient_scope",
				error_description:
					"The access token must contain the 'openid' scope to access userinfo.",
			},
			403,
		);
	}

	const requestedUserInfoClaims = new Set<string>();

	if (accessToken.authorizationCodeId) {
		const result = await db
			.select({
				claims: oauthAuthorizationCodes.claims,
			})
			.from(oauthAuthorizationCodes)
			.where(eq(oauthAuthorizationCodes.id, accessToken.authorizationCodeId))
			.limit(1);

		const requestedClaims = result[0]?.claims;

		if (requestedClaims) {
			try {
				const parsed = JSON.parse(requestedClaims) as {
					userinfo?: Record<string, unknown>;
				};

				for (const claim of Object.keys(parsed.userinfo ?? {})) {
					requestedUserInfoClaims.add(claim);
				}
			} catch {
				// Ignore malformed claims.
			}
		}
	}

	const context: UserInfoContext = {
		user,
		origin: new URL(c.req.url).origin,
	};

	const definitions = getUserInfoClaimDefinitions();

	const claims: Record<string, unknown> = {
		sub: user.id,
	};

	for (const [claimName, definition] of Object.entries(definitions)) {
		const hasScope = definition.scope ? scopes.has(definition.scope) : false;

		const explicitlyRequested = requestedUserInfoClaims.has(claimName);

		if (!hasScope && !explicitlyRequested) {
			continue;
		}

		const value = definition.get(context);

		if (value !== null && value !== undefined) {
			claims[claimName] = value;
		}
	}

	return c.json(claims);
}
