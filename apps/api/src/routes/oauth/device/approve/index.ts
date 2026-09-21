import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/middleware/auth";

import postRoute from "./post";

const route = new OpenAPIHono<AppEnv>().route("/", postRoute);

export default route;
