import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import { docsNav } from "./src/lib/navigation/vite-plugin.js";
import { openapiPlugin } from "./src/lib/openapi/vite-plugin.js";
import { remarkCallouts } from "./src/lib/remark-callouts.js";
import { remarkMermaid } from "./src/lib/remark-mermaid.js";
import { dbSchemaPlugin } from "./src/lib/schema/vite-plugin.js";
import { docsSearch } from "./src/lib/search/vite-plugin.js";

const packageJson = JSON.parse(
	readFileSync(resolve(__dirname, "./package.json"), "utf8"),
) as { version: string };

export default defineConfig({
	envDir: "../../",
	envPrefix: ["VITE_", "INSTANCE_", "API_", "DASHBOARD_", "DOCS_", "LOCALHOST"],

	plugins: [
		docsNav({ contentRoot: "src/content/docs" }),
		docsSearch({ contentRoot: "src/content/docs" }),
		dbSchemaPlugin(),
		openapiPlugin(),
		{
			enforce: "pre",
			...mdx({
				providerImportSource: "@mdx-js/react",
				remarkPlugins: [
					remarkCallouts,
					remarkMermaid,
					remarkFrontmatter,
					[remarkMdxFrontmatter, { name: "frontmatter" }],
					remarkGfm,
				],
				rehypePlugins: [
					rehypeSlug,
					[rehypeAutolinkHeadings, { behavior: "wrap" }],
					[rehypeShiki, { theme: "github-dark" }],
				],
			}),
		},
		react({ include: /\.(jsx|tsx|mdx)$/ }),
		tailwindcss(),
	],

	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},

	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version),
	},

	build: {
		target: "esnext",
		minify: "esbuild",
		cssMinify: true,
		modulePreload: {
			resolveDependencies(_, deps) {
				// Only preload critical chunks for the current initial render
				return deps.filter(
					(dep) =>
						!dep.includes("feature-") &&
						!dep.includes("mermaid") &&
						!dep.includes("elk") &&
						!dep.includes("cytoscape") &&
						!dep.includes("katex") &&
						!dep.includes("Diagram"),
				);
			},
		},
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (
						id.includes("node_modules/react/") ||
						id.includes("node_modules/react-dom/") ||
						id.includes("node_modules/react-router-dom/") ||
						id.includes("node_modules/react-router/")
					) {
						return "vendor-react";
					}
					if (id.includes("node_modules/lucide-react/")) {
						return "vendor-icons";
					}
					if (
						id.includes("virtual:openapi-spec") ||
						id.includes("/components/openapi/")
					) {
						return "feature-openapi";
					}
					if (
						id.includes("virtual:db-schema") ||
						id.includes("/components/schema/")
					) {
						return "feature-schema";
					}
					if (
						id.includes("virtual:docs-search") ||
						id.includes("/components/search/")
					) {
						return "feature-search";
					}
				},
			},
		},
	},
});
