import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import revoke from "./revoke";

const singleCertRoute = new Hono<AppEnv>();

singleCertRoute.route("/revoke", revoke);

export default singleCertRoute;
