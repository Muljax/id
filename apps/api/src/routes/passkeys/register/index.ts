import { OpenAPIHono } from "@hono/zod-openapi";

import optionsRoute from "./options";
import verifyRoute from "./verify";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/options", optionsRoute)
	.route("/verify", verifyRoute);

export default route;
