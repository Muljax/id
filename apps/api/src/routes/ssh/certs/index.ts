import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import get from "./get";
import issue from "./issue";
import singleCert from "./:id";

const route = new Hono<AppEnv>();

route.route("/", get);
route.route("/issue", issue);
route.route("/:id", singleCert);

export default route;
