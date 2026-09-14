import { Hono } from "hono";

import { exchangeAuthorizationCode } from "@/lib/oauth/authorization-code";
import { exchangeClientCredentials } from "@/lib/oauth/client-credentials";
import { exchangeRefreshToken } from "@/lib/oauth/refresh-token";
import { unsupportedGrantType } from "@/lib/oauth/responses";

const route = new Hono<{ Bindings: Env }>();

route.use("*", async (c, next) => {
	c.header("Cache-Control", "no-store");
	c.header("Pragma", "no-cache");

	await next();
});

route.post("/", async (c) => {
	const body = await c.req.parseBody();

	switch (body.grant_type) {
		case "authorization_code":
			return exchangeAuthorizationCode(c, body);

		case "refresh_token":
			return exchangeRefreshToken(c, body);

		case "client_credentials":
			return exchangeClientCredentials(c, body);

		default:
			return unsupportedGrantType(c);
	}
});

export default route;
