import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import { getDashboardOrigin, isLocalhost } from "@/lib/env";
import {
	createAuthorizationCode,
	validateAuthorizationRequest,
} from "@/lib/oauth/authorization";
import { isUserAdmin } from "@/lib/rbac/permissions";
import { getSessionUserWithSession } from "@/lib/session";
import { getOrCreateInstanceSettings } from "@/lib/settings";
import { isUserDisabled } from "@/lib/user";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const origin = c.req.header("Origin");
	const secFetchSite = c.req.header("Sec-Fetch-Site");
	if (c.env && !isLocalhost(c.env)) {
		if (secFetchSite === "cross-site") {
			return c.json(
				{
					error: "access_denied",
					error_description: "Cross-site request blocked.",
				},
				403,
			);
		}
		if (origin && origin !== getDashboardOrigin(c.env)) {
			return c.json(
				{
					error: "access_denied",
					error_description: "Invalid request origin.",
				},
				403,
			);
		}
	}

	const body = await c.req.json<{
		client_id: string;
		redirect_uri: string;
		response_type: string;
		scope: string;
		state?: string;
		nonce?: string;
		code_challenge?: string;
		code_challenge_method?: string;
		acr_values?: string;
		claims?: string;
	}>();

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
		return c.json(validation, 400);
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

	return c.json({
		redirect_uri: location.toString(),
	});
});

export default route;
