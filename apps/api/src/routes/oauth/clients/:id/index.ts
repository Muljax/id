import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import deleteRoute from "./delete";
import patchRoute from "./patch";

const route = new OpenAPIHono<AppEnv>()
	.route("/", patchRoute)
	.route("/", deleteRoute);

export default route;
