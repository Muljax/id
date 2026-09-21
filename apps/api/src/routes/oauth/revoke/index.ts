import { OpenAPIHono } from "@hono/zod-openapi";
import { getClientIp, rateLimit } from "@/middleware/rateLimiter";
import postRoute from "./post";

const revokeRateLimit = rateLimit((c) => `oauth:revoke:${getClientIp(c)}`);

const route = new OpenAPIHono<{ Bindings: Env }>()
	.use("*", revokeRateLimit)
	.route("/", postRoute);

export default route;
