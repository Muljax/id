import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import bootstrap from "./bootstrap";
import invites from "./invites";
import lifecycle from "./lifecycle";
import permissions from "./permissions";
import roles from "./roles";
import settings from "./settings";
import signinKeys from "./signin-keys";
import users from "./users";

const admin = new Hono<AppEnv>();

admin.route("/bootstrap", bootstrap);
admin.route("/", lifecycle);
admin.route("/users", users);
admin.route("/invites", invites);
admin.route("/roles", roles);
admin.route("/permissions", permissions);
admin.route("/settings", settings);
admin.route("/signin-keys", signinKeys);

export default admin;
