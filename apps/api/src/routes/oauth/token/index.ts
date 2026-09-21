import { OpenAPIHono } from "@hono/zod-openapi";
import { getClientIp, rateLimit } from "@/middleware/rateLimiter";
import postRoute from "./post";

const tokenRateLimit = rateLimit((c) => `oauth:token:${getClientIp(c)}`);

const route = new OpenAPIHono<{ Bindings: Env }>()
	.use("*", tokenRateLimit)
	.route("/", postRoute);

export default route;
