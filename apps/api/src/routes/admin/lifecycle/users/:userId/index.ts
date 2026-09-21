import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import lifecycleRoute from "./lifecycle";

const route = new OpenAPIHono<AppEnv>().route("/lifecycle", lifecycleRoute);

export default route;
