import { OpenAPIHono } from "@hono/zod-openapi";

import sessionRoute from "./:id";
import getRoute from "./get";
import revokeAllRoute from "./revoke-all";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/", getRoute)
	.route("/revoke-all", revokeAllRoute)
	.route("/:id", sessionRoute);

export default route;
