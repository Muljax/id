import { Hono } from "hono";

import approve from "./approve";
import authorize from "./authorize";
import avatar from "./avatar";
import clients from "./clients";
import details from "./details";
import grant from "./grant";
import introspect from "./introspect";
import revoke from "./revoke";
import token from "./token";
import userinfo from "./userinfo";

import { dashboardCors, publicCors } from "@/middleware/cors";
import { rateLimit } from "@/middleware/rateLimiter";

const oauthRoute = new Hono<{
	Bindings: Env;
}>();

// Public OAuth & OIDC endpoints (RFC 6749, RFC 7009, RFC 7662, OIDC Core)
oauthRoute.use(
	"/token",
	publicCors(),
	rateLimit(
		(c) => `oauth_token:${c.req.header("CF-Connecting-IP") ?? "unknown"}`,
	),
);
oauthRoute.use("/token/*", publicCors());
oauthRoute.use("/userinfo", publicCors());
oauthRoute.use("/userinfo/*", publicCors());
oauthRoute.use("/revoke", publicCors());
oauthRoute.use("/revoke/*", publicCors());
oauthRoute.use("/introspect", publicCors());
oauthRoute.use("/introspect/*", publicCors());
oauthRoute.use("/avatar", publicCors());
oauthRoute.use("/avatar/*", publicCors());

// Dashboard-internal endpoints
oauthRoute.use("/approve", dashboardCors());
oauthRoute.use("/approve/*", dashboardCors());
oauthRoute.use("/details", dashboardCors());
oauthRoute.use("/details/*", dashboardCors());
oauthRoute.use("/grant", dashboardCors());
oauthRoute.use("/grant/*", dashboardCors());
oauthRoute.use("/clients", dashboardCors());
oauthRoute.use("/clients/*", dashboardCors());

oauthRoute.route("/authorize", authorize);
oauthRoute.route("/clients", clients);
oauthRoute.route("/introspect", introspect);
oauthRoute.route("/revoke", revoke);
oauthRoute.route("/token", token);
oauthRoute.route("/userinfo", userinfo);
oauthRoute.route("/approve", approve);
oauthRoute.route("/avatar", avatar);
oauthRoute.route("/details", details);
oauthRoute.route("/grant", grant);

export default oauthRoute;
