import { OpenAPIHono } from "@hono/zod-openapi";

import jwks from "./jwks";
import openidConfiguration from "./openid-configuration";

const wellKnown = new OpenAPIHono<{ Bindings: Env }>()
	.route("/jwks.json", jwks)
	.route("/openid-configuration", openidConfiguration);

export default wellKnown;
