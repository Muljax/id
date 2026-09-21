import { describe, expect, test } from "bun:test";
import { clearSessionCookie, setSessionCookie } from "../src/lib/cookie";
import { createTestContext } from "./helpers";

describe("Session Cookie Utilities", () => {
	test("setSessionCookie sets secure httpOnly cookie in production mode", () => {
		const c = createTestContext({ env: { LOCALHOST: "false" } });
		setSessionCookie(c, "test-session-token-xyz");

		const setCookieHeader = c.res.headers.get("Set-Cookie");
		expect(setCookieHeader).toBeDefined();
		expect(setCookieHeader).toContain("session=test-session-token-xyz");
		expect(setCookieHeader).toContain("HttpOnly");
		expect(setCookieHeader).toContain("Secure");
		expect(setCookieHeader).toContain("SameSite=Lax");
		expect(setCookieHeader).toContain("Path=/");
		expect(setCookieHeader).toContain("Max-Age=2592000"); // 30 days
	});

	test("setSessionCookie supports custom maxAge", () => {
		const c = createTestContext({ env: { LOCALHOST: "false" } });
		setSessionCookie(c, "test-session-token-xyz", 3600);

		const setCookieHeader = c.res.headers.get("Set-Cookie");
		expect(setCookieHeader).toContain("Max-Age=3600");
	});

	test("setSessionCookie omits Secure flag when running on localhost", () => {
		const c = createTestContext({ env: { LOCALHOST: "true" } });
		setSessionCookie(c, "local-session-token");

		const setCookieHeader = c.res.headers.get("Set-Cookie");
		expect(setCookieHeader).toBeDefined();
		expect(setCookieHeader).toContain("session=local-session-token");
		expect(setCookieHeader).toContain("HttpOnly");
		expect(setCookieHeader).toContain("SameSite=Lax");
		expect(setCookieHeader).not.toContain("Secure");
	});

	test("clearSessionCookie clears session cookie in production and localhost", () => {
		const prodCtx = createTestContext({ env: { LOCALHOST: "false" } });
		clearSessionCookie(prodCtx);
		const prodCookie = prodCtx.res.headers.get("Set-Cookie");
		expect(prodCookie).toContain("session=");
		expect(prodCookie).toContain("Max-Age=0");
		expect(prodCookie).toContain("Secure");

		const localCtx = createTestContext({ env: { LOCALHOST: "true" } });
		clearSessionCookie(localCtx);
		const localCookie = localCtx.res.headers.get("Set-Cookie");
		expect(localCookie).toContain("session=");
		expect(localCookie).toContain("Max-Age=0");
		expect(localCookie).not.toContain("Secure");
	});
});
