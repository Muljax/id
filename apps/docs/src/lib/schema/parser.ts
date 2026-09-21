import fs from "node:fs";
import path from "node:path";
import * as schema from "../../../../api/src/db/schema";
import { getTableName, isTable } from "drizzle-orm";
import { type SQLiteTable, getTableConfig } from "drizzle-orm/sqlite-core";
import type {
	ColumnDefinition,
	IndexDefinition,
	TableDefinition,
} from "./types";

interface DrizzleColumn {
	name: string;
	columnType?: string;
	dataType?: string;
	primary?: boolean;
	notNull?: boolean;
	isUnique?: boolean;
	hasDefault?: boolean;
	default?: unknown;
}

interface DrizzleIndex {
	config: {
		name: string;
		unique?: boolean;
		columns?: Array<{ name: string }>;
	};
}

interface FileDocMetadata {
	tableDescription: string;
	columns: Record<string, string>;
}

function toSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function cleanComment(raw: string): string {
	return raw
		.replace(/^\/\*\*?/, "")
		.replace(/\*\/$/, "")
		.replace(/^\/\/\s*/, "")
		.split("\n")
		.map((line) => line.replace(/^\s*\*\s?/, "").trim())
		.filter(Boolean)
		.join(" ")
		.trim();
}

/**
 * Parses JSDoc and line comments directly from TypeScript schema source files.
 */
function parseSchemaComments(
	filePath: string,
): Record<string, FileDocMetadata> {
	const result: Record<string, FileDocMetadata> = {};
	if (!fs.existsSync(filePath)) return result;

	const content = fs.readFileSync(filePath, "utf8");

	// Match each sqliteTable declaration
	const tableRegex =
		/(?:\/\*\*([^*]*?(?:\*(?!\/)[^*]*?)*)\*\/|\/\/\s*([^\n\r]+))?\s*\n?\s*export\s+const\s+(\w+)\s*=\s*sqliteTable\s*\(\s*["']([^"']+)["']\s*,\s*\{([\s\S]*?)\}(?:\s*,\s*[\s\S]*?)?\);/g;

	for (const match of content.matchAll(tableRegex)) {
		const rawTableDoc = match[1] || match[2] || "";
		const tableName = match[4];
		const columnsBlock = match[5] || "";

		const cols: Record<string, string> = {};

		// Match each column with optional preceding doc
		const colRegex =
			/(?:\/\*\*([^*]*?(?:\*(?!\/)[^*]*?)*)\*\/|\/\/\s*([^\n\r]+))?\s*\n?\s*(\w+)\s*:\s*(?:text|integer|real|blob|customType)\s*\(\s*["']([^"']+)["']/g;

		for (const cMatch of columnsBlock.matchAll(colRegex)) {
			const rawDoc = cMatch[1] || cMatch[2] || "";
			const propKey = cMatch[3];
			const colName = cMatch[4] || propKey;

			if (rawDoc && (colName || propKey)) {
				const cleaned = cleanComment(rawDoc);
				if (colName) cols[colName] = cleaned;
				if (propKey) cols[propKey] = cleaned;
				if (propKey) cols[toSnakeCase(propKey)] = cleaned;
			}
		}

		if (tableName) {
			result[tableName] = {
				tableDescription: cleanComment(rawTableDoc),
				columns: cols,
			};
		}
	}

	return result;
}

export function extractDatabaseSchema(): Record<string, TableDefinition> {
	const tables: Record<string, TableDefinition> = {};
	const schemaDir = path.resolve(
		import.meta.dirname,
		"../../../../api/src/db/schema",
	);

	// Preload JSDoc comments from all schema files
	const docRegistry: Record<string, FileDocMetadata> = {};
	if (fs.existsSync(schemaDir)) {
		const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".ts"));
		for (const file of files) {
			const fileDocs = parseSchemaComments(path.join(schemaDir, file));
			Object.assign(docRegistry, fileDocs);
		}
	}

	for (const [, tableObj] of Object.entries(schema)) {
		if (!isTable(tableObj)) continue;

		const tableName = getTableName(tableObj);
		const config = getTableConfig(tableObj as SQLiteTable);
		const docs = docRegistry[tableName] || {
			tableDescription: "",
			columns: {},
		};

		const fkMap: Record<
			string,
			{
				table: string;
				column: string;
				onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
			}
		> = {};
		for (const fk of config.foreignKeys) {
			const ref = fk.reference();
			const foreignTable = getTableName(ref.foreignTable);
			for (let i = 0; i < ref.columns.length; i++) {
				const col = ref.columns[i];
				const fCol = ref.foreignColumns[i];
				if (col && fCol) {
					fkMap[col.name] = {
						table: foreignTable,
						column: fCol.name,
						onDelete: fk.onDelete?.toUpperCase() as
							| "CASCADE"
							| "SET NULL"
							| "RESTRICT"
							| "NO ACTION"
							| undefined,
					};
				}
			}
		}

		const compositePkCols = new Set<string>();
		for (const pk of config.primaryKeys) {
			for (const c of pk.columns) {
				compositePkCols.add(c.name);
			}
		}

		const columns: ColumnDefinition[] = (config.columns as DrizzleColumn[]).map(
			(col) => {
				let typeName = "text";
				if (col.columnType === "SQLiteInteger") typeName = "integer";
				else if (col.columnType === "SQLiteReal") typeName = "real";
				else if (col.columnType === "SQLiteBlob") typeName = "blob";
				else if (col.dataType === "boolean") typeName = "boolean";
				else if (col.dataType === "json") typeName = "json";

				const isPk = !!col.primary || compositePkCols.has(col.name);
				const fk = fkMap[col.name];

				// Lookup JSDoc comment by column database name, camelCase property, or snake_case
				const jsDoc =
					docs.columns[col.name] || docs.columns[toSnakeCase(col.name)] || "";

				const desc = jsDoc || "";

				return {
					name: col.name,
					type: typeName,
					primaryKey: isPk,
					notNull: col.notNull,
					unique: col.isUnique,
					default: col.hasDefault ? String(col.default) : undefined,
					foreignKey: fk,
					description: desc,
				};
			},
		);

		const indices: IndexDefinition[] = (config.indexes as DrizzleIndex[]).map(
			(idx) => ({
				name: idx.config.name,
				columns: (idx.config.columns || []).map((c) => c.name),
				unique: idx.config.unique,
			}),
		);

		tables[tableName] = {
			name: tableName,
			category: "",
			file: `apps/api/src/db/schema/${tableName}.ts`,
			description: docs.tableDescription || "",
			columns,
			indices,
			relationships: [],
		};
	}

	// Compute bidirectional foreign key relationships
	for (const [tName, table] of Object.entries(tables)) {
		for (const col of table.columns) {
			if (col.foreignKey) {
				const target = col.foreignKey.table;
				table.relationships = table.relationships || [];
				table.relationships.push({
					name: `${col.name} -> ${target}`,
					type: "many-to-one",
					targetTable: target,
					targetColumn: col.foreignKey.column,
					sourceColumn: col.name,
					onDelete: col.foreignKey.onDelete,
				});

				const targetTable = tables[target];
				if (targetTable) {
					targetTable.relationships = targetTable.relationships || [];
					targetTable.relationships.push({
						name: `${tName}.${col.name}`,
						type: "one-to-many",
						targetTable: tName,
						targetColumn: col.name,
						sourceColumn: col.foreignKey.column,
						onDelete: col.foreignKey.onDelete,
					});
				}
			}
		}
	}

	return tables;
}
