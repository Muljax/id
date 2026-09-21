import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { getPublicJwk } from "@/lib/oauth/keys";
import { JwksResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const getJwksRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["OpenID Connect"],
	summary: "JSON Web Key Set (JWKS)",
	description:
		"Returns the public cryptographic keys used to verify OpenID Connect ID tokens issued by this server.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: JwksResponseSchema,
				},
			},
			description: "Public cryptographic keys",
		},
	},
});

route.openapi(getJwksRoute, (c) => {
	const jwk = getPublicJwk(c.env.OIDC_PRIVATE_KEY);

	return c.json(
		{
			keys: [jwk],
		},
		200,
	);
});

export default route;
