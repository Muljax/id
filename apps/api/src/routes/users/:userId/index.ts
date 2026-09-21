import { OpenAPIHono } from "@hono/zod-openapi";

import avatarRoute from "./avatar";

const route = new OpenAPIHono<{ Bindings: Env }>().route(
	"/avatar",
	avatarRoute,
);

export default route;
