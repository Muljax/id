import { createMiddleware } from "hono/factory";

import type { AppEnv } from "./auth";

/**
 * Attaches standard defense-in-depth security headers to all API responses.
 */
export function securityHeaders() {
	return createMiddleware<AppEnv>(async (c, next) => {
		await next();

		c.res.headers.set("X-Content-Type-Options", "nosniff");
		c.res.headers.set("X-Frame-Options", "DENY");
		c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		c.res.headers.set(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains; preload",
		);
		c.res.headers.set(
			"Content-Security-Policy",
			"default-src 'none'; frame-ancestors 'none'",
		);
		c.res.headers.set("X-XSS-Protection", "0");
	});
}

/**
 * Ensures sensitive routes (auth, account, tokens, user data) are never cached by intermediaries or browsers.
 * Preserves custom Cache-Control headers if already set by specific endpoints (e.g. avatar images).
 */
export function sensitiveCacheControl() {
	return createMiddleware<AppEnv>(async (c, next) => {
		await next();

		if (!c.res.headers.has("Cache-Control")) {
			c.res.headers.set(
				"Cache-Control",
				"no-store, no-cache, must-revalidate, private",
			);
			c.res.headers.set("Pragma", "no-cache");
			c.res.headers.set("Expires", "0");
		}
	});
}
