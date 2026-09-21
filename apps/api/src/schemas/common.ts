import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z
	.object({
		error: z.string().openapi({
			example: "Invalid request parameters or unauthorized action",
			description: "Human-readable error message",
		}),
	})
	.openapi("ErrorResponse");

export const SuccessResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
		message: z.string().optional().openapi({
			example: "Operation completed successfully.",
		}),
	})
	.openapi("SuccessResponse");

export const HealthResponseSchema = z
	.object({
		status: z.string().openapi({ example: "ok" }),
		version: z.string().openapi({ example: "1.2.1" }),
		database: z.string().openapi({ example: "connected" }),
	})
	.openapi("HealthResponse");

export const IdParamSchema = z.object({
	id: z.string().openapi({
		param: {
			name: "id",
			in: "path",
		},
		example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
		description: "Unique entity identifier",
	}),
});
