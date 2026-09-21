import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { AuthSettingsResponseSchema } from "@/schemas/auth";

export const getAuthSettingsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Authentication"],
	summary: "Instance settings discovery",
	description: "Retrieve public instance registration and login policies.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AuthSettingsResponseSchema,
				},
			},
			description: "Instance authentication settings",
		},
	},
});

const route = new OpenAPIHono<{ Bindings: Env }>().openapi(
	getAuthSettingsRoute,
	async (c) => {
		const db = createDb(c.env.DB);
		const settings = await getOrCreateInstanceSettings(db);

		return c.json(
			{
				signupMode: settings.signupMode,
				signinMode: settings.signinMode,
			},
			200,
		);
	},
);

export default route;
