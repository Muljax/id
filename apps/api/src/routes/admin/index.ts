import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/middleware/auth";
import bootstrap from "./bootstrap";
import invites from "./invites";
import permissions from "./permissions";
import roles from "./roles";
import settings from "./settings";
import signinKeys from "./signin-keys";
import users from "./users";

const admin = new OpenAPIHono<AppEnv>()
	.route("/bootstrap", bootstrap)
	.route("/users", users)
	.route("/invites", invites)
	.route("/roles", roles)
	.route("/permissions", permissions)
	.route("/settings", settings)
	.route("/signin-keys", signinKeys);

export default admin;
