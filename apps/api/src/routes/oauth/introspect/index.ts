import { OpenAPIHono } from "@hono/zod-openapi";
import { getClientIp, rateLimit } from "@/middleware/rateLimiter";
import postRoute from "./post";

const introspectRateLimit = rateLimit(
	(c) => `oauth:introspect:${getClientIp(c)}`,
);

const route = new OpenAPIHono<{ Bindings: Env }>()
	.use("*", introspectRateLimit)
	.route("/", postRoute);

export default route;
