import { OpenAPIHono } from "@hono/zod-openapi";

import patchRoute from "./patch";

const route = new OpenAPIHono<{ Bindings: Env }>().route("/", patchRoute);

export default route;
