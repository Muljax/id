import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/middleware/auth";
import publicKeyRoute from "./public-key";
import revokedKeysRoute from "./revoked-keys";

const route = new OpenAPIHono<AppEnv>()
	.route("/public-key", publicKeyRoute)
	.route("/revoked-keys", revokedKeysRoute);

export default route;
