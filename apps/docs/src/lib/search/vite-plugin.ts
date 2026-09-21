import path from "node:path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { buildSearchIndex } from "./indexer.js";
import type { SearchRecord } from "./types.js";

const VIRTUAL_ID = "virtual:docs-search";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function docsSearch(options?: { contentRoot?: string }): Plugin {
	const rawContentRoot = options?.contentRoot ?? "src/content/docs";

	let resolvedContentRoot: string;
	let cachedIndex: SearchRecord[] | null = null;

	return {
		name: "vite-plugin-docs-search",

		configResolved(config: ResolvedConfig) {
			resolvedContentRoot = path.resolve(config.root, rawContentRoot);
		},

		resolveId(id: string) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},

		load(id: string) {
			if (id !== RESOLVED_ID) return;

			if (cachedIndex === null) {
				cachedIndex = buildSearchIndex(resolvedContentRoot);
			}

			return `export const searchIndex = ${JSON.stringify(cachedIndex)};`;
		},

		configureServer(server: ViteDevServer) {
			server.watcher.add(resolvedContentRoot);

			server.watcher.on("all", (_, changedPath) => {
				if (!changedPath.startsWith(resolvedContentRoot)) return;

				cachedIndex = null;

				const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}
			});
		},
	};
}
