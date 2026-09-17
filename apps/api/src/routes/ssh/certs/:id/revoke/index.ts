import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import post from "./post";

const route = new Hono<AppEnv>();

route.route("/", post);

export default route;
