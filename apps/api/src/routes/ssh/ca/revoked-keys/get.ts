import { and, desc, gte, isNotNull } from "drizzle-orm";

import { Hono } from "hono";

import { createDb } from "@/db";

import { sshCertificates } from "@/db/schema";

import { buildKrl, createSshCaContext } from "@/lib/ssh";

import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("ssh:ca:read"), async (c) => {
	const db = createDb(c.env.DB);

	const nowSec = Math.floor(Date.now() / 1000);

	const includeExpired =
		c.req.query("includeExpired") === "true" || c.req.query("all") === "true";

	// OpenSSH automatically rejects expired certificates against the system clock.
	// Pruning expired certs from the active KRL keeps the file compact and prevents
	// unbounded growth.
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

	const format = c.req.query("format");
	const accept = c.req.header("accept");

	if (format === "raw") {
		const lines = [
			"# OpenSSH Revoked Keys",
			...revoked.map((r) => `serial: ${r.serial}`),
		];

		return c.text(`${lines.join("\n")}\n`, 200, {
			"content-type": "text/plain; charset=utf-8",
		});
	}

	const isKrl =
		format === "krl" ||
		format === "binary" ||
		(format === undefined &&
			(accept?.includes("application/octet-stream") ||
				accept?.includes("application/x-openssh-krl")));

	if (isKrl) {
		let caWireKey: Uint8Array | undefined;

		if (c.env.SSH_CA_PRIVATE_KEY && c.req.query("wildcard") !== "true") {
			try {
				const caContext = await createSshCaContext(c.env.SSH_CA_PRIVATE_KEY);

				caWireKey = caContext.publicWire;
			} catch (error) {
				console.warn(
					"Could not derive CA public wire for KRL, falling back to wildcard CA:",
					error,
				);
			}
		}

		const krlBytes = buildKrl({
			caWireKey,
			serials: revoked.map((r) => r.serial),
			comment: "Muljax ID SSH CA Revoked Keys",
		});

		return new Response(krlBytes, {
			status: 200,
			headers: {
				"content-type": "application/octet-stream",
				"content-disposition": 'attachment; filename="revoked-keys.krl"',
			},
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
