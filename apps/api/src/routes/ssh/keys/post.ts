import { and, eq } from "drizzle-orm";
import { createRoute } from "@hono/zod-openapi";

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
import { ErrorResponseSchema } from "@/schemas/common";
import {
	RegisterSshKeyRequestSchema,
	RegisterSshKeyResponseSchema,
} from "@/schemas/ssh";

export const registerSshKeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "Register new SSH public key",
	description:
		"Upload and register an Ed25519 public key. Automatically parses format and computes SHA256 fingerprint.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: RegisterSshKeyRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: RegisterSshKeyResponseSchema,
				},
			},
			description: "SSH key successfully registered",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid key format or missing attributes",
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
			description: "Forbidden - cannot register for another user",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Key fingerprint already registered",
		},
	},
});

import getRoute from "./get";

const route = getRoute;

route.openapi(registerSshKeyRoute, async (c) => {
	const body = c.req.valid("json");
	const keyName = body.name.trim();

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
					error:
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
				userId: newKey.userId,
				name: newKey.name,
				publicKey: newKey.publicKey,
				fingerprint: newKey.fingerprint,
				createdAt: newKey.createdAt,
				lastUsedAt: newKey.lastUsedAt,
			},
		},
		201,
	);
});

export default route;
