import { OpenAPIHono } from "@hono/zod-openapi";
import { getClientIp, rateLimit } from "@/middleware/rateLimiter";
import postRoute from "./post";

const deviceCodeRateLimit = rateLimit(
	(c) => `oauth:device:code:${getClientIp(c)}`,
);

const route = new OpenAPIHono<{ Bindings: Env }>()
	.use("*", deviceCodeRateLimit)
	.route("/", postRoute);

export default route;
