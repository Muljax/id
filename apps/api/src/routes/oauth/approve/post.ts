import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import {
	createAuthorizationCode,
	validateAuthorizationRequest,
} from "@/lib/oauth/authorization";
import { isUserAdmin } from "@/lib/rbac/permissions";
import { getSessionUserWithSession } from "@/lib/session";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { isUserDisabled } from "@/lib/user";
import { ErrorResponseSchema } from "@/schemas/common";
import {
	OAuthApproveRequestSchema,
	OAuthApproveResponseSchema,
} from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const oauthApproveRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["OAuth"],
	summary: "Approve OAuth authorization request",
	description:
		"Generates an authorization code for an approved user authorization prompt.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: OAuthApproveRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OAuthApproveResponseSchema,
				},
			},
			description: "Approved redirect URL with authorization code",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid authorization request parameters",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Login required",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Access denied or maintenance mode active",
		},
		503: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Sign-in temporarily disabled",
		},
	},
});

route.openapi(oauthApproveRoute, async (c) => {
	const body = c.req.valid("json");

	const db = createDb(c.env.DB);
	const settings = await getOrCreateInstanceSettings(db);

	if (settings.signinMode === "disabled") {
		return c.json(
			{
				error: "temporarily_unavailable",
				error_description:
					"Authentication and OAuth authorizations are currently disabled on this instance.",
			},
			503,
		);
	}

	const validation = await validateAuthorizationRequest(db, body);

	if ("error" in validation) {
		return c.json(
			{
				error: validation.error || "invalid_request",
				...(validation.error_description
					? { error_description: validation.error_description }
					: {}),
			},
			400,
		);
	}

	const { client, scopes } = validation;

	const sessionToken = getCookie(c, "session");

	if (!sessionToken) {
		return c.json(
			{
				error: "login_required",
			},
			401,
		);
	}

	const sessionRecord = await getSessionUserWithSession(db, sessionToken);

	if (!sessionRecord || isUserDisabled(sessionRecord.user)) {
		return c.json(
			{
				error: "login_required",
			},
			401,
		);
	}

	const { user, session } = sessionRecord;

	if (settings.signinMode === "admin_key") {
		const isAdmin = await isUserAdmin(db, user.id);
		if (!isAdmin) {
			return c.json(
				{
					error: "access_denied",
					error_description:
						"Maintenance mode active: Approving OAuth authorizations requires administrator privileges.",
				},
				403,
			);
		}
	}

	const code = await createAuthorizationCode(
		db,
		body,
		client.id,
		scopes,
		user.id,
		Math.floor(session.createdAt / 1000),
	);

	const location = new URL(body.redirect_uri);

	location.searchParams.set("code", code);

	if (body.state !== undefined) {
		location.searchParams.set("state", body.state);
	}

	return c.json(
		{
			redirect_uri: location.toString(),
		},
		200,
	);
});

export default route;
