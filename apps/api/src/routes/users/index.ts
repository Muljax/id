import { OpenAPIHono } from "@hono/zod-openapi";

import userRoute from "./:userId";

const route = new OpenAPIHono<{ Bindings: Env }>().route("/:userId", userRoute);

export default route;
