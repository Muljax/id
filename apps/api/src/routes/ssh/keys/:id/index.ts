import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import deleteKey from "./delete";

const route = new Hono<AppEnv>();

route.route("/", deleteKey);

export default route;
