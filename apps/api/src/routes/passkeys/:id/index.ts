import { OpenAPIHono } from "@hono/zod-openapi";

import deleteRoute from "./delete";
import patchRoute from "./patch";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/", patchRoute)
	.route("/", deleteRoute);

export default route;
