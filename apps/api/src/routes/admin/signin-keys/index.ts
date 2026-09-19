import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import post from "./post";
import singleSigninKey from "./:id";

const signinKeysRoute = new Hono<AppEnv>();

signinKeysRoute.route("/", get);
signinKeysRoute.route("/", post);
signinKeysRoute.route("/:id", singleSigninKey);

export default signinKeysRoute;
