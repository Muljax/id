import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { sshCertificates } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAuth } from "@/middleware/auth";
import { ErrorResponseSchema, IdParamSchema } from "@/schemas/common";
import { RevokeCertificateRequestSchema } from "@/schemas/ssh";

const RevokedCertResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
		certificate: z.object({
			id: z.string().openapi({ example: "cert_uuid_1234" }),
			serial: z.string().openapi({ example: "1004" }),
			revokedAt: z.number().openapi({ example: 1773767800000 }),
			revokedReason: z.string().openapi({ example: "Revoked by user" }),
		}),
	})
	.openapi("RevokedCertResponse");

export const revokeSshCertificateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "Revoke issued SSH certificate",
	description:
		"Mark an issued certificate as revoked by serial and certificate ID. Propagates immediately to the KRL endpoint.",
	request: {
		params: IdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: RevokeCertificateRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: RevokedCertResponseSchema,
				},
			},
			description: "Certificate revoked",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Certificate already revoked",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Forbidden",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Certificate not found",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requireAuth);

route.openapi(revokeSshCertificateRoute, async (c) => {
	const { id: certId } = c.req.valid("param");
	const body = c.req.valid("json");

	const db = createDb(c.env.DB);
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();

	const [existing] = await db
		.select()
		.from(sshCertificates)
		.where(eq(sshCertificates.id, certId))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Certificate not found." }, 404);
	}

	if (existing.revokedAt) {
		return c.json(
			{
				error: "Certificate is already revoked.",
			},
			400,
		);
	}

	const canRevokeAny =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
		hasPermission(permissions, "ssh:cert:revoke") ||
		hasPermission(permissions, "ssh:*") ||
		hasPermission(permissions, "*");

	const isOwner = existing.userId === user.id;
	const canSelfRevoke =
		isOwner &&
		(hasPermission(permissions, "ssh:cert:issue") ||
			hasPermission(permissions, "ssh:keys:manage") ||
			canRevokeAny);

	if (!canRevokeAny && !canSelfRevoke) {
		return c.json(
			{
				error: "Insufficient permissions to revoke this certificate.",
			},
			403,
		);
	}

	const defaultReason = isOwner
		? "Revoked by user"
		: "Revoked by administrator";
	const reason = body?.reason?.trim() || defaultReason;
	const now = Date.now();

	await db
		.update(sshCertificates)
		.set({
			revokedAt: now,
			revokedBy: user.id,
			revokedReason: reason,
		})
		.where(eq(sshCertificates.id, certId));

	const notificationMessage = isOwner
		? `You revoked your SSH certificate (serial: ${existing.serial}).`
		: `Your SSH certificate (serial: ${existing.serial}) was revoked by an administrator: "${reason}".`;

	await emitNotification(db, {
		userId: existing.userId,
		type: "ssh.certificate_revoked",
		category: "security",
		severity: isOwner ? "info" : "warning",
		title: "SSH Certificate Revoked",
		message: notificationMessage,
		actionUrl: "/account/ssh",
	});

	return c.json(
		{
			success: true,
			certificate: {
				id: existing.id,
				serial: existing.serial,
				revokedAt: now,
				revokedReason: reason,
			},
		},
		200,
	);
});

export default route;
