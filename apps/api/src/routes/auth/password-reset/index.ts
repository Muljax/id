import { OpenAPIHono } from "@hono/zod-openapi";

import confirmRoute from "./confirm/post";
import requestRoute from "./request/post";
import verifyRoute from "./verify/get";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/request", requestRoute)
	.route("/verify", verifyRoute)
	.route("/confirm", confirmRoute);

export default route;
