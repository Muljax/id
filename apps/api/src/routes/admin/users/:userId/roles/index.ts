import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import put from "./put";
import post from "./post";
import deleteRole from "./:roleId/delete";

const userRolesRoute = new Hono<AppEnv>();

userRolesRoute.route("/", get);
userRolesRoute.route("/", put);
userRolesRoute.route("/", post);
userRolesRoute.route("/:roleId", deleteRole);

export default userRolesRoute;
