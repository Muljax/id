import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import get from "./get";

const userPermissionsRoute = new Hono<AppEnv>();

userPermissionsRoute.route("/", get);

export default userPermissionsRoute;
