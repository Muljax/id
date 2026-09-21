import { OpenAPIHono } from "@hono/zod-openapi";

import clientIdRoute from "./:clientId";
import getRoute from "./get";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/", getRoute)
	.route("/:clientId", clientIdRoute);

export default route;
