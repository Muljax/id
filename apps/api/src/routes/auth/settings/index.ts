import { Hono } from "hono";

import get from "./get";

const settings = new Hono<{ Bindings: Env }>();

settings.route("/", get);

export default settings;
