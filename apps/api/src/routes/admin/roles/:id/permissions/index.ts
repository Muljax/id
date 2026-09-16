import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import put from "./put";
import post from "./post";
import deletePerm from "./:permissionId/delete";

const permissionsRoute = new Hono<AppEnv>();

permissionsRoute.route("/", get);
permissionsRoute.route("/", put);
permissionsRoute.route("/", post);
permissionsRoute.route("/:permissionId", deletePerm);

export default permissionsRoute;
