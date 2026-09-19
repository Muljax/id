import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import deleteRoute from "./delete";

const singleInviteRoute = new Hono<AppEnv>();

singleInviteRoute.route("/", deleteRoute);

export default singleInviteRoute;
