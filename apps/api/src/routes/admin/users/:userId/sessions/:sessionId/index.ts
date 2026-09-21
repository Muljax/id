import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import revokeRoute from "./revoke";

const route = new OpenAPIHono<AppEnv>().route("/revoke", revokeRoute);

export default route;
