import { and, desc, gte, isNotNull } from "drizzle-orm";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { sshCertificates } from "@/db/schema";
import { buildKrl, createSshCaContext } from "@/lib/ssh";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { RevokedKeysResponseSchema } from "@/schemas/ssh";

const RevokedKeysQuerySchema = z.object({
	includeExpired: z
		.string()
		.optional()
		.openapi({
			param: { name: "includeExpired", in: "query" },
			description: "Include expired revoked certificates (default false)",
		}),
	all: z
		.string()
		.optional()
		.openapi({
			param: { name: "all", in: "query" },
			description: "Alias for includeExpired",
		}),
	format: z
		.enum(["json", "raw", "krl", "binary"])
		.optional()
		.openapi({
			param: { name: "format", in: "query" },
			description:
				"Response format ('krl'/'binary' for binary KRL file, 'raw' for plain text, 'json' for JSON)",
		}),
	wildcard: z
		.string()
		.optional()
		.openapi({
			param: { name: "wildcard", in: "query" },
			description: "Force wildcard CA revocation block in KRL",
		}),
});

export const getRevokedKeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "Download Key Revocation List (KRL)",
	description:
		"Serve binary OpenSSH KRL format (PROTOCOL.krl) for automatic Linux server synchronization or JSON list of revoked serials.",
	request: {
		query: RevokedKeysQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: RevokedKeysResponseSchema,
				},
				"application/octet-stream": {
					schema: z.string().openapi({
						description: "Binary OpenSSH KRL format",
					}),
				},
				"text/plain": {
					schema: z.string().openapi({
						example: "# OpenSSH Revoked Keys\nserial: 1004\n",
					}),
				},
			},
			description: "Revoked keys list or binary KRL file",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requirePermission("ssh:ca:read"));

route.openapi(getRevokedKeysRoute, async (c) => {
	const db = createDb(c.env.DB);
	const nowSec = Math.floor(Date.now() / 1000);

	const queryParams = c.req.valid("query");
	const includeExpired =
		queryParams.includeExpired === "true" || queryParams.all === "true";

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

	const format = queryParams.format;
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

		if (c.env.SSH_CA_PRIVATE_KEY && queryParams.wildcard !== "true") {
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

	return c.json(
		{
			revoked: revoked.map((r) => ({
				serial: r.serial,
				revokedAt: r.revokedAt as number,
			})),
		},
		200,
	);
});

export default route;
