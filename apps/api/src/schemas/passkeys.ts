import { z } from "@hono/zod-openapi";

export const PasskeyItemSchema = z
	.object({
		id: z.string().openapi({ example: "pk_uuid_1234" }),
		name: z.string().nullable().openapi({ example: "MacBook TouchID" }),
		aaguid: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "fbfc3007-154e-4e2b-ae43-d8362d8409f4" }),
		backedUp: z.boolean().nullable().optional().openapi({ example: true }),
		deviceType: z
			.string()
			.nullable()
			.optional()
			.openapi({ example: "multiDevice" }),
		transports: z
			.array(z.string())
			.nullable()
			.optional()
			.openapi({ example: ["internal", "hybrid"] }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		lastUsedAt: z.number().nullable().openapi({ example: 1773768100000 }),
	})
	.openapi("PasskeyItem");

export const PasskeysListResponseSchema = z
	.object({
		passkeys: z.array(PasskeyItemSchema),
	})
	.openapi("PasskeysListResponse");

export const RegisterPasskeyVerifyRequestSchema = z
	.object({
		response: z.any().openapi({
			description: "FIDO2 / WebAuthn registration credential response payload",
		}),
		name: z.string().max(100).optional().openapi({ example: "YubiKey 5C NFC" }),
	})
	.openapi("RegisterPasskeyVerifyRequest");

export const LoginPasskeyVerifyRequestSchema = z
	.object({
		challengeId: z.string().openapi({
			example: "chal_uuid_1234",
			description: "Challenge ID returned from authentication options",
		}),
		adminKey: z.string().optional().openapi({
			example: "sec_key_...",
			description: "Required when signinMode is admin_key",
		}),
		response: z.any().openapi({
			description: "FIDO2 / WebAuthn assertion credential response payload",
		}),
	})
	.openapi("LoginPasskeyVerifyRequest");

export const UpdatePasskeyRequestSchema = z
	.object({
		name: z
			.string()
			.min(1, "Passkey name is required.")
			.max(100, "Passkey name must be 100 characters or less.")
			.openapi({ example: "Home Office Key" }),
	})
	.openapi("UpdatePasskeyRequest");

export type PasskeyItem = z.infer<typeof PasskeyItemSchema>;
export type PasskeysResponse = z.infer<typeof PasskeysListResponseSchema>;
export type RegisterPasskeyVerifyRequest = z.infer<
	typeof RegisterPasskeyVerifyRequestSchema
>;
export type LoginPasskeyVerifyRequest = z.infer<
	typeof LoginPasskeyVerifyRequestSchema
>;
export type UpdatePasskeyRequest = z.infer<typeof UpdatePasskeyRequestSchema>;
