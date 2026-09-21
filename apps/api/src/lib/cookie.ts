import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { isLocalhost } from "./env";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Sets the authenticated session cookie.
 *
 * The cookie is HTTP-only, secure, and configured for cross-site requests.
 *
 * @param c The Hono request context.
 * @param token The session token to store in the cookie.
 * @param maxAge The cookie lifetime in seconds.
 */
export function setSessionCookie(
	c: Context<{ Bindings: Env }>,
	token: string,
	maxAge = SESSION_MAX_AGE,
) {
	const localhost = isLocalhost(c.env);

	setCookie(c, SESSION_COOKIE, token, {
		httpOnly: true,
		secure: !localhost,
		sameSite: "Lax",
		path: "/",
		maxAge,
	});
}

/**
 * Clears the authenticated session cookie.
 *
 * @param c The Hono request context.
 */
export function clearSessionCookie(c: Context<{ Bindings: Env }>) {
	const localhost = isLocalhost(c.env);

	deleteCookie(c, SESSION_COOKIE, {
		httpOnly: true,
		secure: !localhost,
		sameSite: "Lax",
		path: "/",
	});
}
