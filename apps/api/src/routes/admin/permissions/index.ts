import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import get from "./get";

const permissionsRoute = new Hono<AppEnv>();

permissionsRoute.route("/", get);

export default permissionsRoute;
