import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

import { getDashboardOrigin, isLocalhost } from "../lib/env";
import type { AppEnv } from "./auth";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Cross-site origin and CSRF protection middleware for session-authenticated mutations.
 */
export async function csrfProtection(c: Context<AppEnv>, next: Next) {
	if (SAFE_METHODS.has(c.req.method.toUpperCase())) {
		return next();
	}

	const sessionCookie = getCookie(c, "session");
	if (!sessionCookie) {
		return next();
	}

	// In localhost development mode, allow localhost/127.0.0.1 origins
	if (c.env && isLocalhost(c.env)) {
		return next();
	}

	const secFetchSite = c.req.header("Sec-Fetch-Site");
	if (secFetchSite === "cross-site") {
		return c.json(
			{
				error: "access_denied",
				error_description: "Cross-site request blocked.",
			},
			403,
		);
	}

	const origin = c.req.header("Origin");
	const expectedOrigin = c.env ? getDashboardOrigin(c.env) : null;

	if (origin && expectedOrigin && origin !== expectedOrigin) {
		return c.json(
			{
				error: "access_denied",
				error_description: "Invalid request origin.",
			},
			403,
		);
	}

	await next();
}
