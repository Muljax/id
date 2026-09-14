import { Hono } from "hono";

import { publicCors } from "@/middleware/cors";
import jwksRoute from "./jwks";
import openIdConfigurationRoute from "./openid-configuration";

const route = new Hono<{ Bindings: Env }>();

route.use("*", publicCors());
route.route("/jwks.json", jwksRoute);
route.route("/jwks", jwksRoute);
route.route("/openid-configuration", openIdConfigurationRoute);

export default route;
