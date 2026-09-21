import { desc, eq } from "drizzle-orm";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { sshCertificates } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { SshCertificatesResponseSchema } from "@/schemas/ssh";

const ListSshCertsQuerySchema = z.object({
	userId: z
		.string()
		.optional()
		.openapi({
			param: { name: "userId", in: "query" },
			description: "Filter certificates by target user ID (admin only)",
		}),
	all: z
		.string()
		.optional()
		.openapi({
			param: { name: "all", in: "query" },
			description: "Return all instance certificates up to 100 (admin only)",
		}),
});

export const getSshCertificatesRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "List issued SSH certificates",
	description:
		"Retrieve certificate logs, serial numbers, principals, validity windows, and revocation records.",
	request: {
		query: ListSshCertsQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SshCertificatesResponseSchema,
				},
			},
			description: "List of issued certificates",
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
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use(
	"/*",
	requireSessionOrPermission("ssh:cert:issue", "ssh:cert:list", "ssh:*", "*"),
);

route.openapi(getSshCertificatesRoute, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();

	const canListAll =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
		hasPermission(permissions, "ssh:cert:list") ||
		hasPermission(permissions, "ssh:*") ||
		hasPermission(permissions, "*");

	const { userId: requestedUserId, all } = c.req.valid("query");
	if (requestedUserId && requestedUserId !== user.id && !canListAll) {
		return c.json(
			{
				error: "Insufficient permissions to view another user's certificates.",
			},
			403,
		);
	}

	const showAll = all === "true" && canListAll;
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

	return c.json(
		{
			certificates,
		},
		200,
	);
});

export default route;
