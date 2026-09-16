import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
	DEFAULT_ROLES,
	SYSTEM_PERMISSIONS,
} from "../apps/api/src/lib/rbac/constants";

const ROOT_DIR = resolve(import.meta.dir, "..");
const configFile = process.env.CONFIG_FILE
	? resolve(process.cwd(), process.env.CONFIG_FILE)
	: resolve(ROOT_DIR, "terraform/.wrangler-d1-migrations.toml");

function getDatabaseName(): string {
	if (process.env.DATABASE_NAME) {
		return process.env.DATABASE_NAME;
	}

	if (existsSync(configFile)) {
		const content = readFileSync(configFile, "utf8");
		const match = content.match(/database_name\s*=\s*"([^"]+)"/);
		if (match?.[1]) {
			return match[1];
		}
	}

	return "muljax-id-api";
}

const dbName = getDatabaseName();
const now = Date.now();
const sqlStatements: string[] = [];

for (const perm of SYSTEM_PERMISSIONS) {
	const desc = perm.description
		? `'${perm.description.replace(/'/g, "''")}'`
		: "NULL";
	sqlStatements.push(
		`INSERT OR IGNORE INTO permissions (id, name, description, resource, is_system, created_at, updated_at) VALUES ('${perm.id}', '${perm.name.replace(/'/g, "''")}', ${desc}, '${perm.resource}', 1, ${now}, ${now});`,
	);
}

for (const role of DEFAULT_ROLES) {
	const desc = role.description
		? `'${role.description.replace(/'/g, "''")}'`
		: "NULL";
	sqlStatements.push(
		`INSERT OR IGNORE INTO roles (id, name, description, is_system, created_at, updated_at) VALUES ('${role.id}', '${role.name.replace(/'/g, "''")}', ${desc}, ${role.isSystem ? 1 : 0}, ${now}, ${now});`,
	);
	for (const permId of role.permissions) {
		sqlStatements.push(
			`INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at) VALUES ('${role.id}', '${permId}', ${now});`,
		);
	}
}

const seedSqlPath = resolve(tmpdir(), `muljax-d1-seed-${Date.now()}.sql`);
writeFileSync(seedSqlPath, sqlStatements.join("\n"), "utf8");

try {
	execSync(
		`bunx wrangler d1 execute ${dbName} --remote --config "${configFile}" --file="${seedSqlPath}" -y`,
		{ stdio: "inherit" },
	);
} finally {
	if (existsSync(seedSqlPath)) {
		unlinkSync(seedSqlPath);
	}
}
