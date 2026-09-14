import { Hono } from "hono";

import { dashboardCors } from "./middleware/cors";
import admin from "./routes/admin";
import auth from "./routes/auth";
import passkeys from "./routes/passkeys";
import oauth from "./routes/oauth";
import wellKnown from "./routes/well-known";
import account from "./routes/account";
import notifications from "./routes/notifications";
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
app.route("/oauth", oauth);
app.route("/.well-known", wellKnown);
app.route("/api/users", users);

export default app;

// Wrangler insisted this was re exported in the worker source file
import { LifecycleWorkflow } from "./workflows/lifecycle";

export { LifecycleWorkflow };
