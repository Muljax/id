import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import clientById from "./:id";
import getRoute from "./get";
import postRoute from "./post";

const clients = new OpenAPIHono<AppEnv>()
	.route("/", getRoute)
	.route("/", postRoute)
	.route("/:id", clientById);

export default clients;
