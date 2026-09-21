import { OpenAPIHono } from "@hono/zod-openapi";

import approve from "./approve";
import authorize from "./authorize";
import avatar from "./avatar";
import clients from "./clients";
import details from "./details";
import device from "./device";
import grant from "./grant";
import introspect from "./introspect";
import revoke from "./revoke";
import token from "./token";
import userinfo from "./userinfo";

const oauth = new OpenAPIHono<{ Bindings: Env }>()
	.route("/authorize", authorize)
	.route("/token", token)
	.route("/userinfo", userinfo)
	.route("/revoke", revoke)
	.route("/introspect", introspect)
	.route("/clients", clients)
	.route("/avatar", avatar)
	.route("/details", details)
	.route("/grant", grant)
	.route("/approve", approve)
	.route("/device", device);

export default oauth;
