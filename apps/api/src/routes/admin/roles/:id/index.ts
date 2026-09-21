import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import deleteRole from "./delete";
import get from "./get";
import patch from "./patch";
import permissions from "./permissions";

const singleRoleRoute = new OpenAPIHono<AppEnv>()
	.route("/", get)
	.route("/", patch)
	.route("/", deleteRole)
	.route("/permissions", permissions);

export default singleRoleRoute;
