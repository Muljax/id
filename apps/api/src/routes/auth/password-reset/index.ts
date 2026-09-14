import { Hono } from "hono";

import confirmRoute from "./confirm/post";
import requestRoute from "./request/post";
import verifyRoute from "./verify/get";

const route = new Hono<{ Bindings: Env }>();

route.route("/request", requestRoute);
route.route("/verify", verifyRoute);
route.route("/confirm", confirmRoute);

export default route;
