import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import sessionIdRoute from "./:sessionId";
import getRoute from "./get";
import revokeAllRoute from "./revoke-all";

const route = new OpenAPIHono<AppEnv>()
	.route("/", getRoute)
	.route("/revoke-all", revokeAllRoute)
	.route("/:sessionId", sessionIdRoute);

export default route;
