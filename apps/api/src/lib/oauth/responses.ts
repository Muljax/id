import type { Context } from "hono";

export function invalidRequest(c: Context, description?: string) {
	return c.json(
		{
			error: "invalid_request",
			...(description ? { error_description: description } : {}),
		},
		400,
	);
}

export function invalidClient(c: Context) {
	return c.json(
		{
			error: "invalid_client",
		},
		401,
	);
}

export function invalidGrant(c: Context) {
	return c.json(
		{
			error: "invalid_grant",
		},
		400,
	);
}

export function unsupportedGrantType(c: Context) {
	return c.json(
		{
			error: "unsupported_grant_type",
		},
		400,
	);
}

export function invalidScope(c: Context, description?: string) {
	return c.json(
		{
			error: "invalid_scope",
			...(description ? { error_description: description } : {}),
		},
		400,
	);
}

export function unauthorizedClient(c: Context, description?: string) {
	return c.json(
		{
			error: "unauthorized_client",
			...(description ? { error_description: description } : {}),
		},
		400,
	);
}
