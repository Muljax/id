import { Hono } from "hono";
import login from "./login";
import logout from "./logout";
import me from "./me";
import passwordReset from "./password-reset";
import register from "./register";
import sessions from "./sessions";
import { rateLimit } from "../../middleware/rateLimiter";

const auth = new Hono<{ Bindings: Env }>();
const authRateLimit = rateLimit(
	(c) => `auth:${c.req.header("CF-Connecting-IP") ?? "unknown"}`,
);

login.use("*", authRateLimit);
register.use("*", authRateLimit);
passwordReset.use("*", authRateLimit);

auth.route("/register", register);
auth.route("/login", login);
auth.route("/logout", logout);
auth.route("/me", me);
auth.route("/sessions", sessions);
auth.route("/password-reset", passwordReset);

export default auth;
