import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "@/middleware/auth";
import lifecycleRoute from "../lifecycle/users/:userId/lifecycle";
import deleteRoute from "./:userId/delete";
import passwordResetLinkRoute from "./:userId/password-reset-link";
import userPermissionsRoute from "./:userId/permissions";
import userRolesRoute from "./:userId/roles";
import userSessionsRoute from "./:userId/sessions";
import getRoute from "./get";
import postRoute from "./post";

const route = new OpenAPIHono<AppEnv>()
	.route("/", getRoute)
	.route("/", postRoute)
	.route("/:userId/password-reset-link", passwordResetLinkRoute)
	.route("/:userId/roles", userRolesRoute)
	.route("/:userId/permissions", userPermissionsRoute)
	.route("/:userId/sessions", userSessionsRoute)
	.route("/:userId/lifecycle", lifecycleRoute)
	.route("/:userId", deleteRoute);

export default route;
