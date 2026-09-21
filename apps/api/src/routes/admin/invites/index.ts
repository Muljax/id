import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import singleInvite from "./:id";
import get from "./get";
import post from "./post";

const invitesRoute = new OpenAPIHono<AppEnv>()
	.route("/", get)
	.route("/", post)
	.route("/:id", singleInvite);

export default invitesRoute;
