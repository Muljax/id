import { Hono } from "hono";

import authorize from "./authorize";
import clients from "./clients";
import introspect from "./introspect";
import revoke from "./revoke";
import token from "./token";
import userinfo from "./userinfo";
import approve from "./approve";
import avatar from "./avatar";
import details from "./details";
import grant from "./grant";

import { dashboardCors, publicCors } from "@/middleware/cors";

const oauthRoute = new Hono<{
	Bindings: Env;
}>();

// Public OAuth & OIDC endpoints (RFC 6749, RFC 7009, RFC 7662, OIDC Core)
token.use("*", publicCors());
userinfo.use("*", publicCors());
revoke.use("*", publicCors());
introspect.use("*", publicCors());
avatar.use("*", publicCors());

// Dashboard-internal endpoints
approve.use("*", dashboardCors());
details.use("*", dashboardCors());
grant.use("*", dashboardCors());
clients.use("*", dashboardCors());

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
