import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import singleKey from "./:id";
import get from "./get";
import post from "./post";

const route = new Hono<AppEnv>();

route.route("/", get);
route.route("/", post);
route.route("/:id", singleKey);

export default route;
