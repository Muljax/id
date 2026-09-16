import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import getRoute from "./get";
import passwordResetLinkRoute from "./:userId/password-reset-link";
import userRolesRoute from "./:userId/roles";
import userPermissionsRoute from "./:userId/permissions";

const route = new Hono<AppEnv>();

route.route("/", getRoute);
route.route("/:userId/password-reset-link", passwordResetLinkRoute);
route.route("/:userId/roles", userRolesRoute);
route.route("/:userId/permissions", userPermissionsRoute);

export default route;
