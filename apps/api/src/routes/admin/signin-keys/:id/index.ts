import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import deleteKey from "./delete";

const route = new OpenAPIHono<AppEnv>().route("/", deleteKey);

export default route;
