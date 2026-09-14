import { cors } from "hono/cors";
import { getDashboardOrigin } from "../lib/env";

export function dashboardCors() {
	return cors({
		origin: (origin, c) => {
			const dashboardOrigin = getDashboardOrigin(c.env);

			return origin === dashboardOrigin ? origin : null;
		},
		credentials: true,
	});
}
