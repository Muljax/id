import { OpenAPIHono } from "@hono/zod-openapi";

import avatar from "./avatar";
import deleteRoute from "./delete";
import oauth from "./oauth";
import password from "./password";
import profile from "./profile";

const account = new OpenAPIHono<{ Bindings: Env }>()
	.route("/profile", profile)
	.route("/avatar", avatar)
	.route("/oauth", oauth)
	.route("/password", password)
	.route("/", deleteRoute);

export default account;
