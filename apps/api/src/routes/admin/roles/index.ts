import { Hono } from "hono";
import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import post from "./post";
import singleRole from "./:id";

const rolesRoute = new Hono<AppEnv>();

rolesRoute.route("/", get);
rolesRoute.route("/", post);
rolesRoute.route("/:id", singleRole);

export default rolesRoute;
