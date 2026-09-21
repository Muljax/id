import { OpenAPIHono } from "@hono/zod-openapi";

import getRoute from "./get";
import postRoute from "./post";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/", getRoute)
	.route("/", postRoute);

export default route;
