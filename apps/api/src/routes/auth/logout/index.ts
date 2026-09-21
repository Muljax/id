import { OpenAPIHono } from "@hono/zod-openapi";

import postRoute from "./post";

const route = new OpenAPIHono<{ Bindings: Env }>().route("/", postRoute);

export default route;
