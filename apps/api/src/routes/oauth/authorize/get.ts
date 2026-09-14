import { Hono } from "hono";

import { handleAuthorizationRequest } from "./common";

const route = new Hono<{ Bindings: Env }>();

route.get("/", async (c) => {
	const rawParams = {
		client_id: c.req.query("client_id"),
		redirect_uri: c.req.query("redirect_uri"),
		response_type: c.req.query("response_type"),
		scope: c.req.query("scope"),
		state: c.req.query("state"),
		nonce: c.req.query("nonce"),
		prompt: c.req.query("prompt"),
		max_age: c.req.query("max_age"),
		acr_values: c.req.query("acr_values"),
		claims: c.req.query("claims"),
		code_challenge: c.req.query("code_challenge"),
		code_challenge_method: c.req.query("code_challenge_method"),
		request: c.req.query("request"),
	};

	return handleAuthorizationRequest(c, rawParams);
});

export default route;
