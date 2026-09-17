import { Hono } from "hono";

import { createDb } from "./db";
import { cleanupExpiredAuthData } from "./lib/cleanup";
import { dashboardCors } from "./middleware/cors";
import admin from "./routes/admin";
import auth from "./routes/auth";
import passkeys from "./routes/passkeys";
import oauth from "./routes/oauth";
import wellKnown from "./routes/well-known";
import account from "./routes/account";
import notifications from "./routes/notifications";
import ssh from "./routes/ssh";
import users from "./routes/users";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", dashboardCors());

app.get("/api/health", (c) => {
	return c.json({
		status: "ok",
		database: "connected",
	});
});

app.route("/api/auth", auth);
app.route("/api/admin", admin);
app.route("/api/passkeys", passkeys);
app.route("/api/account", account);
app.route("/api/notifications", notifications);
app.route("/api/ssh", ssh);
app.route("/oauth", oauth);
app.route("/.well-known", wellKnown);
app.route("/api/users", users);

export default {
	fetch: app.fetch,
	async scheduled(
		_controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	) {
		const db = createDb(env.DB);
		ctx.waitUntil(cleanupExpiredAuthData(db));
	},
};

// Wrangler insisted this was re exported in the worker source file
import { LifecycleWorkflow } from "./workflows/lifecycle";

export { LifecycleWorkflow };
