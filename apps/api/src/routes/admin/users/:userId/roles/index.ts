import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import deleteRole from "./:roleId/delete";
import get from "./get";
import post from "./post";
import put from "./put";

const userRolesRoute = new OpenAPIHono<AppEnv>()
	.route("/", get)
	.route("/", put)
	.route("/", post)
	.route("/:roleId", deleteRole);

export default userRolesRoute;
