import { OpenAPIHono } from "@hono/zod-openapi";

import grantsRoute from "./grants";

const route = new OpenAPIHono<{ Bindings: Env }>().route(
	"/grants",
	grantsRoute,
);

export default route;
