import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { createDb } from "@/db";
import { sshCertificates, userSshKeys } from "@/db/schema";
import {
	createSshCaContext,
	getPermittedPrincipals,
	issueUserCertificate,
	SshValidationError,
} from "@/lib/ssh";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.post("/", requirePermission("ssh:cert:issue"), async (c) => {
	const caPrivateKeyJwk = c.env.SSH_CA_PRIVATE_KEY;
	if (!caPrivateKeyJwk) {
		return c.json(
			{
				error: "SSH CA is not configured on this instance.",
			},
			500,
		);
	}

	const body = await c.req
		.json<{
			publicKey?: string;
			keyId?: string;
			savedKeyId?: string;
			principals?: string[];
			ttl?: number;
			comment?: string;
		}>()
		.catch(() => null);

	if (!body) {
		return c.json({ error: "Invalid JSON request body." }, 400);
	}

	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const db = createDb(c.env.DB);

	const isAdmin =
		roles.includes("admin") ||
		hasPermission(permissions, "ssh:keys:admin") ||
		hasPermission(permissions, "ssh:*") ||
		hasPermission(permissions, "*");

	let userPublicKey: string | undefined;

	if (body.savedKeyId) {
		const [savedKey] = await db
			.select()
			.from(userSshKeys)
			.where(eq(userSshKeys.id, body.savedKeyId))
			.limit(1);

		if (!savedKey) {
			return c.json({ error: "Saved SSH key not found." }, 404);
		}

		if (savedKey.userId !== user.id && !isAdmin) {
			return c.json(
				{
					error: "forbidden",
					message:
						"You cannot issue certificates for another user's saved key.",
				},
				403,
			);
		}

		userPublicKey = savedKey.publicKey;

		await db
			.update(userSshKeys)
			.set({ lastUsedAt: Date.now() })
			.where(eq(userSshKeys.id, savedKey.id));
	} else if (body.publicKey) {
		const canManageKeys =
			isAdmin || hasPermission(permissions, "ssh:keys:manage");
		if (!canManageKeys) {
			return c.json(
				{
					error: "forbidden",
					message:
						"Insufficient permissions to supply ad-hoc public keys. You must use an approved saved key.",
				},
				403,
			);
		}
		userPublicKey = body.publicKey.trim();
	}

	if (!userPublicKey) {
		return c.json(
			{
				error: "Either 'publicKey' or 'savedKeyId' must be provided.",
			},
			400,
		);
	}

	const allowedPrincipals = getPermittedPrincipals(user, roles, permissions);

	let requestedPrincipals: string[];
	if (
		body.principals &&
		Array.isArray(body.principals) &&
		body.principals.length > 0
	) {
		const allowedSet = new Set(allowedPrincipals);
		for (const principal of body.principals) {
			if (!allowedSet.has(principal)) {
				return c.json(
					{
						error: `Principal '${principal}' is not permitted for your account.`,
						allowed: allowedPrincipals,
					},
					403,
				);
			}
		}
		requestedPrincipals = body.principals;
	} else {
		requestedPrincipals = allowedPrincipals;
	}

	let keyIdentity = user.email;
	if (body.keyId?.trim() && body.keyId.trim() !== user.email) {
		if (!isAdmin) {
			return c.json(
				{
					error: "forbidden",
					message: "Only administrators can specify a custom key identity.",
				},
				403,
			);
		}
		keyIdentity = body.keyId.trim();
	}

	try {
		const caContext = await createSshCaContext(caPrivateKeyJwk);
		const issued = await issueUserCertificate(caContext, {
			userPublicKey,
			keyId: keyIdentity,
			principals: requestedPrincipals,
			ttlSeconds: body.ttl,
			comment: body.comment,
		});

		const clientIp =
			c.req.header("cf-connecting-ip") ??
			c.req.header("x-forwarded-for") ??
			null;
		const userAgent = c.req.header("user-agent") ?? null;

		await db.insert(sshCertificates).values({
			id: crypto.randomUUID(),
			userId: user.id,
			serial: issued.serial.toString(),
			keyId: issued.keyId,
			principals: JSON.stringify(issued.principals),
			validAfter: issued.validAfter,
			validBefore: issued.validBefore,
			fingerprint: issued.fingerprint,
			caFingerprint: issued.caFingerprint,
			clientIp,
			userAgent,
			createdAt: Date.now(),
		});

		return c.json(
			{
				certificate: issued.certificate,
				serial: issued.serial.toString(),
				keyId: issued.keyId,
				principals: issued.principals,
				validAfter: issued.validAfter,
				validBefore: issued.validBefore,
				fingerprint: issued.fingerprint,
				caFingerprint: issued.caFingerprint,
			},
			201,
		);
	} catch (error) {
		if (error instanceof SshValidationError) {
			return c.json({ error: error.message, code: error.code }, 400);
		}
		const message =
			error instanceof Error ? error.message : "Failed to issue certificate.";
		return c.json({ error: message }, 500);
	}
});

export default route;
