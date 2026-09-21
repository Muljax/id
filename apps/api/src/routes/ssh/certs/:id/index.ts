import { OpenAPIHono } from "@hono/zod-openapi";

import revokeRoute from "./revoke";

const route = new OpenAPIHono<{ Bindings: Env }>().route(
	"/revoke",
	revokeRoute,
);

export default route;
