import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import deleteRoute from "./delete";

const singleSigninKey = new Hono<AppEnv>();

singleSigninKey.route("/", deleteRoute);

export default singleSigninKey;
