import { app } from "./app";
import { createDb } from "./db";
import { cleanupExpiredAuthData } from "./lib/cleanup";
import { LifecycleWorkflow } from "./workflows/lifecycle";

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

export { app };
export { getHealthRoute } from "./app";
export type AppType = typeof app;
export * from "./types";
export { LifecycleWorkflow };
