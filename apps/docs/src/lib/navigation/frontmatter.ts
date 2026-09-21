import matter from "gray-matter";
import type { PageFrontmatter } from "./types.js";

function humanise(stem: string): string {
	return stem.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseFrontmatter(source: string): PageFrontmatter {
	const { data } = matter(source);
	return data as PageFrontmatter;
}

export function resolveTitle(fm: PageFrontmatter, stem: string): string {
	return fm.sidebar?.label ?? fm.title ?? humanise(stem);
}
