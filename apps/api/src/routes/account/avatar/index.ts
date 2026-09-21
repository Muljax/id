import { OpenAPIHono } from "@hono/zod-openapi";

import deleteRoute from "./delete";
import getRoute from "./get";
import putRoute from "./put";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/", getRoute)
	.route("/", putRoute)
	.route("/", deleteRoute);

export default route;
