import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { OpenIdConfigurationResponseSchema } from "@/schemas/oauth";

const route = new OpenAPIHono<{ Bindings: Env }>();

export const getOpenIdConfigurationRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["OpenID Connect"],
	summary: "OpenID Provider Configuration Information",
	description:
		"Returns OpenID Provider metadata compliant with RFC 8414 and OpenID Connect Discovery 1.0.",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OpenIdConfigurationResponseSchema,
				},
			},
			description: "OpenID configuration metadata",
		},
	},
});

route.openapi(getOpenIdConfigurationRoute, (c) => {
	const issuer = c.env.OIDC_ISSUER;

	return c.json(
		{
			issuer,

			authorization_endpoint: `${issuer}/oauth/authorize`,
			token_endpoint: `${issuer}/oauth/token`,
			userinfo_endpoint: `${issuer}/oauth/userinfo`,
			revocation_endpoint: `${issuer}/oauth/revoke`,
			introspection_endpoint: `${issuer}/oauth/introspect`,
			device_authorization_endpoint: `${issuer}/oauth/device/code`,
			jwks_uri: `${issuer}/.well-known/jwks.json`,

			response_types_supported: ["code"],

			grant_types_supported: [
				"authorization_code",
				"refresh_token",
				"client_credentials",
				"urn:ietf:params:oauth:grant-type:device_code",
			],

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

			revocation_endpoint_auth_methods_supported: [
				"client_secret_basic",
				"client_secret_post",
				"none",
			],

			introspection_endpoint_auth_methods_supported: [
				"client_secret_basic",
				"client_secret_post",
				"none",
			],

			code_challenge_methods_supported: ["S256"],

			request_parameter_supported: true,

			claims_parameter_supported: true,

			request_object_signing_alg_values_supported: ["none"],
		},
		200,
	);
});

export default route;
