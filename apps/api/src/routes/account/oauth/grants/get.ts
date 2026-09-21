import { and, eq, isNull } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { oauthClients, oauthGrants } from "@/db/schema";
import { type AppEnv, requireSessionAuth } from "@/middleware/auth";
import { OAuthGrantsResponseSchema } from "@/schemas/account";
import { ErrorResponseSchema } from "@/schemas/common";

export const getOAuthGrantsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Account & Profile"],
	summary: "List authorized applications",
	description:
		"Retrieve all third-party OAuth2 applications and consented scopes for the current user.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthGrantsResponseSchema,
				},
			},
			description: "List of authorized OAuth applications",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireSessionAuth);

route.openapi(getOAuthGrantsRoute, async (c) => {
	const user = c.get("user");
	const db = createDb(c.env.DB);

	const grants = await db
		.select({
			clientId: oauthClients.id,
			clientName: oauthClients.name,
			scopes: oauthGrants.scopes,
			grantedAt: oauthGrants.grantedAt,
		})
		.from(oauthGrants)
		.innerJoin(oauthClients, eq(oauthClients.id, oauthGrants.clientId))
		.where(and(eq(oauthGrants.userId, user.id), isNull(oauthGrants.revokedAt)));

	return c.json(
		{
			grants: grants.map((grant) => ({
				clientId: grant.clientId,
				clientName: grant.clientName,
				scopes: JSON.parse(grant.scopes) as string[],
				grantedAt: grant.grantedAt,
			})),
		},
		200,
	);
});

export default route;
