import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import deletePerm from "./:permissionId/delete";
import get from "./get";
import post from "./post";
import put from "./put";

const permissionsRoute = new OpenAPIHono<AppEnv>()
	.route("/", get)
	.route("/", put)
	.route("/", post)
	.route("/:permissionId", deletePerm);

export default permissionsRoute;
