import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import get from "./get";

const route = new Hono<AppEnv>();

route.route("/", get);

export default route;
