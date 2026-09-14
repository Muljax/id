import { cors } from "hono/cors";
import { getDashboardOrigin, isLocalhost } from "../lib/env";

export function dashboardCors() {
	return cors({
		origin: (origin, c) => {
			const dashboardOrigin = getDashboardOrigin(c.env);

			if (origin === dashboardOrigin) {
				return origin;
			}

			if (
				isLocalhost(c.env) &&
				(origin.startsWith("http://localhost:") ||
					origin.startsWith("http://127.0.0.1:"))
			) {
				return origin;
			}

			return null;
		},
		credentials: true,
	});
}

export function publicCors() {
	return cors({
		origin: "*",
	});
}
