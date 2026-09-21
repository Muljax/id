import { OpenAPIHono } from "@hono/zod-openapi";

import deleteRoute from "./delete";
import readRoute from "./read";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/read", readRoute)
	.route("/", deleteRoute);

export default route;
