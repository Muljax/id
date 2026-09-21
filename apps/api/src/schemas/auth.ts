import { z } from "@hono/zod-openapi";

export const AuthUserSchema = z
	.object({
		id: z.string().openapi({ example: "f47ac10b-58cc-4372-a567-0e02b2c3d479" }),
		email: z.string().email().openapi({ example: "alice@example.com" }),
		displayName: z.string().nullable().openapi({ example: "Alice Smith" }),
		givenName: z.string().nullable().openapi({ example: "Alice" }),
		familyName: z.string().nullable().openapi({ example: "Smith" }),
		middleName: z.string().nullable().openapi({ example: null }),
		nickname: z.string().nullable().openapi({ example: "ali" }),
		preferredUsername: z.string().nullable().openapi({ example: "alice" }),
		profileUrl: z.string().nullable().openapi({ example: null }),
		profileImageKey: z
			.string()
			.nullable()
			.openapi({ example: "profiles/f47ac10b.../avatar/uuid" }),
		website: z.string().nullable().openapi({ example: "https://alice.dev" }),
		gender: z.string().nullable().openapi({ example: null }),
		birthdate: z.string().nullable().openapi({ example: null }),
		zoneinfo: z.string().nullable().openapi({ example: "America/Chicago" }),
		locale: z.string().nullable().openapi({ example: "en-US" }),
		emailVerifiedAt: z.number().nullable().openapi({ example: 1773767800000 }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		roles: z.array(z.string()).openapi({ example: ["admin"] }),
		permissions: z.array(z.string()).openapi({ example: ["*"] }),
	})
	.openapi("AuthUser");

export const AuthUserResponseSchema = z
	.object({
		user: AuthUserSchema,
	})
	.openapi("AuthUserResponse");

export const AuthSettingsResponseSchema = z
	.object({
		signupMode: z
			.enum(["enabled", "invite", "disabled"])
			.openapi({ example: "enabled" }),
		signinMode: z
			.enum(["enabled", "admin_key", "disabled"])
			.openapi({ example: "enabled" }),
	})
	.openapi("AuthSettingsResponse");

export const LoginRequestSchema = z
	.object({
		email: z.string().email().openapi({
			example: "alice@example.com",
			description: "User's registered email address",
		}),
		password: z.string().min(1).max(128).openapi({
			example: "P@ssw0rd123!",
			description: "Plaintext account password",
		}),
		adminKey: z.string().optional().openapi({
			example: "sec_key_...",
			description: "Pre-shared administrator access key if required",
		}),
		rememberMe: z.boolean().optional().openapi({
			example: true,
			description: "Whether to extend session duration to 30 days",
		}),
		prompt: z.string().optional().openapi({
			example: "login",
			description: "Pass 'login' to force re-authentication",
		}),
	})
	.openapi("LoginRequest");

export const RegisterRequestSchema = z
	.object({
		email: z.string().email().openapi({ example: "newuser@example.com" }),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters long.")
			.max(128)
			.openapi({ example: "SuperSecret987!" }),
		inviteToken: z.string().optional().openapi({
			example: "inv_...",
			description: "Required when instance signupMode is 'invite'",
		}),
	})
	.openapi("RegisterRequest");

export const PasswordResetRequestSchema = z
	.object({
		email: z.string().email().openapi({ example: "alice@example.com" }),
	})
	.openapi("PasswordResetRequest");

export const PasswordResetVerifyQuerySchema = z.object({
	token: z
		.string()
		.min(1)
		.openapi({
			param: {
				name: "token",
				in: "query",
			},
			example: "rst_tok_1234567890",
			description: "Password reset token",
		}),
});

export const PasswordResetVerifyResponseSchema = z
	.object({
		valid: z.boolean().openapi({ example: true }),
		email: z.string().optional().openapi({ example: "alice@example.com" }),
		expiresAt: z.number().optional().openapi({ example: 1773771400000 }),
		error: z
			.string()
			.optional()
			.openapi({ example: "Invalid or expired password reset token" }),
	})
	.openapi("PasswordResetVerifyResponse");

export const PasswordResetConfirmRequestSchema = z
	.object({
		token: z.string().min(1).openapi({ example: "rst_tok_1234567890" }),
		newPassword: z
			.string()
			.min(8, "Password must be between 8 and 128 characters")
			.max(128, "Password must be between 8 and 128 characters")
			.openapi({ example: "NewSecurePassword456!" }),
	})
	.openapi("PasswordResetConfirmRequest");

export const SessionItemSchema = z
	.object({
		id: z.string().openapi({ example: "sess_uuid_1234" }),
		ipAddress: z.string().nullable().openapi({ example: "198.51.100.42" }),
		country: z.string().nullable().openapi({ example: "US" }),
		city: z.string().nullable().openapi({ example: "Chicago" }),
		region: z.string().nullable().openapi({ example: "IL" }),
		latitude: z.number().nullable().openapi({ example: 41.8781 }),
		longitude: z.number().nullable().openapi({ example: -87.6298 }),
		browser: z.string().nullable().openapi({ example: "Chrome 124" }),
		os: z.string().nullable().openapi({ example: "macOS 14.4" }),
		expiresAt: z.number().openapi({ example: 1773854200000 }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		current: z.boolean().openapi({ example: true }),
	})
	.openapi("SessionItem");

export const SessionsResponseSchema = z
	.object({
		sessions: z.array(SessionItemSchema),
	})
	.openapi("SessionsResponse");

export const ElevateOptionsResponseSchema = z
	.object({
		challengeId: z.string().openapi({
			example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
		}),
		challenge: z.string().openapi({ example: "dGVzdC1jaGFsbGVuZ2U" }),
		rpId: z.string().optional().openapi({ example: "id.example.com" }),
		timeout: z.number().optional().openapi({ example: 60000 }),
		userVerification: z.string().optional().openapi({ example: "preferred" }),
		allowCredentials: z
			.array(
				z.object({
					id: z.string(),
					type: z.string().optional(),
					transports: z.array(z.string()).optional(),
				}),
			)
			.optional(),
		hasPasskeys: z.boolean().openapi({ example: true }),
		hasPassword: z.boolean().openapi({ example: true }),
	})
	.openapi("ElevateOptionsResponse");

export const ElevateRequestSchema = z
	.object({
		type: z
			.enum(["passkey", "password"])
			.optional()
			.openapi({ example: "passkey" }),
		challengeId: z.string().optional().openapi({
			example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
		}),
		response: z.record(z.string(), z.unknown()).optional().openapi({
			description: "WebAuthn authentication assertion response",
		}),
		password: z.string().optional().openapi({ example: "MyPassword123!" }),
	})
	.openapi("ElevateRequest");

export const ElevateResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
		elevatedUntil: z.number().openapi({ example: 1773768100000 }),
	})
	.openapi("ElevateResponse");

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;
export type AuthResponse = AuthUserResponse;
export type PublicAuthSettings = z.infer<typeof AuthSettingsResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type SessionItem = z.infer<typeof SessionItemSchema>;
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;
export type ElevateOptionsResponse = z.infer<
	typeof ElevateOptionsResponseSchema
>;
export type ElevateRequest = z.infer<typeof ElevateRequestSchema>;
export type ElevateResponse = z.infer<typeof ElevateResponseSchema>;
