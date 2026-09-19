import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { userSshKeys } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import {
	calculateFingerprint,
	formatOpenSshEd25519PublicKey,
	parseOpenSshPublicKey,
	SshValidationError,
} from "@/lib/ssh";
import { type AppEnv, requireAnyPermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post(
	"/",
	requireAnyPermission("ssh:keys:manage", "ssh:keys:admin"),
	async (c) => {
		const body = await c.req
			.json<{
				name?: string;
				publicKey?: string;
				userId?: string;
			}>()
			.catch(() => null);

		if (!body || typeof body.name !== "string" || !body.name.trim()) {
			return c.json({ error: "Key name is required." }, 400);
		}

		if (typeof body.publicKey !== "string" || !body.publicKey.trim()) {
			return c.json({ error: "Public key is required." }, 400);
		}

		const keyName = body.name.trim();
		if (keyName.length > 100) {
			return c.json({ error: "Key name must not exceed 100 characters." }, 400);
		}

		let parsed: ReturnType<typeof parseOpenSshPublicKey>;
		let fingerprint: string;
		try {
			parsed = parseOpenSshPublicKey(body.publicKey.trim());
			fingerprint = await calculateFingerprint(parsed.wireBytes);
		} catch (error) {
			const message =
				error instanceof SshValidationError
					? error.message
					: "Invalid SSH public key.";
			return c.json({ error: message }, 400);
		}

		const db = createDb(c.env.DB);
		const user = c.get("user");
		const roles = c.get("roles") ?? [];
		const permissions = c.get("permissions") ?? new Set();

		const canAdminKeys =
			roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
			hasPermission(permissions, "ssh:keys:admin") ||
			hasPermission(permissions, "ssh:*") ||
			hasPermission(permissions, "*");

		let targetUserId = user.id;
		if (body.userId && body.userId !== user.id) {
			if (!canAdminKeys) {
				return c.json(
					{
						error: "forbidden",
						message:
							"Insufficient permissions to register SSH keys for another user.",
					},
					403,
				);
			}
			targetUserId = body.userId;
		}

		const existing = await db
			.select({ id: userSshKeys.id })
			.from(userSshKeys)
			.where(
				and(
					eq(userSshKeys.userId, targetUserId),
					eq(userSshKeys.fingerprint, fingerprint),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			return c.json(
				{
					error:
						"An SSH key with this fingerprint already exists for this account.",
				},
				409,
			);
		}

		const formattedPublicKey = formatOpenSshEd25519PublicKey(
			parsed.rawKey,
			keyName,
		).trim();

		const newKey = {
			id: crypto.randomUUID(),
			userId: targetUserId,
			name: keyName,
			publicKey: formattedPublicKey,
			fingerprint,
			createdAt: Date.now(),
			lastUsedAt: null,
		};

		await db.insert(userSshKeys).values(newKey);

		return c.json(
			{
				key: {
					id: newKey.id,
					name: newKey.name,
					publicKey: newKey.publicKey,
					fingerprint: newKey.fingerprint,
					createdAt: newKey.createdAt,
					lastUsedAt: newKey.lastUsedAt,
				},
			},
			201,
		);
	},
);

export default route;
