import { eq } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { sshCertificates, userSshKeys } from "@/db/schema";
import {
	createSshCaContext,
	getPermittedPrincipals,
	issueUserCertificate,
	SshValidationError,
} from "@/lib/ssh";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import {
	IssueCertificateRequestSchema,
	IssuedCertificateResponseSchema,
} from "@/schemas/ssh";

export const issueSshCertificateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "Issue signed OpenSSH user certificate",
	description:
		"Issue an RFC 4251 / OpenSSH CERT01 elliptic-curve user certificate for SSH client authentication.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: IssueCertificateRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: IssuedCertificateResponseSchema,
				},
			},
			description: "Certificate successfully signed and issued",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid public key or request parameters",
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
			description: "Forbidden principal or key",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Saved key not found",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "CA not configured on server",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requirePermission("ssh:cert:issue"));

route.openapi(issueSshCertificateRoute, async (c) => {
	const caPrivateKeyJwk = c.env.SSH_CA_PRIVATE_KEY;
	if (!caPrivateKeyJwk) {
		return c.json(
			{
				error: "SSH CA is not configured on this instance.",
			},
			500,
		);
	}

	const body = c.req.valid("json");

	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const db = createDb(c.env.DB);

	const isAdmin =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
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
					error: "You cannot issue certificates for another user's saved key.",
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
					error:
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
		const hasWildcardPrincipalAccess =
			roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
			hasPermission(permissions, "*") ||
			hasPermission(permissions, "ssh:*") ||
			hasPermission(permissions, "ssh:principal:*");

		if (!hasWildcardPrincipalAccess) {
			const allowedSet = new Set(allowedPrincipals);
			for (const principal of body.principals) {
				if (
					!allowedSet.has(principal) &&
					!hasPermission(permissions, `ssh:principal:${principal}`)
				) {
					return c.json(
						{
							error: `Principal '${principal}' is not permitted for your account.`,
						},
						403,
					);
				}
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
					error: "Only administrators can specify a custom key identity.",
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
			return c.json({ error: error.message }, 400);
		}
		const message =
			error instanceof Error ? error.message : "Failed to issue certificate.";
		return c.json({ error: message }, 500);
	}
});

export default route;
