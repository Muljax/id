import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter, resolveTitle } from "./frontmatter.js";
import { SECTION_CONFIG } from "./sections.js";
import { sortNavItems } from "./sorter.js";
import type {
	NavItem,
	NavPage,
	NavSection,
	NavTree,
	PageFrontmatter,
} from "./types.js";

function humanise(stem: string): string {
	return stem.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function tryParseFrontmatter(filePath: string): PageFrontmatter | null {
	try {
		if (!fs.existsSync(filePath)) return null;
		const source = fs.readFileSync(filePath, "utf-8");
		return parseFrontmatter(source);
	} catch {
		return null;
	}
}

interface SectionMetadata {
	label: string;
	order: number;
	collapsed: boolean;
	pageOrderMap?: Map<string, number>;
}

function resolveSectionMeta(dirPath: string, dirName: string): SectionMetadata {
	// 1. Check for directory-level _meta.json or _category.json
	const metaPaths = [
		path.join(dirPath, "_meta.json"),
		path.join(dirPath, "_category.json"),
	];

	for (const metaPath of metaPaths) {
		if (fs.existsSync(metaPath)) {
			try {
				const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
				const pageOrderMap = new Map<string, number>();
				if (Array.isArray(meta.pages)) {
					meta.pages.forEach((stem: string, idx: number) => {
						pageOrderMap.set(stem, idx + 1);
					});
				}

				return {
					label: meta.label ?? meta.title ?? humanise(dirName),
					order: meta.order ?? meta.weight ?? 999,
					collapsed: meta.collapsed ?? false,
					pageOrderMap: pageOrderMap.size > 0 ? pageOrderMap : undefined,
				};
			} catch {
				// ignore parse errors and fallback
			}
		}
	}

	// 2. Check for index.mdx / index.md frontmatter in this directory
	const indexFm =
		tryParseFrontmatter(path.join(dirPath, "index.mdx")) ??
		tryParseFrontmatter(path.join(dirPath, "index.md"));
	if (indexFm) {
		return {
			label: indexFm.sidebar?.label ?? indexFm.title ?? humanise(dirName),
			order: indexFm.sidebar?.order ?? 999,
			collapsed: indexFm.sidebar?.collapsed ?? false,
		};
	}

	// 3. Check central SECTION_CONFIG
	const configured = SECTION_CONFIG[dirName];
	if (configured) {
		return {
			label: configured.label ?? humanise(dirName),
			order: configured.order ?? 999,
			collapsed: configured.collapsed ?? false,
		};
	}

	// 4. Fallback default
	return {
		label: humanise(dirName),
		order: 999,
		collapsed: false,
	};
}

function collectPages(items: readonly NavItem[]): NavPage[] {
	const pages: NavPage[] = [];
	for (const item of items) {
		if (item.kind === "page") {
			pages.push(item);
		} else {
			pages.push(...collectPages(item.items));
		}
	}
	return pages;
}

/**
 * Converts an absolute file path to a URL path string rooted at contentRoot.
 * Normalises Windows backslashes so paths are always forward-slash separated.
 */
function toUrlPath(root: string, dir: string, stem: string): string {
	const rel = path.relative(root, dir).replace(/\\/g, "/");
	const prefix = rel === "" ? "" : `/${rel}`;
	return `${prefix}/${stem}`;
}

function parseDirectory(
	dir: string,
	root: string,
	parentMeta?: SectionMetadata,
): NavItem[] {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const items: NavItem[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const meta = resolveSectionMeta(fullPath, entry.name);
			const children = parseDirectory(fullPath, root, meta);
			if (children.length === 0) continue;

			const section = {
				kind: "section",
				label: meta.label,
				order: meta.order,
				collapsed: meta.collapsed,
				items: sortNavItems(children),
			} satisfies NavSection;

			items.push(section);
			continue;
		}

		if (!entry.isFile()) continue;

		const ext = path.extname(entry.name);
		if (ext !== ".mdx" && ext !== ".md") continue;

		const stem = path.basename(entry.name, ext);
		if (stem === "index") continue;

		const source = fs.readFileSync(fullPath, "utf-8");
		const fm = parseFrontmatter(source);

		// Order priority: explicit page frontmatter > directory page order map > 999
		const calculatedOrder =
			fm.sidebar?.order ?? parentMeta?.pageOrderMap?.get(stem) ?? 999;

		const page = {
			kind: "page",
			title: resolveTitle(fm, stem),
			...(fm.description !== undefined && { description: fm.description }),
			path: toUrlPath(root, dir, stem),
			filePath: fullPath,
			order: calculatedOrder,
			...(fm.sidebar?.badge !== undefined && { badge: fm.sidebar.badge }),
		} satisfies NavPage;

		items.push(page);
	}

	return items;
}

export function buildNavTree(contentRoot: string): NavTree {
	const items = sortNavItems(parseDirectory(contentRoot, contentRoot));
	const pages = collectPages(items);
	return { items, pages };
}
