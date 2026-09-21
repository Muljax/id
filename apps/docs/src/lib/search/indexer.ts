import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { extractDatabaseSchema } from "../schema/parser.js";
import type { SearchRecord } from "./types.js";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function cleanMarkdown(text: string): string {
	return text
		.replace(/```[\s\S]*?```/g, "") // remove code blocks
		.replace(/<[^>]+>/g, "") // remove html / jsx tags
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace markdown links with text
		.replace(/[*_~`#]/g, "") // remove formatting symbols
		.replace(/\s+/g, " ")
		.trim();
}

function formatCategory(dirName: string): {
	category: "Page" | "Section" | "Database" | "API" | "Protocol";
	label: string;
} {
	if (dirName === "overview") return { category: "Page", label: "Overview" };
	if (dirName === "getting-started")
		return { category: "Page", label: "Getting Started" };
	if (dirName === "admin-guides")
		return { category: "Page", label: "Admin Guides" };
	if (dirName === "user-guides")
		return { category: "Page", label: "User Guides" };
	if (dirName === "protocols")
		return { category: "Protocol", label: "Protocols" };
	if (dirName === "reference") return { category: "API", label: "Reference" };
	return { category: "Page", label: "Docs" };
}

export function buildSearchIndex(contentRoot: string): SearchRecord[] {
	const records: SearchRecord[] = [];
	const seenIds = new Set<string>();

	function addRecord(record: SearchRecord) {
		let uniqueId = record.id;
		let count = 1;
		while (seenIds.has(uniqueId)) {
			uniqueId = `${record.id}-${count++}`;
		}
		seenIds.add(uniqueId);
		records.push({ ...record, id: uniqueId });
	}

	function scanDir(dir: string, relPath = "") {
		if (!fs.existsSync(dir)) return;
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			const entryRel = relPath ? `${relPath}/${entry.name}` : entry.name;

			if (entry.isDirectory()) {
				scanDir(fullPath, entryRel);
				continue;
			}

			if (!entry.name.endsWith(".mdx") && !entry.name.endsWith(".md")) {
				continue;
			}

			const fileContent = fs.readFileSync(fullPath, "utf-8");
			const { data: fm, content } = matter(fileContent);

			const stem = entry.name.replace(/\.mdx?$/, "");
			const { category, label: sectionLabel } = formatCategory(
				relPath ? relPath.split("/")[0] : "",
			);

			const urlPath =
				stem === "index" && !relPath
					? "/"
					: `/${relPath ? `${relPath.replace(/\/[^/]+$/, "")}/${stem}` : stem}`.replace(
							/\/index$/,
							"",
						);

			const pageTitle = (fm.title as string) || stem;
			const pageDesc = (fm.description as string) || "";

			// 1. Add top-level Page record
			addRecord({
				id: `page-${urlPath.replace(/\//g, "-") || "home"}`,
				title: pageTitle,
				description: pageDesc,
				url: urlPath || "/",
				category: category,
				breadcrumbs: [sectionLabel, pageTitle].filter(Boolean),
				keywords: [pageTitle, pageDesc, stem],
			});

			// 2. Extract Headings & Paragraph Sections
			const lines = content.split("\n");
			let currentHeading: { title: string; id: string; level: number } | null =
				null;
			let currentSectionText: string[] = [];

			const flushSection = () => {
				if (currentHeading?.title) {
					const snippet = cleanMarkdown(currentSectionText.join(" ")).slice(
						0,
						180,
					);
					addRecord({
						id: `sec-${urlPath}-${currentHeading.id}`,
						title: currentHeading.title,
						description: snippet || pageDesc,
						url: `${urlPath}#${currentHeading.id}`,
						category: "Section",
						breadcrumbs: [sectionLabel, pageTitle, currentHeading.title].filter(
							Boolean,
						),
						keywords: [
							currentHeading.title,
							pageTitle,
							...currentSectionText.slice(0, 5),
						],
					});
				}
				currentSectionText = [];
			};

			for (const line of lines) {
				const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
				if (headingMatch) {
					flushSection();
					const level = headingMatch[1].length;
					const title = headingMatch[2].trim().replace(/^#\s*/, "");
					currentHeading = {
						title,
						id: slugify(title),
						level,
					};
				} else if (currentHeading) {
					if (
						line.trim() &&
						!line.startsWith("import ") &&
						!line.startsWith("<")
					) {
						currentSectionText.push(line.trim());
					}
				}
			}
			flushSection();
		}
	}

	// Scan markdown documentation
	scanDir(contentRoot);

	// 3. Index Database Tables from Drizzle Schemas
	try {
		const dbSchema = extractDatabaseSchema();
		for (const [tableName, table] of Object.entries(dbSchema)) {
			const colNames = table.columns.map((c) => c.name);
			const colDesc = table.columns
				.filter((c) => c.description)
				.map((c) => `${c.name}: ${c.description}`)
				.join(" | ");

			addRecord({
				id: `db-table-${tableName}`,
				title: `${tableName}`,
				description:
					table.description ||
					`SQLite table with ${table.columns.length} columns: ${colNames.slice(0, 6).join(", ")}${colNames.length > 6 ? "..." : ""}`,
				url: `/reference/database-schema#${slugify(tableName)}`,
				category: "Database",
				breadcrumbs: ["Reference", "Database Schema", tableName],
				keywords: [
					tableName,
					"table",
					"schema",
					"drizzle",
					"sqlite",
					"d1",
					...colNames,
					colDesc,
				],
			});
		}
	} catch (err) {
		console.warn("Search indexer: unable to extract database schema", err);
	}

	return records;
}
