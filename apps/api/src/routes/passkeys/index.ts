import { Hono } from "hono";

import { rateLimit } from "@/middleware/rateLimiter";
import getRoute from "./get";
import registerRoute from "./register";
import loginRoute from "./login";
import passkeyRoute from "./:id";

const route = new Hono<{ Bindings: Env }>();

const passkeyRateLimit = rateLimit(
	(c) => `passkeys:${c.req.header("CF-Connecting-IP") ?? "unknown"}`,
);

registerRoute.use("*", passkeyRateLimit);
loginRoute.use("*", passkeyRateLimit);

route.route("/", getRoute);
route.route("/register", registerRoute);
route.route("/login", loginRoute);
route.route("/:id", passkeyRoute);

export default route;
