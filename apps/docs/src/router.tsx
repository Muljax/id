import type React from "react";
import { createBrowserRouter, useRouteError } from "react-router-dom";
import { navTree } from "virtual:docs-nav";
import { DocHeader, DocsLayout } from "@/components/layout";
import { HomePage } from "@/pages/HomePage";

// Glob all MDX files — Vite resolves these at build time
const mdxModules = import.meta.glob<{
	default: React.ComponentType;
	frontmatter?: { title?: string; description?: string };
}>("/src/content/docs/**/*.mdx");

/** Convert a glob file key to a URL route path. */
function toRoutePath(filePath: string): string {
	return filePath
		.replace("/src/content/docs", "")
		.replace(/\.mdx?$/, "")
		.replace(/\/index$/, "/");
}

function RouteErrorBoundary() {
	const error = useRouteError() as Error | undefined;

	return (
		<div className="my-8 rounded-2xl border border-red-500/25 bg-red-500/10 p-6 backdrop-blur-sm shadow-xl shadow-black/20 text-red-200">
			<h2 className="text-base font-medium text-red-400 mb-2">
				Failed to load document
			</h2>
			<p className="text-sm text-zinc-400 mb-4">
				An error occurred while loading this documentation page:
			</p>
			<pre className="overflow-x-auto rounded-xl bg-zinc-950/80 border border-white/6 p-4 font-mono text-xs text-red-300">
				{error?.message || String(error)}
			</pre>
		</div>
	);
}

const docRoutes = Object.entries(mdxModules)
	.filter(([filePath]) => !filePath.endsWith("/index.mdx"))
	.map(([filePath, loader]) => ({
		path: toRoutePath(filePath),
		errorElement: <RouteErrorBoundary />,
		lazy: async () => {
			const mod = await loader();
			const Component = mod.default;
			const frontmatter = mod.frontmatter || {};

			function DocPage() {
				return (
					<>
						{frontmatter.title && (
							<DocHeader
								title={frontmatter.title}
								description={frontmatter.description}
							/>
						)}
						<Component />
					</>
				);
			}

			return { Component: DocPage };
		},
	}));

export const router = createBrowserRouter([
	{
		path: "/",
		element: <DocsLayout tree={navTree} />,
		errorElement: <RouteErrorBoundary />,
		children: [{ index: true, element: <HomePage /> }, ...docRoutes],
	},
]);
