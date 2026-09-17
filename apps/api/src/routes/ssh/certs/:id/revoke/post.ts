import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { sshCertificates } from "@/db/schema";
import { emitNotification } from "@/lib/notifications/emitter";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireAuth } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requireAuth, async (c) => {
	const certId = c.req.param("id");
	if (!certId) {
		return c.json({ error: "Certificate ID is required." }, 400);
	}

	const body = await c.req
		.json<{
			reason?: string;
		}>()
		.catch(() => null);

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
				revokedAt: existing.revokedAt,
				revokedReason: existing.revokedReason,
			},
			400,
		);
	}

	const canRevokeAny =
		roles.includes("admin") ||
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
				error: "forbidden",
				message: "Insufficient permissions to revoke this certificate.",
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

	return c.json({
		success: true,
		certificate: {
			id: existing.id,
			serial: existing.serial,
			revokedAt: now,
			revokedReason: reason,
		},
	});
});

export default route;
