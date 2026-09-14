import { Hono } from "hono";

import getRoute from "./get";
import passwordResetLinkRoute from "./:userId/password-reset-link";

const route = new Hono<{ Bindings: Env }>();

route.route("/", getRoute);
route.route("/:userId/password-reset-link", passwordResetLinkRoute);

export default route;
