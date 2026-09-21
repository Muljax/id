import { z } from "@hono/zod-openapi";

// --- Well-Known / Discovery ---
export const JwksResponseSchema = z
	.object({
		keys: z.array(z.record(z.string(), z.any())).openapi({
			example: [
				{
					kty: "EC",
					crv: "P-256",
					x: "f83OJ3D2xFmT48mr3E_LDeq2m6Pgnu...",
					y: "x_da7Wjx3XCziU9GSGPbL23soeNU83...",
					use: "sig",
					alg: "ES256",
				},
			],
		}),
	})
	.openapi("JwksResponse");

export const OpenIdConfigurationResponseSchema = z
	.object({
		issuer: z.string().openapi({ example: "https://auth.example.com" }),
		authorization_endpoint: z.string().openapi({
			example: "https://auth.example.com/oauth/authorize",
		}),
		token_endpoint: z.string().openapi({
			example: "https://auth.example.com/oauth/token",
		}),
		userinfo_endpoint: z.string().openapi({
			example: "https://auth.example.com/oauth/userinfo",
		}),
		revocation_endpoint: z.string().openapi({
			example: "https://auth.example.com/oauth/revoke",
		}),
		introspection_endpoint: z.string().openapi({
			example: "https://auth.example.com/oauth/introspect",
		}),
		device_authorization_endpoint: z.string().optional().openapi({
			example: "https://auth.example.com/oauth/device/code",
		}),
		jwks_uri: z.string().openapi({
			example: "https://auth.example.com/.well-known/jwks.json",
		}),
		response_types_supported: z
			.array(z.string())
			.openapi({ example: ["code"] }),
		grant_types_supported: z.array(z.string()).openapi({
			example: [
				"authorization_code",
				"refresh_token",
				"client_credentials",
				"urn:ietf:params:oauth:grant-type:device_code",
			],
		}),
		subject_types_supported: z
			.array(z.string())
			.openapi({ example: ["public"] }),
		id_token_signing_alg_values_supported: z.array(z.string()).openapi({
			example: ["ES256"],
		}),
		acr_values_supported: z.array(z.string()).openapi({
			example: ["urn:Muljax-id:password", "urn:Muljax-id:passkey"],
		}),
		scopes_supported: z.array(z.string()).openapi({
			example: ["openid", "profile", "email"],
		}),
		claims_supported: z.array(z.string()).openapi({
			example: ["iss", "sub", "aud", "exp", "iat", "email", "name"],
		}),
		token_endpoint_auth_methods_supported: z.array(z.string()).openapi({
			example: ["client_secret_basic", "client_secret_post", "none"],
		}),
		revocation_endpoint_auth_methods_supported: z.array(z.string()).openapi({
			example: ["client_secret_basic", "client_secret_post", "none"],
		}),
		introspection_endpoint_auth_methods_supported: z.array(z.string()).openapi({
			example: ["client_secret_basic", "client_secret_post", "none"],
		}),
		code_challenge_methods_supported: z.array(z.string()).openapi({
			example: ["S256"],
		}),
		request_parameter_supported: z.boolean().openapi({ example: true }),
		claims_parameter_supported: z.boolean().openapi({ example: true }),
		request_object_signing_alg_values_supported: z.array(z.string()).openapi({
			example: ["none"],
		}),
	})
	.openapi("OpenIdConfigurationResponse");

// --- OAuth Authorization & Approval ---
export const OAuthApproveRequestSchema = z
	.object({
		client_id: z.string().min(1).openapi({ example: "client_123456" }),
		redirect_uri: z.string().url().openapi({
			example: "https://my-app.example.com/callback",
		}),
		response_type: z.string().min(1).openapi({ example: "code" }),
		scope: z.string().min(1).openapi({ example: "openid profile email" }),
		state: z.string().optional().openapi({ example: "xyz123State" }),
		nonce: z.string().optional().openapi({ example: "nonceValue987" }),
		code_challenge: z
			.string()
			.optional()
			.openapi({ example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM" }),
		code_challenge_method: z.string().optional().openapi({ example: "S256" }),
		acr_values: z
			.string()
			.optional()
			.openapi({ example: "urn:Muljax-id:password" }),
		claims: z
			.string()
			.optional()
			.openapi({ example: '{"userinfo":{"name":null}}' }),
	})
	.openapi("OAuthApproveRequest");

export const OAuthApproveResponseSchema = z
	.object({
		redirect_uri: z.string().openapi({
			example:
				"https://my-app.example.com/callback?code=splat123&state=xyz123State",
		}),
	})
	.openapi("OAuthApproveResponse");

// --- OAuth Clients ---
export const OAuthClientItemSchema = z
	.object({
		id: z.string().openapi({ example: "client_123456" }),
		name: z.string().openapi({ example: "My Internal Web App" }),
		clientType: z.string().openapi({ example: "confidential" }),
		redirectUris: z.array(z.string()).openapi({
			example: ["https://app.example.com/oauth/callback"],
		}),
		scopes: z.array(z.string()).openapi({
			example: ["openid", "profile", "email"],
		}),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		updatedAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("OAuthClientItem");

export const OAuthClientsListResponseSchema = z
	.object({
		clients: z.array(OAuthClientItemSchema),
	})
	.openapi("OAuthClientsListResponse");

export const CreateOAuthClientRequestSchema = z
	.object({
		name: z.string().min(1).openapi({ example: "My Native App" }),
		clientType: z
			.enum(["public", "confidential"])
			.openapi({ example: "public" }),
		redirectUris: z.array(z.string()).openapi({
			example: [
				"https://app.example.com/callback",
				"http://127.0.0.1:8080/callback",
			],
		}),
		scopes: z
			.array(z.string())
			.min(1)
			.openapi({
				example: ["openid", "profile", "email"],
			}),
	})
	.openapi("CreateOAuthClientRequest");

export const CreateOAuthClientResponseSchema = z
	.object({
		client_id: z.string().openapi({ example: "client_123456" }),
		client_secret: z.string().optional().openapi({ example: "sec_987654321" }),
		name: z.string().openapi({ example: "My Native App" }),
		client_type: z.string().openapi({ example: "public" }),
		redirect_uris: z.array(z.string()).openapi({
			example: ["https://app.example.com/callback"],
		}),
		scopes: z.array(z.string()).openapi({
			example: ["openid", "profile", "email"],
		}),
	})
	.openapi("CreateOAuthClientResponse");

export const UpdateOAuthClientRequestSchema = z
	.object({
		name: z.string().min(1).openapi({ example: "Updated App Name" }),
		redirectUris: z.array(z.string()).openapi({
			example: ["https://app.example.com/callback"],
		}),
		scopes: z
			.array(z.string())
			.min(1)
			.openapi({
				example: ["openid", "profile", "email"],
			}),
	})
	.openapi("UpdateOAuthClientRequest");

export const UpdateOAuthClientResponseSchema = z
	.object({
		client_id: z.string().openapi({ example: "client_123456" }),
		name: z.string().openapi({ example: "Updated App Name" }),
		client_type: z.string().openapi({ example: "confidential" }),
		redirect_uris: z.array(z.string()).openapi({
			example: ["https://app.example.com/callback"],
		}),
		scopes: z.array(z.string()).openapi({
			example: ["openid", "profile", "email"],
		}),
		created_at: z.number().openapi({ example: 1773767800000 }),
		updated_at: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("UpdateOAuthClientResponse");

// --- OAuth Details & Grant ---
export const OAuthDetailsResponseSchema = z
	.object({
		client_id: z.string().openapi({ example: "client_123456" }),
		name: z.string().openapi({ example: "My Web App" }),
		redirect_uri_valid: z.boolean().openapi({ example: true }),
	})
	.openapi("OAuthDetailsResponse");

export const OAuthGrantResponseSchema = z
	.object({
		granted: z.boolean().openapi({ example: true }),
		auth_time: z.number().openapi({ example: 1773767800 }),
	})
	.openapi("OAuthGrantResponse");

// --- OAuth Introspection ---
export const OAuthIntrospectResponseSchema = z
	.object({
		active: z.boolean().openapi({ example: true }),
		client_id: z.string().optional().openapi({ example: "client_123456" }),
		username: z.string().optional().openapi({ example: "user_uuid_123" }),
		sub: z.string().optional().openapi({ example: "user_uuid_123" }),
		scope: z.string().optional().openapi({ example: "openid profile email" }),
		token_type: z.string().optional().openapi({ example: "Bearer" }),
		exp: z.number().optional().openapi({ example: 1773854200 }),
		iat: z.number().optional().openapi({ example: 1773767800 }),
	})
	.openapi("OAuthIntrospectResponse");

// --- OAuth Token ---
export const OAuthTokenResponseSchema = z
	.object({
		access_token: z.string().optional().openapi({ example: "at_1234567890" }),
		token_type: z.string().optional().openapi({ example: "Bearer" }),
		expires_in: z.number().optional().openapi({ example: 3600 }),
		refresh_token: z.string().optional().openapi({ example: "rt_1234567890" }),
		id_token: z
			.string()
			.optional()
			.openapi({ example: "eyJhbGciOiJFUzI1Ni..." }),
		scope: z.string().optional().openapi({ example: "openid profile email" }),
	})
	.openapi("OAuthTokenResponse");

export const OAuthUserInfoResponseSchema = z
	.record(z.string(), z.any())
	.openapi("OAuthUserInfoResponse");

// --- OAuth Device Authorization (RFC 8628) ---
export const OAuthDeviceCodeRequestSchema = z
	.object({
		client_id: z.string().min(1).openapi({ example: "client_123456" }),
		scope: z.string().optional().openapi({ example: "openid profile email" }),
	})
	.openapi("OAuthDeviceCodeRequest");

export const OAuthDeviceCodeResponseSchema = z
	.object({
		device_code: z.string().openapi({
			example: "gm4d8g92hj3k4l5m6n7p8q9r0s1t2u3v4w5x6y7z",
		}),
		user_code: z.string().openapi({ example: "WDJB-4921" }),
		verification_uri: z.string().openapi({
			example: "https://auth.example.com/device",
		}),
		verification_uri_complete: z.string().openapi({
			example: "https://auth.example.com/device?user_code=WDJB-4921",
		}),
		expires_in: z.number().openapi({ example: 600 }),
		interval: z.number().openapi({ example: 5 }),
	})
	.openapi("OAuthDeviceCodeResponse");

export const OAuthDeviceDetailsResponseSchema = z
	.object({
		client_id: z.string().openapi({ example: "client_123456" }),
		client_name: z.string().openapi({ example: "Muljax CLI" }),
		scopes: z
			.array(z.string())
			.openapi({ example: ["openid", "profile", "email"] }),
		status: z
			.enum(["pending", "approved", "denied"])
			.openapi({ example: "pending" }),
		expires_at: z.number().openapi({ example: 1773767800000 }),
		expired: z.boolean().openapi({ example: false }),
	})
	.openapi("OAuthDeviceDetailsResponse");

export const OAuthDeviceApproveRequestSchema = z
	.object({
		user_code: z.string().min(1).openapi({ example: "WDJB-4921" }),
	})
	.openapi("OAuthDeviceApproveRequest");

export const OAuthDeviceApproveResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
		status: z.enum(["approved", "denied"]).openapi({ example: "approved" }),
	})
	.openapi("OAuthDeviceApproveResponse");

export type OAuthClient = z.infer<typeof OAuthClientItemSchema>;
export type OAuthClientsResponse = z.infer<
	typeof OAuthClientsListResponseSchema
>;
export type CreateOAuthClientRequest = z.infer<
	typeof CreateOAuthClientRequestSchema
>;
export type CreateOAuthClientResponse = z.infer<
	typeof CreateOAuthClientResponseSchema
>;
export type UpdateOAuthClientRequest = z.infer<
	typeof UpdateOAuthClientRequestSchema
>;
export type UpdateOAuthClientResponse = z.infer<
	typeof UpdateOAuthClientResponseSchema
>;
export type OAuthDetailsResponse = z.infer<typeof OAuthDetailsResponseSchema>;
export type OAuthGrantResponse = z.infer<typeof OAuthGrantResponseSchema>;
export type OAuthIntrospectResponse = z.infer<
	typeof OAuthIntrospectResponseSchema
>;
export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;
export type OAuthDeviceCodeRequest = z.infer<
	typeof OAuthDeviceCodeRequestSchema
>;
export type OAuthDeviceCodeResponse = z.infer<
	typeof OAuthDeviceCodeResponseSchema
>;
export type OAuthDeviceDetailsResponse = z.infer<
	typeof OAuthDeviceDetailsResponseSchema
>;
export type OAuthDeviceApproveRequest = z.infer<
	typeof OAuthDeviceApproveRequestSchema
>;
export type OAuthDeviceApproveResponse = z.infer<
	typeof OAuthDeviceApproveResponseSchema
>;
