import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import ca from "./ca";
import certs from "./certs";
import keys from "./keys";
import principals from "./principals";

const ssh = new OpenAPIHono<AppEnv>()
	.route("/ca", ca)
	.route("/principals", principals)
	.route("/certs", certs)
	.route("/keys", keys);

export default ssh;
