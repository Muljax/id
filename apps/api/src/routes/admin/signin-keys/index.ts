import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import singleKey from "./:id";
import get from "./get";
import post from "./post";

const signinKeysRoute = new OpenAPIHono<AppEnv>()
	.route("/", get)
	.route("/", post)
	.route("/:id", singleKey);

export default signinKeysRoute;
