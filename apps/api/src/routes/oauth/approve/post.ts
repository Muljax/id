import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { createDb } from "@/db";
import {
	createAuthorizationCode,
	validateAuthorizationRequest,
} from "@/lib/oauth/authorization";
import { getSessionUserWithSession } from "@/lib/session";
import { isUserDisabled } from "@/lib/user";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
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
