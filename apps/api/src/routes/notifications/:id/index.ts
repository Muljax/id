import { Hono } from "hono";

import deleteRoute from "./delete";
import readRoute from "./read";

const route = new Hono<{ Bindings: Env }>();

route.route("/", deleteRoute);
route.route("/read", readRoute);

export default route;
