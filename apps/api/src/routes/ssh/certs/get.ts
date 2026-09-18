import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { sshCertificates } from "@/db/schema";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get(
	"/",
	requireSessionOrPermission("ssh:cert:issue", "ssh:cert:list", "ssh:*", "*"),
	async (c) => {
		const user = c.get("user");
		const roles = c.get("roles") ?? [];
		const permissions = c.get("permissions") ?? new Set();

		const canListAll =
			roles.includes("admin") ||
			hasPermission(permissions, "ssh:cert:list") ||
			hasPermission(permissions, "ssh:*") ||
			hasPermission(permissions, "*");

		const requestedUserId = c.req.query("userId");
		if (requestedUserId && requestedUserId !== user.id && !canListAll) {
			return c.json(
				{
					error: "forbidden",
					message:
						"Insufficient permissions to view another user's certificates.",
				},
				403,
			);
		}

		const showAll = c.req.query("all") === "true" && canListAll;
		const targetUserId = requestedUserId || user.id;

		const db = createDb(c.env.DB);

		const query = showAll
			? db
					.select()
					.from(sshCertificates)
					.orderBy(desc(sshCertificates.createdAt))
					.limit(100)
			: db
					.select()
					.from(sshCertificates)
					.where(eq(sshCertificates.userId, targetUserId))
					.orderBy(desc(sshCertificates.createdAt))
					.limit(50);

		const certList = await query;

		const certificates = certList.map((cert) => ({
			id: cert.id,
			userId: cert.userId,
			serial: cert.serial,
			keyId: cert.keyId,
			principals: JSON.parse(cert.principals) as string[],
			validAfter: cert.validAfter,
			validBefore: cert.validBefore,
			fingerprint: cert.fingerprint,
			caFingerprint: cert.caFingerprint,
			clientIp: cert.clientIp,
			userAgent: cert.userAgent,
			revokedAt: cert.revokedAt,
			revokedBy: canListAll ? cert.revokedBy : null,
			revokedReason: cert.revokedReason,
			createdAt: cert.createdAt,
		}));

		return c.json({
			certificates,
		});
	},
);

export default route;
