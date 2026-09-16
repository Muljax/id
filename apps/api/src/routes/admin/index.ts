import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import bootstrap from "./bootstrap";
import lifecycle from "./lifecycle";
import permissions from "./permissions";
import roles from "./roles";
import users from "./users";

const admin = new Hono<AppEnv>();

admin.route("/bootstrap", bootstrap);
admin.route("/", lifecycle);
admin.route("/users", users);
admin.route("/roles", roles);
admin.route("/permissions", permissions);

export default admin;
