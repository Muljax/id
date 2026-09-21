import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import packageJson from "../package.json" with { type: "json" };
import { dashboardCors, publicCors } from "./middleware/cors";
import { csrfProtection } from "./middleware/csrf";
import { securityHeaders, sensitiveCacheControl } from "./middleware/security";
import account from "./routes/account";
import admin from "./routes/admin";
import auth from "./routes/auth";
import notifications from "./routes/notifications";
import oauth from "./routes/oauth";
import passkeys from "./routes/passkeys";
import ssh from "./routes/ssh";
import users from "./routes/users";
import wellKnown from "./routes/well-known";
import { HealthResponseSchema } from "./schemas/common";

import { stringify } from "yaml";

import type { AppEnv } from "./middleware/auth";

export const getHealthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["System"],
	summary: "Service health check",
	description:
		"Returns operational health, API version, and database connectivity status.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: HealthResponseSchema,
				},
			},
			description: "Service is healthy and reachable",
		},
	},
});

const apiRoutes = new OpenAPIHono<AppEnv>()
	.openapi(getHealthRoute, (c) => {
		return c.json(
			{
				status: "ok",
				version: packageJson.version,
				database: "connected",
			},
			200,
		);
	})
	.route("/auth", auth)
	.route("/admin", admin)
	.route("/passkeys", passkeys)
	.route("/account", account)
	.route("/notifications", notifications)
	.route("/ssh", ssh)
	.route("/users", users);

const baseApp = new OpenAPIHono<AppEnv>();

const openApiConfig = {
	openapi: "3.1.0" as const,
	info: {
		title: "Muljax ID API",
		version: packageJson.version,
		description:
			"Self-hosted identity management, OAuth 2.0, Passkeys, RBAC, and SSH Certificate Authority service.",
	},
};

baseApp.use("*", securityHeaders());
baseApp.use("/api/*", sensitiveCacheControl());
baseApp.use("/oauth/*", sensitiveCacheControl());
baseApp.use("/api/openapi.json", publicCors());
baseApp.use("/api/openapi.yaml", publicCors());
baseApp.use("/api/openapi.yml", publicCors());
baseApp.use("/api/*", dashboardCors());
baseApp.use("/oauth/device/*", dashboardCors());
baseApp.use("/oauth/details", dashboardCors());
baseApp.use("/oauth/approve", dashboardCors());
baseApp.use("/oauth/clients", dashboardCors());
baseApp.use("/oauth/clients/*", dashboardCors());
baseApp.use("/oauth/grant", dashboardCors());
baseApp.use("/oauth/token", publicCors());
baseApp.use("/oauth/device/code", publicCors());
baseApp.use("/oauth/revoke", publicCors());
baseApp.use("/oauth/introspect", publicCors());
baseApp.use("/oauth/userinfo", publicCors());
baseApp.use("/oauth/avatar", publicCors());
baseApp.use("/ssh/*", publicCors());
baseApp.use("/.well-known/*", publicCors());
baseApp.use("*", csrfProtection);

baseApp.doc("/api/openapi.json", openApiConfig);

baseApp.get("/api/openapi.yaml", (c) => {
	const doc = baseApp.getOpenAPIDocument(openApiConfig);
	return c.text(stringify(doc), 200, {
		"Content-Type": "text/yaml; charset=utf-8",
	});
});

baseApp.get("/api/openapi.yml", (c) => {
	const doc = baseApp.getOpenAPIDocument(openApiConfig);
	return c.text(stringify(doc), 200, {
		"Content-Type": "text/yaml; charset=utf-8",
	});
});

export const app = baseApp
	.route("/api", apiRoutes)
	.route("/ssh", ssh)
	.route("/oauth", oauth)
	.route("/.well-known", wellKnown);
