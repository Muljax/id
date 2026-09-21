import { OpenAPIHono } from "@hono/zod-openapi";

import { getClientIp, rateLimit } from "@/middleware/rateLimiter";
import passkeyRoute from "./:id";
import getRoute from "./get";
import loginRoute from "./login";
import registerRoute from "./register";

const passkeyRateLimit = rateLimit((c) => `passkeys:${getClientIp(c)}`);

registerRoute.use("*", passkeyRateLimit);
loginRoute.use("*", passkeyRateLimit);

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/", getRoute)
	.route("/register", registerRoute)
	.route("/login", loginRoute)
	.route("/:id", passkeyRoute);

export default route;
