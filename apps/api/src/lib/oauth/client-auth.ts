import type { Context } from "hono";

import type { Database } from "../../db";
import { getOAuthClient, verifyClientSecret } from "./client";
import { invalidClient, invalidRequest } from "./responses";

export function getBasicClientCredentials(authorization: string | undefined) {
	if (!authorization) {
		return null;
	}

	const spaceIndex = authorization.indexOf(" ");

	if (spaceIndex === -1) {
		return null;
	}

	const scheme = authorization.slice(0, spaceIndex);

	if (scheme.toLowerCase() !== "basic") {
		return null;
	}

	const encoded = authorization.slice(spaceIndex + 1).trim();

	if (!encoded) {
		return null;
	}

	try {
		const decoded = atob(encoded);
		const separator = decoded.indexOf(":");

		if (separator === -1) {
			return null;
		}

		const username = decoded.slice(0, separator);
		const password = decoded.slice(separator + 1);

		return {
			clientId: decodeURIComponent(username.replaceAll("+", " ")),
			clientSecret: decodeURIComponent(password.replaceAll("+", " ")),
		};
	} catch {
		return null;
	}
}

/**
 * Authenticates an OAuth client using either HTTP Basic Authentication
 * or client credentials passed in the request body.
 *
 * @param c The Hono request context.
 * @param body The parsed request body containing optional client_id / client_secret.
 * @param db The database connection.
 * @returns The authenticated client or an error Response.
 */
export async function authenticateClient(
	c: Context,
	body: Record<string, unknown>,
	db: Database,
) {
	const basicCredentials = getBasicClientCredentials(
		c.req.header("Authorization"),
	);

	const clientId =
		basicCredentials?.clientId ??
		(typeof body.client_id === "string" ? body.client_id : undefined);

	const clientSecret =
		basicCredentials?.clientSecret ??
		(typeof body.client_secret === "string" ? body.client_secret : undefined);

	if (typeof clientId !== "string" || !clientId) {
		return { errorResponse: invalidRequest(c, "Missing required client_id.") };
	}

	const client = await getOAuthClient(db, clientId);

	if (!client) {
		return { errorResponse: invalidClient(c) };
	}

	if (client.clientType === "confidential") {
		if (
			typeof clientSecret !== "string" ||
			!(await verifyClientSecret(client, clientSecret))
		) {
			return { errorResponse: invalidClient(c) };
		}
	} else if (basicCredentials) {
		return {
			errorResponse: invalidRequest(
				c,
				"Public clients must not use client authentication.",
			),
		};
	}

	return { client };
}
