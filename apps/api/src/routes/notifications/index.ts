import { OpenAPIHono } from "@hono/zod-openapi";

import idRoute from "./:id";
import getRoute from "./get";
import readAllRoute from "./read-all";
import streamRoute from "./stream";

const route = new OpenAPIHono<{ Bindings: Env }>()
	.route("/", getRoute)
	.route("/stream", streamRoute)
	.route("/read-all", readAllRoute)
	.route("/:id", idRoute);

export default route;
