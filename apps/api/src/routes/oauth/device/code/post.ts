import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDeviceAuthorization } from "@/lib/oauth/device";
import { ErrorResponseSchema } from "@/schemas/common";
import { OAuthDeviceCodeResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

route.use("*", async (c, next) => {
	c.header("Cache-Control", "no-store");
	c.header("Pragma", "no-cache");
	await next();
});

export const oauthDeviceCodeRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth"],
	summary: "OAuth 2.0 Device Authorization Endpoint (RFC 8628 §3.1)",
	description:
		"Initiates device authorization for browserless or input-constrained devices by issuing a user code and device verification code.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthDeviceCodeResponseSchema,
				},
			},
			description:
				"Device authorization response containing user code, verification URI, and polling interval",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request parameters or unauthorized scope",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Client authentication failed",
		},
	},
});

// biome-ignore lint/suspicious/noExplicitAny: RFC 8628 device authorization handler response
route.openapi(oauthDeviceCodeRoute, async (c): Promise<any> => {
	let body: Record<string, unknown> = {};
	const contentType = c.req.header("Content-Type") || "";

	if (contentType.includes("application/json")) {
		body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
	} else {
		body = (await c.req.parseBody().catch(() => ({}))) as Record<
			string,
			unknown
		>;
	}

	return createDeviceAuthorization(c, body);
});

export default route;
