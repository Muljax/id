import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import singleRole from "./:id";
import get from "./get";
import post from "./post";

const rolesRoute = new OpenAPIHono<AppEnv>()
	.route("/", get)
	.route("/", post)
	.route("/:id", singleRole);

export default rolesRoute;
