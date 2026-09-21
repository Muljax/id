import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import userRoute from "./:userId";

const route = new OpenAPIHono<AppEnv>().route("/:userId", userRoute);

export default route;
