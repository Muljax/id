import { desc, eq } from "drizzle-orm";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createDb } from "@/db";
import { userSshKeys } from "@/db/schema";
import { SYSTEM_ROLE_IDS } from "@/lib/rbac/constants";
import { hasPermission } from "@/lib/rbac/matcher";
import { type AppEnv, requireSessionOrPermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { UserSshKeysResponseSchema } from "@/schemas/ssh";

const ListSshKeysQuerySchema = z.object({
	userId: z
		.string()
		.optional()
		.openapi({
			param: { name: "userId", in: "query" },
			description: "Filter by user ID (admin only for other users)",
		}),
	all: z
		.string()
		.optional()
		.openapi({
			param: { name: "all", in: "query" },
			description: "Return all instance keys up to 100 (admin only)",
		}),
});

export const getSshKeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "List registered SSH public keys",
	description:
		"Retrieve enrolled SSH public keys for the caller or a target user (if administrator).",
	request: {
		query: ListSshKeysQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserSshKeysResponseSchema,
				},
			},
			description: "List of SSH public keys",
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
	requireSessionOrPermission(
		"ssh:keys:manage",
		"ssh:keys:admin",
		"ssh:ca:read",
		"ssh:cert:issue",
		"ssh:*",
		"*",
	),
);

route.openapi(getSshKeysRoute, async (c) => {
	const user = c.get("user");
	const roles = c.get("roles") ?? [];
	const permissions = c.get("permissions") ?? new Set();
	const db = createDb(c.env.DB);

	const canAdminKeys =
		roles.includes(SYSTEM_ROLE_IDS.ADMIN) ||
		hasPermission(permissions, "ssh:keys:admin") ||
		hasPermission(permissions, "ssh:*") ||
		hasPermission(permissions, "*");

	const { userId: requestedUserId, all } = c.req.valid("query");
	const showAll = all === "true" && canAdminKeys;

	let targetUserId = user.id;
	if (requestedUserId && requestedUserId !== user.id) {
		if (!canAdminKeys) {
			return c.json(
				{
					error: "Insufficient permissions to view another user's SSH keys.",
				},
				403,
			);
		}
		targetUserId = requestedUserId;
	}

	const baseQuery = db
		.select({
			id: userSshKeys.id,
			userId: userSshKeys.userId,
			name: userSshKeys.name,
			publicKey: userSshKeys.publicKey,
			fingerprint: userSshKeys.fingerprint,
			createdAt: userSshKeys.createdAt,
			lastUsedAt: userSshKeys.lastUsedAt,
		})
		.from(userSshKeys);

	const keys = showAll
		? await baseQuery.orderBy(desc(userSshKeys.createdAt)).limit(100)
		: await baseQuery
				.where(eq(userSshKeys.userId, targetUserId))
				.orderBy(desc(userSshKeys.createdAt));

	return c.json(
		{
			keys,
		},
		200,
	);
});

export default route;
