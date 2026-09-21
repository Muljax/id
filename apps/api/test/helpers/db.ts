import path from "node:path";
import { Database as SqliteDatabase } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "../../src/db/schema";
import { SYSTEM_ROLE_IDS } from "../../src/lib/rbac/constants";

/**
 * Creates a mock Cloudflare D1Database adapter backed by an in-memory Bun SQLite instance.
 */
export function createD1Mock(sqlite: SqliteDatabase): D1Database {
	return {
		prepare(query: string) {
			let boundParams: unknown[] = [];
			return {
				bind(...params: unknown[]) {
					boundParams = params;
					return this;
				},
				async first<T = unknown>(colName?: string) {
					const stmt = sqlite.query(query);
					const row = stmt.get(...(boundParams as never[])) as Record<
						string,
						unknown
					> | null;
					if (!row) return null;
					if (colName) return row[colName] as T;
					return row as T;
				},
				async all<T = unknown>() {
					const stmt = sqlite.query(query);
					const results = stmt.all(...(boundParams as never[])) as T[];
					return {
						results,
						success: true,
						meta: { changes: 0 },
					};
				},
				async run() {
					const stmt = sqlite.query(query);
					const res = stmt.run(...(boundParams as never[]));
					return { success: true, meta: { changes: res.changes } };
				},
				async raw() {
					const stmt = sqlite.query(query);
					return stmt.values(...(boundParams as never[]));
				},
			};
		},
		async batch(statements: Array<{ all: () => Promise<unknown> }>) {
			return Promise.all(statements.map((s) => s.all()));
		},
		async exec(query: string) {
			sqlite.run(query);
			return { count: 0, duration: 0 };
		},
		dump() {
			throw new Error(
				"D1Database.dump is not supported in in-memory test mode",
			);
		},
	} as unknown as D1Database;
}

/**
 * Initializes a fully isolated in-memory test database with all tables and foreign keys enabled,
 * migrated using the codebase's Drizzle migrations.
 */
export function createTestDb() {
	const sqlite = new SqliteDatabase(":memory:");
	sqlite.run("PRAGMA foreign_keys = ON;");

	const db = drizzle({
		client: sqlite,
		schema,
	}) as unknown as import("../../src/db").Database;

	migrate(db as never, {
		migrationsFolder: path.resolve(import.meta.dir, "../../drizzle/migrations"),
	});

	const d1 = createD1Mock(sqlite);

	return { db, d1, sqlite };
}

/**
 * Seeds standard system roles and permissions for tests that require RBAC hierarchy.
 */
export async function seedTestSystemRoles(db: import("../../src/db").Database) {
	const now = Date.now();

	await db
		.insert(schema.roles)
		.values([
			{
				id: SYSTEM_ROLE_IDS.ADMIN,
				name: "Administrator",
				description: "Full system administration access",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: SYSTEM_ROLE_IDS.USER,
				name: "User",
				description: "Standard registered user access",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: SYSTEM_ROLE_IDS.EVERYONE,
				name: "Everyone",
				description: "Universal role automatically applied to all users",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
		])
		.onConflictDoNothing();

	await db
		.insert(schema.permissions)
		.values([
			{
				id: "*",
				name: "Superuser",
				description: "Global wildcard permission granting all capabilities",
				resource: "*",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "ssh:ca:read",
				name: "SSH CA Public Key Read",
				description: "View and download public SSH Certificate Authority keys",
				resource: "ssh",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "users:read",
				name: "Read Users",
				description: "View user directory",
				resource: "users",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "users:write",
				name: "Write Users",
				description: "Modify user accounts",
				resource: "users",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "settings:read",
				name: "Read Settings",
				description: "View instance configuration",
				resource: "settings",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: "settings:write",
				name: "Write Settings",
				description: "Modify instance configuration",
				resource: "settings",
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			},
		])
		.onConflictDoNothing();

	await db
		.insert(schema.rolePermissions)
		.values([
			{
				roleId: SYSTEM_ROLE_IDS.ADMIN,
				permissionId: "*",
				createdAt: now,
			},
			{
				roleId: SYSTEM_ROLE_IDS.EVERYONE,
				permissionId: "ssh:ca:read",
				createdAt: now,
			},
		])
		.onConflictDoNothing();
}
