import { OpenAPIHono } from "@hono/zod-openapi";
import { getClientIp, rateLimit } from "@/middleware/rateLimiter";
import type { AppEnv } from "@/middleware/auth";
import postRoute from "./post";

const sshIssueRateLimit = rateLimit((c) => `ssh:issue:${getClientIp(c)}`);

const route = new OpenAPIHono<AppEnv>()
	.use("*", sshIssueRateLimit)
	.route("/", postRoute);

export default route;
