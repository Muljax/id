import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import patch from "./patch";
import deleteRole from "./delete";
import permissions from "./permissions";

const singleRoleRoute = new Hono<AppEnv>();

singleRoleRoute.route("/", get);
singleRoleRoute.route("/", patch);
singleRoleRoute.route("/", deleteRole);
singleRoleRoute.route("/permissions", permissions);

export default singleRoleRoute;
