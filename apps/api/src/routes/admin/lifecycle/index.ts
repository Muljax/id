import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import usersRoute from "./users";

const route = new OpenAPIHono<AppEnv>().route("/users", usersRoute);

export default route;
