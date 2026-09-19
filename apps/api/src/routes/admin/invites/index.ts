import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import post from "./post";
import singleInvite from "./:id";

const invitesRoute = new Hono<AppEnv>();

invitesRoute.route("/", get);
invitesRoute.route("/", post);
invitesRoute.route("/:id", singleInvite);

export default invitesRoute;
