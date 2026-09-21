import { z } from "@hono/zod-openapi";

export const UpdateProfileRequestSchema = z
	.object({
		displayName: z
			.string()
			.max(100)
			.nullable()
			.optional()
			.openapi({ example: "Alice Smith" }),
		givenName: z
			.string()
			.max(100)
			.nullable()
			.optional()
			.openapi({ example: "Alice" }),
		familyName: z
			.string()
			.max(100)
			.nullable()
			.optional()
			.openapi({ example: "Smith" }),
		middleName: z
			.string()
			.max(100)
			.nullable()
			.optional()
			.openapi({ example: "Marie" }),
		nickname: z
			.string()
			.max(100)
			.nullable()
			.optional()
			.openapi({ example: "ali" }),
		preferredUsername: z
			.string()
			.max(100)
			.nullable()
			.optional()
			.openapi({ example: "alice" }),
		profileUrl: z
			.string()
			.max(2048)
			.nullable()
			.optional()
			.openapi({ example: "https://alice.dev" }),
		website: z
			.string()
			.max(2048)
			.nullable()
			.optional()
			.openapi({ example: "https://alice.dev" }),
		gender: z
			.string()
			.max(50)
			.nullable()
			.optional()
			.openapi({ example: "female" }),
		birthdate: z
			.string()
			.max(50)
			.nullable()
			.optional()
			.openapi({ example: "1990-01-01" }),
		zoneinfo: z
			.string()
			.max(100)
			.nullable()
			.optional()
			.openapi({ example: "America/Chicago" }),
		locale: z
			.string()
			.max(20)
			.nullable()
			.optional()
			.openapi({ example: "en-US" }),
	})
	.openapi("UpdateProfileRequest");

export const ChangePasswordRequestSchema = z
	.object({
		currentPassword: z
			.string()
			.min(1)
			.max(128)
			.openapi({ example: "OldPassword123!" }),
		newPassword: z
			.string()
			.min(8, "New password must be between 8 and 128 characters")
			.max(128, "New password must be between 8 and 128 characters")
			.openapi({ example: "NewPassword456!" }),
	})
	.openapi("ChangePasswordRequest");

export const OAuthGrantItemSchema = z
	.object({
		clientId: z.string().openapi({ example: "client_uuid_1234" }),
		clientName: z.string().openapi({ example: "CLI Tool" }),
		scopes: z
			.array(z.string())
			.openapi({ example: ["openid", "profile", "email"] }),
		grantedAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("OAuthGrantItem");

export const OAuthGrantsResponseSchema = z
	.object({
		grants: z.array(OAuthGrantItemSchema),
	})
	.openapi("OAuthGrantsResponse");

export const ClientIdParamSchema = z.object({
	clientId: z.string().openapi({
		param: {
			name: "clientId",
			in: "path",
		},
		example: "client_uuid_1234",
		description: "OAuth client ID",
	}),
});

export const DeleteAccountRequestSchema = z
	.object({
		password: z.string().optional().openapi({
			example: "CurrentPassword123!",
			description:
				"Password confirmation (required if account has password set)",
		}),
	})
	.openapi("DeleteAccountRequest");

export type UpdateProfileInput = z.infer<typeof UpdateProfileRequestSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordRequestSchema>;
export type OAuthGrant = z.infer<typeof OAuthGrantItemSchema>;
export type OAuthGrantsResponse = z.infer<typeof OAuthGrantsResponseSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountRequestSchema>;
