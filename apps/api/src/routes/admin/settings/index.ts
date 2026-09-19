import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import patch from "./patch";

const settingsRoute = new Hono<AppEnv>();

settingsRoute.route("/", get);
settingsRoute.route("/", patch);

export default settingsRoute;
