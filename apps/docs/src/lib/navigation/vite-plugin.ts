import path from "node:path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { buildNavTree } from "./parser.js";
import type { NavTree } from "./types.js";

const VIRTUAL_ID = "virtual:docs-nav";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function docsNav(options?: { contentRoot?: string }): Plugin {
	const rawContentRoot = options?.contentRoot ?? "src/content/docs";

	let resolvedContentRoot: string;
	let cachedTree: NavTree | null = null;

	return {
		name: "vite-plugin-docs-nav",

		configResolved(config: ResolvedConfig) {
			resolvedContentRoot = path.resolve(config.root, rawContentRoot);
		},

		resolveId(id: string) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},

		load(id: string) {
			if (id !== RESOLVED_ID) return;

			if (cachedTree === null) {
				cachedTree = buildNavTree(resolvedContentRoot);
			}

			return `export const navTree = ${JSON.stringify(cachedTree)};`;
		},

		configureServer(server: ViteDevServer) {
			server.watcher.add(resolvedContentRoot);

			server.watcher.on("all", (_, changedPath) => {
				if (!changedPath.startsWith(resolvedContentRoot)) return;

				cachedTree = null;

				const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}
			});
		},
	};
}
