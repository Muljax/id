import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { oauthClients, oauthGrants } from "@/db/schema";
import { requireSessionAuth } from "@/middleware/auth";

const route = new Hono<{ Bindings: Env }>();

route.get("/", requireSessionAuth, async (c) => {
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

	return c.json({
		grants: grants.map((grant) => ({
			clientId: grant.clientId,
			clientName: grant.clientName,
			scopes: JSON.parse(grant.scopes) as string[],
			grantedAt: grant.grantedAt,
		})),
	});
});

export default route;
