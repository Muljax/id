import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { extractDatabaseSchema } from "./parser.js";

const VIRTUAL_ID = "virtual:db-schema";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function dbSchemaPlugin(): Plugin {
	return {
		name: "vite-plugin-db-schema",

		resolveId(id: string) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},

		load(id: string) {
			if (id === RESOLVED_ID) {
				const tables = extractDatabaseSchema();
				return `export const schemaTables = ${JSON.stringify(tables, null, 2)};`;
			}
		},

		configureServer(server: ViteDevServer) {
			const schemaDir = path.resolve(
				server.config.root,
				"../api/src/db/schema",
			);
			server.watcher.add(schemaDir);

			server.watcher.on("all", (_, changedPath) => {
				if (!changedPath.startsWith(schemaDir)) return;

				const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}
			});
		},
	};
}
