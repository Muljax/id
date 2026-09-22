import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { define, is, schema } from "../../src/schema";
import {
	createRebacSqliteTable,
	DrizzleTupleStore,
} from "../../src/stores/drizzle";
import type { Schema, Tuple } from "../../src/types";

/**
 * Standard Document Sharing ReBAC Schema fixture.
 */
export function createDocumentSchema(): Schema {
	const Group = define("group", {
		roles: ["member", "admin"],
	});

	const Folder = define("folder", (self) => ({
		relations: {
			parent: self as any,
		},
		roles: ["owner", "editor", "viewer"],
		can: {
			view: is("viewer", "editor", "owner").or(self.parent("view")),
			edit: is("editor", "owner").or(self.parent("edit")),
		},
	}));

	const Document = define("document", (self) => ({
		relations: {
			folder: Folder,
			group: Group,
		},
		roles: ["owner", "editor", "viewer", "blocked"],
		can: {
			view: is("viewer")
				.or("owner")
				.or(self.folder(Folder.view))
				.or(self.group(Group.member))
				.unless("blocked"),
			edit: is("editor").or("owner").or(self.folder(Folder.edit)),
		},
	}));

	return schema({ Group, Folder, Document });
}

/**
 * Generates an N-hop linear inheritance chain of tuples.
 */
export function generateDeepChainTuples(
	hops = 30,
	rootUser = "user:root-alice",
): Tuple[] {
	const tuples: Tuple[] = [
		{ object: "node:0", relation: "admin", subject: rootUser },
	];
	for (let i = 1; i <= hops; i++) {
		tuples.push({
			object: `node:${i}`,
			relation: "parent",
			subject: `node:${i - 1}`,
		});
	}
	return tuples;
}

/**
 * Generates a high fan-out graph with groups and nested subteams.
 */
export function generateFanOutTuples(
	groupCount = 100,
	subGroupCount = 10,
	targetUser = "user:needle-in-haystack",
): Tuple[] {
	const tuples: Tuple[] = [];
	for (let g = 1; g <= groupCount; g++) {
		tuples.push({
			object: "document:mega-spec",
			relation: "sharedWith",
			subject: `group:${g}`,
		});
		for (let sub = 1; sub <= subGroupCount; sub++) {
			tuples.push({
				object: `group:${g}`,
				relation: "member",
				subject: `group:${g}_sub_${sub}#member`,
			});
		}
	}
	tuples.push({
		object: `group:${groupCount}_sub_${subGroupCount}`,
		relation: "member",
		subject: targetUser,
	});
	return tuples;
}

/**
 * Generates a multi-ring cyclic graph to test circular loop prevention.
 */
export function generateCyclicKnotTuples(ringSize = 10): Tuple[] {
	const tuples: Tuple[] = [];
	for (let i = 0; i < ringSize; i++) {
		tuples.push({
			object: `group:${i}`,
			relation: "linkedGroup",
			subject: `group:${(i + 1) % ringSize}`,
		});
	}
	for (let i = ringSize; i < ringSize * 2; i++) {
		tuples.push({
			object: `group:${i}`,
			relation: "linkedGroup",
			subject: `group:${ringSize + ((i + 1) % ringSize)}`,
		});
	}
	tuples.push(
		{
			object: `group:${Math.floor(ringSize / 2)}`,
			relation: "linkedGroup",
			subject: `group:${ringSize + Math.floor(ringSize / 2)}`,
		},
		{
			object: `group:${ringSize + Math.floor(ringSize / 2)}`,
			relation: "linkedGroup",
			subject: `group:${Math.floor(ringSize / 2)}`,
		},
	);
	return tuples;
}

/**
 * Creates an in-memory SQLite database initialized with DrizzleTupleStore.
 */
export function createTestDrizzleStore(tableName = "rebac_tuples"): {
	db: any;
	sqlite: Database;
	store: DrizzleTupleStore;
} {
	const sqlite = new Database(":memory:");
	sqlite.run(
		`CREATE TABLE IF NOT EXISTS ${tableName} (object TEXT NOT NULL, relation TEXT NOT NULL, subject TEXT NOT NULL, PRIMARY KEY (object, relation, subject));`,
	);
	sqlite.run(
		`CREATE INDEX IF NOT EXISTS idx_${tableName}_obj_rel ON ${tableName}(object, relation);`,
	);
	sqlite.run(
		`CREATE INDEX IF NOT EXISTS idx_${tableName}_sub_rel ON ${tableName}(subject, relation);`,
	);

	const rebacTable = createRebacSqliteTable(tableName);
	const db = drizzle({ client: sqlite });
	const store = new DrizzleTupleStore(db, rebacTable);

	return { db, sqlite, store };
}
