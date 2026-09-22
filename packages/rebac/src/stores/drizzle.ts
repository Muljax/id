import { type SQL, and, eq, or } from "drizzle-orm";
import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { matchFilter, validateTuple } from "../tuple";
import type { Tuple, TupleFilter, TupleStore } from "../types";

/**
 * Creates the standard Drizzle SQLite/D1 table definition for ReBAC relationship tuples.
 */
export function createRebacSqliteTable(tableName = "rebac_tuples") {
	return sqliteTable(
		tableName,
		{
			object: text("object").notNull(),
			relation: text("relation").notNull(),
			subject: text("subject").notNull(),
		},
		(t) => [
			primaryKey({ columns: [t.object, t.relation, t.subject] }),
			index(`idx_${tableName}_obj_rel`).on(t.object, t.relation),
			index(`idx_${tableName}_sub_rel`).on(t.subject, t.relation),
		],
	);
}

export type RebacTable = ReturnType<typeof createRebacSqliteTable>;

export interface DrizzleTupleStoreOptions {
	table?: RebacTable;
}

export interface DrizzleDatabase {
	select: (...args: unknown[]) => any;
	insert: (...args: unknown[]) => any;
	delete: (...args: unknown[]) => any;
}

/**
 * Universal Drizzle ORM adapter for ReBAC tuple persistence.
 * Compatible with Cloudflare D1, SQLite, LibSQL, Postgres, and MySQL.
 */
export class DrizzleTupleStore implements TupleStore {
	private readonly db: DrizzleDatabase;
	private readonly table: RebacTable;

	constructor(
		db: DrizzleDatabase | unknown,
		optionsOrTable?: RebacTable | DrizzleTupleStoreOptions,
	) {
		this.db = db as DrizzleDatabase;
		if (
			optionsOrTable &&
			typeof optionsOrTable === "object" &&
			"object" in optionsOrTable
		) {
			this.table = optionsOrTable as RebacTable;
		} else if ((optionsOrTable as DrizzleTupleStoreOptions)?.table) {
			this.table = (optionsOrTable as DrizzleTupleStoreOptions).table as RebacTable;
		} else {
			this.table = createRebacSqliteTable();
		}
	}

	/**
	 * Reads tuples matching the specified filter criteria.
	 */
	async readTuples(filter: TupleFilter): Promise<Tuple[]> {
		const conditions: SQL[] = [];

		if (filter.object) {
			conditions.push(eq(this.table.object, filter.object));
		}
		if (filter.relation) {
			conditions.push(eq(this.table.relation, filter.relation));
		}
		if (filter.subject) {
			conditions.push(eq(this.table.subject, filter.subject));
		}

		let query = this.db.select().from(this.table);
		if (conditions.length > 0) {
			query = query.where(
				conditions.length === 1 ? conditions[0] : and(...conditions),
			);
		}

		const rows: Array<{ object: string; relation: string; subject: string }> =
			await query;

		const results: Tuple[] = [];
		for (const row of rows) {
			const tuple: Tuple = {
				object: row.object,
				relation: row.relation,
				subject: row.subject,
			};
			if (matchFilter(tuple, filter)) {
				results.push(tuple);
			}
		}

		return results;
	}

	/**
	 * Writes relationship tuples to the database, ignoring conflicts.
	 */
	async writeTuples(tuples: Tuple[]): Promise<void> {
		if (!tuples || tuples.length === 0) {
			return;
		}

		const validTuples: Tuple[] = [];
		const seen = new Set<string>();

		for (const tuple of tuples) {
			validateTuple(tuple);
			const key = `${tuple.object}#${tuple.relation}@${tuple.subject}`;
			if (!seen.has(key)) {
				seen.add(key);
				validTuples.push({
					object: tuple.object,
					relation: tuple.relation,
					subject: tuple.subject,
				});
			}
		}

		if (validTuples.length === 0) {
			return;
		}

		// Insert with onConflictDoNothing
		try {
			await this.db
				.insert(this.table)
				.values(validTuples)
				.onConflictDoNothing();
		} catch {
			// Fallback individual inserts if batch fails on specific dialect
			for (const t of validTuples) {
				await this.db.insert(this.table).values(t).onConflictDoNothing();
			}
		}
	}

	/**
	 * Deletes specified relationship tuples from the database.
	 */
	async deleteTuples(tuples: Tuple[]): Promise<void> {
		if (!tuples || tuples.length === 0) {
			return;
		}

		const clauses = tuples.map((t) =>
			and(
				eq(this.table.object, t.object),
				eq(this.table.relation, t.relation),
				eq(this.table.subject, t.subject),
			),
		);

		if (clauses.length === 1 && clauses[0]) {
			await this.db.delete(this.table).where(clauses[0]);
		} else if (clauses.length > 1) {
			await this.db.delete(this.table).where(or(...clauses));
		}
	}
}
