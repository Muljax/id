import { Hono } from "hono";

import getRoute from "./get";

const route = new Hono<{ Bindings: Env }>();

route.route("/", getRoute);

export default route;
