import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@/middleware/auth";
import idRoute from "./:id";
import getRoute from "./get";
import issueRoute from "./issue";

const route = new OpenAPIHono<AppEnv>()
	.route("/", getRoute)
	.route("/issue", issueRoute)
	.route("/:id", idRoute);

export default route;
