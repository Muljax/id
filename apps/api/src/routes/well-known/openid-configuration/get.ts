import { Hono } from "hono";

const route = new Hono<{ Bindings: Env }>();

route.get("/", (c) => {
	const issuer = c.env.OIDC_ISSUER;

	return c.json({
		issuer,

		authorization_endpoint: `${issuer}/oauth/authorize`,
		token_endpoint: `${issuer}/oauth/token`,
		userinfo_endpoint: `${issuer}/oauth/userinfo`,
		jwks_uri: `${issuer}/.well-known/jwks.json`,

		response_types_supported: ["code"],

		grant_types_supported: ["authorization_code", "refresh_token"],

		subject_types_supported: ["public"],

		id_token_signing_alg_values_supported: ["ES256"],

		acr_values_supported: ["urn:Muljax-id:password", "urn:Muljax-id:passkey"],

		scopes_supported: ["openid", "profile", "email"],

		claims_supported: [
			"iss",
			"sub",
			"aud",
			"exp",
			"iat",
			"auth_time",
			"nonce",
			"acr",
			"name",
			"given_name",
			"family_name",
			"middle_name",
			"nickname",
			"preferred_username",
			"profile",
			"picture",
			"website",
			"gender",
			"birthdate",
			"zoneinfo",
			"locale",
			"updated_at",
			"email",
			"email_verified",
		],

		token_endpoint_auth_methods_supported: [
			"client_secret_basic",
			"client_secret_post",
			"none",
		],

		code_challenge_methods_supported: ["S256"],

		request_parameter_supported: true,

		claims_parameter_supported: true,

		request_object_signing_alg_values_supported: ["none"],
	});
});

export default route;
