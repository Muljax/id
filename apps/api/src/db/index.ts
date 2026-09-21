import { drizzle } from "drizzle-orm/d1";

export function createDb(db: D1Database) {
	return drizzle(db);
}

export type Database = ReturnType<typeof createDb>;
