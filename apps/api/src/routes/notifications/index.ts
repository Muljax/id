import { Hono } from "hono";

import getRoute from "./get";
import idRoute from "./:id";
import readAllRoute from "./read-all";
import streamRoute from "./stream";

const route = new Hono<{ Bindings: Env }>();

route.route("/", getRoute);
route.route("/stream", streamRoute);
route.route("/read-all", readAllRoute);
route.route("/:id", idRoute);

export default route;
