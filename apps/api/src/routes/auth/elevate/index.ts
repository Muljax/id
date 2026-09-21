import { OpenAPIHono } from "@hono/zod-openapi";
import options from "./options/post";
import verify from "./verify/post";

const elevate = new OpenAPIHono<{ Bindings: Env }>()
	.route("/options", options)
	.route("/verify", verify);

export default elevate;
