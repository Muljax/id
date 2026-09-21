import type { Context, MiddlewareHandler } from "hono";
import { isLocalhost } from "../lib/env";

/**
 * Extracts client IP address safely from Cloudflare and proxy headers.
 */
export function getClientIp(c: Context): string {
	return (
		c.req.header("CF-Connecting-IP") ||
		c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
		"127.0.0.1"
	);
}

export interface RateLimitOptions {
	retryAfterSeconds?: number;
}

/**
 * Creates middleware that applies native Cloudflare Worker rate limiting.
 *
 * @param getKey Returns the rate-limit key for the request.
 * @param options Optional configuration (e.g. custom retry-after seconds).
 * @returns Hono middleware that rejects requests exceeding the configured limit.
 */
export function rateLimit(
	getKey: (c: Context<{ Bindings: Env }>) => string,
	options: RateLimitOptions = {},
): MiddlewareHandler {
	const retryAfter = options.retryAfterSeconds ?? 60;

	return async (c, next) => {
		// Bypass when running locally or if rate limiter binding is absent (e.g. test environment)
		if (!c.env?.AUTH_RATE_LIMITER || isLocalhost(c.env)) {
			return next();
		}

		try {
			const key = getKey(c as Context<{ Bindings: Env }>);
			const result = await c.env.AUTH_RATE_LIMITER.limit({ key });

			if (!result.success) {
				c.header("Retry-After", String(retryAfter));
				return c.json(
					{
						error: "rate_limit_exceeded",
						error_description: `Too many requests. Please try again in ${retryAfter} seconds.`,
					},
					429,
				);
			}
		} catch {
			// Fail open on rate limiter backend errors to preserve service availability
			return next();
		}

		await next();
	};
}
