import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/middleware/auth";
import getRoute from "./get";

const route = new OpenAPIHono<AppEnv>().route("/", getRoute);

export default route;
