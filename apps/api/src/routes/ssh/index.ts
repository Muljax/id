import { Hono } from "hono";

import type { AppEnv } from "@/middleware/auth";
import ca from "./ca";
import certs from "./certs";
import keys from "./keys";
import principals from "./principals";

const ssh = new Hono<AppEnv>();

ssh.route("/ca", ca);
ssh.route("/principals", principals);
ssh.route("/certs", certs);
ssh.route("/keys", keys);

export default ssh;
