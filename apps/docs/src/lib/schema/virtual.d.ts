declare module "virtual:db-schema" {
	import type { TableDefinition } from "./types";
	export const schemaTables: Record<string, TableDefinition>;
}
