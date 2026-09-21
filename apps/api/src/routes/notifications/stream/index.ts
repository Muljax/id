import { OpenAPIHono } from "@hono/zod-openapi";

import getRoute from "./get";

const route = new OpenAPIHono<{ Bindings: Env }>().route("/", getRoute);

export default route;
