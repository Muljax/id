import { OpenAPIHono } from "@hono/zod-openapi";

import deleteRoute from "./delete";

const route = new OpenAPIHono<{ Bindings: Env }>().route("/", deleteRoute);

export default route;
