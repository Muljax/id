export interface ForeignKeyReference {
	table: string;
	column: string;
	onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
}

export interface ColumnDefinition {
	name: string;
	type: "text" | "integer" | "real" | "blob" | "boolean" | "json" | string;
	primaryKey?: boolean;
	notNull?: boolean;
	unique?: boolean;
	default?: string | number | boolean;
	foreignKey?: ForeignKeyReference;
	description: string;
	oidcClaim?: string;
	modifiers?: string[];
}

export interface IndexDefinition {
	name: string;
	columns: string[];
	unique?: boolean;
	description?: string;
}

export interface RelationshipDefinition {
	name: string;
	type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
	targetTable: string;
	targetColumn: string;
	sourceColumn: string;
	onDelete?: string;
	description?: string;
}

export interface TableDefinition {
	name: string;
	category: string;
	file: string;
	description: string;
	columns: ColumnDefinition[];
	indices?: IndexDefinition[];
	relationships?: RelationshipDefinition[];
	drizzleSnippet?: string;
	sqlDdl?: string;
}
