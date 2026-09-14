import { Hono } from "hono";

import postRoute from "./post";

const route = new Hono<{ Bindings: Env }>();

route.route("/", postRoute);

export default route;
