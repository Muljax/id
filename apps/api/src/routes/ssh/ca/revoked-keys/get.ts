import { and, desc, gte, isNotNull } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { sshCertificates } from "@/db/schema";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("ssh:ca:read"), async (c) => {
	const db = createDb(c.env.DB);
	const nowSec = Math.floor(Date.now() / 1000);
	const includeExpired =
		c.req.query("includeExpired") === "true" || c.req.query("all") === "true";

	// OpenSSH automatically rejects expired certificates against the system clock.
	// Pruning expired certs from active KRL keeps the file compact and prevents unbounded growth.
	const whereCondition = includeExpired
		? isNotNull(sshCertificates.revokedAt)
		: and(
				isNotNull(sshCertificates.revokedAt),
				gte(sshCertificates.validBefore, nowSec),
			);

	const revoked = await db
		.select({
			serial: sshCertificates.serial,
			revokedAt: sshCertificates.revokedAt,
		})
		.from(sshCertificates)
		.where(whereCondition)
		.orderBy(desc(sshCertificates.revokedAt));

	if (c.req.query("format") === "raw") {
		const lines = [
			"# OpenSSH Revoked Keys",
			...revoked.map((r) => `serial: ${r.serial}`),
		];
		return c.text(`${lines.join("\n")}\n`, 200, {
			"content-type": "text/plain; charset=utf-8",
		});
	}

	return c.json({
		revoked: revoked.map((r) => ({
			serial: r.serial,
			revokedAt: r.revokedAt,
		})),
	});
});

export default route;
