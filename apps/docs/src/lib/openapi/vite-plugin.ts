import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIRTUAL_ID = "virtual:openapi-spec";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

function fetchOpenApiSpec(): string {
	const extractorScript = path.resolve(
		__dirname,
		"../../../scripts/extract-openapi.ts",
	);
	try {
		const stdout = execSync(`bun run "${extractorScript}"`, {
			env: {
				...process.env,
			},
			encoding: "utf-8",
			maxBuffer: 15 * 1024 * 1024,
		});
		return stdout.trim();
	} catch (err) {
		console.warn("Failed to generate OpenAPI spec at build time:", err);
		return "null";
	}
}

export function openapiPlugin(): Plugin {
	return {
		name: "vite-plugin-openapi-spec",

		resolveId(id: string) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},

		load(id: string) {
			if (id === RESOLVED_ID) {
				const specJson = fetchOpenApiSpec();
				return `export const openApiSpec = ${specJson};`;
			}
		},

		configureServer(server: ViteDevServer) {
			const routesDir = path.resolve(server.config.root, "../api/src");
			server.watcher.add(routesDir);

			server.watcher.on("all", (_, changedPath) => {
				if (!changedPath.startsWith(routesDir)) return;

				const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}
			});
		},
	};
}
