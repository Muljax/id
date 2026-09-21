import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { getUserEffectivePermissions } from "@/lib/rbac/permissions";
import { getSessionUser } from "@/lib/session";
import { AuthUserResponseSchema } from "@/schemas/auth";
import { ErrorResponseSchema } from "@/schemas/common";

export const getMeRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Authentication"],
	summary: "Current authenticated user profile",
	description:
		"Retrieve caller identity, claims, assigned roles, and permissions from active session.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AuthUserResponseSchema,
				},
			},
			description: "Active user profile",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized - missing or invalid session cookie",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	getMeRoute,
	async (c) => {
		const token = getCookie(c, "session");

		if (!token) {
			return c.json(
				{
					error: "Unauthorized",
				},
				401,
			);
		}

		const db = createDb(c.env.DB);
		const user = await getSessionUser(db, token);

		if (!user) {
			return c.json(
				{
					error: "Unauthorized",
				},
				401,
			);
		}

		const { roles, permissions } = await getUserEffectivePermissions(
			db,
			user.id,
		);

		return c.json(
			{
				user: {
					id: user.id,
					email: user.email,
					displayName: user.displayName,
					givenName: user.givenName,
					familyName: user.familyName,
					middleName: user.middleName,
					nickname: user.nickname,
					preferredUsername: user.preferredUsername,
					profileUrl: user.profileUrl,
					profileImageKey: user.profileImageKey,
					website: user.website,
					gender: user.gender,
					birthdate: user.birthdate,
					zoneinfo: user.zoneinfo,
					locale: user.locale,
					emailVerifiedAt: user.emailVerifiedAt,
					createdAt: user.createdAt,
					roles,
					permissions: Array.from(permissions),
				},
			},
			200,
		);
	},
);

export default route;
