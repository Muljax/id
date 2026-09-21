import { OpenAPIHono } from "@hono/zod-openapi";
import { getClientIp, rateLimit } from "@/middleware/rateLimiter";
import postRoute from "./post";

const passwordRateLimit = rateLimit(
	(c) => `account:password:${getClientIp(c)}`,
);

const route = new OpenAPIHono<{ Bindings: Env }>()
	.use("*", passwordRateLimit)
	.route("/", postRoute);

export default route;
