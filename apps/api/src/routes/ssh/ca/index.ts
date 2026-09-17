import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import publicKey from "./public-key";
import revokedKeys from "./revoked-keys";

const route = new Hono<AppEnv>();

route.route("/public-key", publicKey);
route.route("/revoked-keys", revokedKeys);

export default route;
