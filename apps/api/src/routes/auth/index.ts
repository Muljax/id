import { OpenAPIHono } from "@hono/zod-openapi";
import { getClientIp, rateLimit } from "../../middleware/rateLimiter";
import elevate from "./elevate";
import login from "./login";
import logout from "./logout";
import me from "./me";
import passwordReset from "./password-reset";
import register from "./register";
import sessions from "./sessions";
import settings from "./settings";

const authRateLimit = rateLimit((c) => `auth:${getClientIp(c)}`);

login.use("*", authRateLimit);
register.use("*", authRateLimit);
passwordReset.use("*", authRateLimit);
elevate.use("*", authRateLimit);

const auth = new OpenAPIHono<{ Bindings: Env }>()
	.route("/register", register)
	.route("/login", login)
	.route("/logout", logout)
	.route("/me", me)
	.route("/sessions", sessions)
	.route("/password-reset", passwordReset)
	.route("/settings", settings)
	.route("/elevate", elevate);

export default auth;
