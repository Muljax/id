import { OpenAPIHono } from "@hono/zod-openapi";

import approve from "./approve";
import code from "./code";
import deny from "./deny";
import details from "./details";

const device = new OpenAPIHono<{ Bindings: Env }>()
	.route("/code", code)
	.route("/details", details)
	.route("/approve", approve)
	.route("/deny", deny);

export default device;
