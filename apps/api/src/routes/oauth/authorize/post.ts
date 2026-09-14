import { Hono } from "hono";

import { handleAuthorizationRequest } from "./common";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
	const form = (await c.req.parseBody().catch(() => ({}))) as Record<
		string,
		unknown
	>;

	const getString = (value: unknown) =>
		typeof value === "string" ? value : undefined;

	const rawParams = {
		client_id: getString(form.client_id) ?? c.req.query("client_id"),
		redirect_uri: getString(form.redirect_uri) ?? c.req.query("redirect_uri"),
		response_type:
			getString(form.response_type) ?? c.req.query("response_type"),
		scope: getString(form.scope) ?? c.req.query("scope"),
		state: getString(form.state) ?? c.req.query("state"),
		nonce: getString(form.nonce) ?? c.req.query("nonce"),
		prompt: getString(form.prompt) ?? c.req.query("prompt"),
		max_age: getString(form.max_age) ?? c.req.query("max_age"),
		acr_values: getString(form.acr_values) ?? c.req.query("acr_values"),
		claims: getString(form.claims) ?? c.req.query("claims"),
		code_challenge:
			getString(form.code_challenge) ?? c.req.query("code_challenge"),
		code_challenge_method:
			getString(form.code_challenge_method) ??
			c.req.query("code_challenge_method"),
		request: getString(form.request) ?? c.req.query("request"),
	};

	return handleAuthorizationRequest(c, rawParams);
});

export default route;
