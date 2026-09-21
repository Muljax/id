import {
	Check,
	Code2,
	Copy,
	Database,
	Key,
	Link2,
	List,
	Network,
	Search,
	Sparkles,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { schemaTables } from "virtual:db-schema";
import type { ColumnDefinition, TableDefinition } from "../../lib/schema/types";

export interface DatabaseTableProps {
	name: string;
	title?: string;
	description?: string;
	columns?: ColumnDefinition[];
}

/**
 * Tokenizes and renders a single line of SQL with syntax-highlighted spans.
 */
function renderHighlightedSqlLine(line: string): React.ReactNode[] {
	const tokenRegex =
		/(--[^\n]*)|('(?:''|[^'])*')|\b(CREATE\s+TABLE|CREATE\s+UNIQUE\s+INDEX|CREATE\s+INDEX|PRIMARY\s+KEY|NOT\s+NULL|ON\s+DELETE\s+CASCADE|ON\s+DELETE\s+SET\s+NULL|ON\s+DELETE\s+RESTRICT|ON\s+DELETE\s+NO\s+ACTION|UNIQUE|DEFAULT|REFERENCES|ON\s+DELETE|CASCADE|RESTRICT|INDEX|TABLE|CREATE)\b|\b(TEXT|INTEGER|REAL|BLOB|BOOLEAN|JSON|VARCHAR|INT|BIGINT|FLOAT|DOUBLE)\b|\b(TRUE|FALSE|NULL|\d+)\b|([a-zA-Z_][a-zA-Z0-9_]*)|([(),;])/gi;

	let lastIndex = 0;
	let match: RegExpExecArray | null;
	const parts: React.ReactNode[] = [];
	let key = 0;

	// Reset lastIndex for safety
	tokenRegex.lastIndex = 0;

	while ((match = tokenRegex.exec(line)) !== null) {
		if (match.index > lastIndex) {
			parts.push(line.slice(lastIndex, match.index));
		}

		const [
			raw,
			comment,
			stringLiteral,
			keyword,
			dataType,
			constant,
			identifier,
			punct,
		] = match;

		if (comment) {
			parts.push(
				<span key={key++} className="text-zinc-500 italic">
					{comment}
				</span>,
			);
		} else if (stringLiteral) {
			parts.push(
				<span key={key++} className="text-emerald-300 font-normal">
					{stringLiteral}
				</span>,
			);
		} else if (keyword) {
			parts.push(
				<span key={key++} className="text-violet-400 font-semibold">
					{keyword}
				</span>,
			);
		} else if (dataType) {
			parts.push(
				<span key={key++} className="text-sky-300 font-medium">
					{dataType}
				</span>,
			);
		} else if (constant) {
			parts.push(
				<span key={key++} className="text-amber-300 font-medium">
					{constant}
				</span>,
			);
		} else if (identifier) {
			parts.push(
				<span key={key++} className="text-zinc-100">
					{identifier}
				</span>,
			);
		} else if (punct) {
			parts.push(
				<span key={key++} className="text-zinc-400 font-normal">
					{punct}
				</span>,
			);
		} else {
			parts.push(raw);
		}

		lastIndex = match.index + raw.length;
	}

	if (lastIndex < line.length) {
		parts.push(line.slice(lastIndex));
	}

	return parts;
}

export function DatabaseTable({
	name,
	title,
	description: propDescription,
	columns: propColumns,
}: DatabaseTableProps) {
	const tableData: TableDefinition | undefined = schemaTables[name];

	const [activeTab, setActiveTab] = useState<
		"columns" | "relations" | "indices" | "ddl"
	>("columns");
	const [searchQuery, setSearchQuery] = useState("");
	const [copied, setCopied] = useState(false);

	const columns = propColumns || tableData?.columns || [];
	const indices = tableData?.indices || [];
	const relationships = tableData?.relationships || [];
	const displayDescription = propDescription || tableData?.description;

	const filteredColumns = useMemo(() => {
		if (!searchQuery.trim()) return columns;
		const q = searchQuery.toLowerCase();
		return columns.filter(
			(col) =>
				col.name.toLowerCase().includes(q) ||
				col.type.toLowerCase().includes(q) ||
				col.description?.toLowerCase().includes(q) ||
				(col.foreignKey &&
					`${col.foreignKey.table}.${col.foreignKey.column}`
						.toLowerCase()
						.includes(q)),
		);
	}, [columns, searchQuery]);

	// Generate SQLite DDL dynamically from reflected columns, constraints, and indices
	const generatedDdl = useMemo(() => {
		if (!columns.length) return "";
		const lines: string[] = [];

		for (const col of columns) {
			let line = `  ${col.name} ${col.type.toUpperCase()}`;
			if (col.primaryKey) line += " PRIMARY KEY";
			if (col.notNull) line += " NOT NULL";
			if (col.unique && !col.primaryKey) line += " UNIQUE";
			if (col.default !== undefined) line += ` DEFAULT ${col.default}`;
			if (col.foreignKey) {
				line += ` REFERENCES ${col.foreignKey.table}(${col.foreignKey.column})`;
				if (col.foreignKey.onDelete) {
					line += ` ON DELETE ${col.foreignKey.onDelete}`;
				}
			}
			lines.push(line);
		}

		let ddl = `CREATE TABLE ${name} (\n${lines.join(",\n")}\n);`;

		if (indices && indices.length > 0) {
			ddl += "\n";
			for (const idx of indices) {
				const uq = idx.unique ? "UNIQUE " : "";
				ddl += `\nCREATE ${uq}INDEX ${idx.name} ON ${name} (${idx.columns.join(", ")});`;
			}
		}

		return ddl;
	}, [name, columns, indices]);

	const handleCopyDdl = async () => {
		try {
			await navigator.clipboard.writeText(generatedDdl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy DDL", err);
		}
	};

	const getTypeBadgeStyle = (type: string) => {
		const t = type.toLowerCase();
		if (t === "text" || t === "string" || t === "varchar") {
			return "border-sky-500/25 bg-sky-500/10 text-sky-300";
		}
		if (t === "integer" || t === "int" || t === "bigint") {
			return "border-violet-500/25 bg-violet-500/10 text-violet-300";
		}
		if (t === "real" || t === "float" || t === "double") {
			return "border-amber-500/25 bg-amber-500/10 text-amber-300";
		}
		if (t === "blob") {
			return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
		}
		if (t === "boolean") {
			return "border-pink-500/25 bg-pink-500/10 text-pink-300";
		}
		return "border-zinc-700 bg-zinc-800/60 text-zinc-300";
	};

	if (!tableData && !propColumns) {
		return (
			<div className="my-6 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-300">
				Table <code className="font-mono font-semibold">{name}</code> was not
				found in the Drizzle database schema.
			</div>
		);
	}

	return (
		<div className="group relative my-6 rounded-2xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm shadow-xl shadow-black/20 overflow-hidden not-prose transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40">
			{/* Table Header Bar */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 bg-white/[0.015] px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="flex size-7 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-400 shadow-sm shadow-violet-500/10">
						<Database size={14} />
					</div>
					<div className="flex items-center gap-2">
						<span className="font-mono text-sm font-semibold text-white tracking-tight">
							{title || name}
						</span>
						<span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
							{columns.length} cols
						</span>
					</div>
				</div>

				{/* Tab Nav Controls */}
				<div className="flex items-center gap-1 rounded-xl border border-white/8 bg-zinc-950/60 p-1">
					<button
						type="button"
						onClick={() => setActiveTab("columns")}
						className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
							activeTab === "columns"
								? "bg-violet-500/15 text-violet-300 shadow-sm"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						<List size={12} />
						<span>Columns</span>
					</button>

					{relationships.length > 0 && (
						<button
							type="button"
							onClick={() => setActiveTab("relations")}
							className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
								activeTab === "relations"
									? "bg-violet-500/15 text-violet-300 shadow-sm"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							<Network size={12} />
							<span>Foreign Keys</span>
							<span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-zinc-300">
								{relationships.length}
							</span>
						</button>
					)}

					{indices.length > 0 && (
						<button
							type="button"
							onClick={() => setActiveTab("indices")}
							className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
								activeTab === "indices"
									? "bg-violet-500/15 text-violet-300 shadow-sm"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							<Sparkles size={12} />
							<span>Indices</span>
							<span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-zinc-300">
								{indices.length}
							</span>
						</button>
					)}

					<button
						type="button"
						onClick={() => setActiveTab("ddl")}
						className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
							activeTab === "ddl"
								? "bg-violet-500/15 text-violet-300 shadow-sm"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						<Code2 size={12} />
						<span>DDL</span>
					</button>
				</div>
			</div>

			{/* Description Banner (if present) */}
			{displayDescription && (
				<div className="border-b border-white/6 bg-white/[0.01] px-4 py-2.5 text-xs text-zinc-300 leading-relaxed font-sans">
					{displayDescription}
				</div>
			)}

			{/* Tab 1: Columns Table */}
			{activeTab === "columns" && (
				<div>
					{/* Quick Search Toolbar */}
					{columns.length > 5 && (
						<div className="flex items-center gap-2 border-b border-white/6 px-4 py-2 bg-white/[0.005]">
							<Search size={13} className="text-zinc-500 shrink-0" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={`Filter ${columns.length} columns by name, type, constraint, or description...`}
								className="w-full bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
								>
									Clear
								</button>
							)}
						</div>
					)}

					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="border-b border-white/6 text-zinc-400 font-mono uppercase tracking-wider text-[10px] bg-white/[0.01]">
									<th className="px-4 py-2.5 font-semibold w-[22%]">Column</th>
									<th className="px-3 py-2.5 font-semibold w-[12%]">Type</th>
									<th className="px-3 py-2.5 font-semibold w-[28%]">
										Constraints & Keys
									</th>
									<th className="px-4 py-2.5 font-semibold w-[38%]">
										Description
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/4 text-[12px]">
								{filteredColumns.map((col) => {
									const hasConstraints =
										col.primaryKey ||
										col.foreignKey ||
										col.unique ||
										col.notNull ||
										col.default !== undefined;

									return (
										<tr
											key={col.name}
											className="hover:bg-white/[0.02] transition-colors group/row"
										>
											{/* Column 1: Name */}
											<td className="px-4 py-3 font-mono font-semibold text-white align-top whitespace-nowrap">
												<div className="flex items-center gap-2">
													<span>{col.name}</span>
													{col.primaryKey && (
														<span
															title="Primary Key"
															className="inline-flex items-center justify-center size-4 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30"
														>
															<Key size={10} />
														</span>
													)}
												</div>
											</td>

											{/* Column 2: SQL Type */}
											<td className="px-3 py-3 align-top whitespace-nowrap">
												<span
													className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-tight ${getTypeBadgeStyle(
														col.type,
													)}`}
												>
													{col.type}
												</span>
											</td>

											{/* Column 3: Dedicated Constraints & Keys */}
											<td className="px-3 py-3 align-top">
												{hasConstraints ? (
													<div className="flex flex-wrap items-center gap-1.5">
														{col.primaryKey && (
															<span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300 shadow-sm shadow-amber-500/5">
																<Key size={9} />
																<span>PK</span>
															</span>
														)}

														{col.foreignKey && (
															<button
																type="button"
																onClick={() => setActiveTab("relations")}
																title={`Foreign key references ${col.foreignKey.table}.${col.foreignKey.column}${
																	col.foreignKey.onDelete
																		? ` (ON DELETE ${col.foreignKey.onDelete})`
																		: ""
																} - click to view relations`}
																className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/50 transition-colors cursor-pointer"
															>
																<Link2 size={9} className="shrink-0" />
																<span>
																	➜ {col.foreignKey.table}.
																	{col.foreignKey.column}
																</span>
																{col.foreignKey.onDelete && (
																	<span className="text-[9px] text-sky-400/80 font-normal">
																		[{col.foreignKey.onDelete}]
																	</span>
																)}
															</button>
														)}

														{col.unique && !col.primaryKey && (
															<span className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-violet-300">
																<Sparkles size={9} />
																<span>UNIQUE</span>
															</span>
														)}

														{col.notNull ? (
															<span className="inline-block rounded-md border border-white/8 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-300">
																NOT NULL
															</span>
														) : (
															<span className="inline-block rounded-md border border-white/4 bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
																NULLABLE
															</span>
														)}

														{col.default !== undefined && (
															<span
																title={`Default Value: ${col.default}`}
																className="inline-flex items-center gap-1 rounded-md border border-zinc-700/60 bg-zinc-800/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
															>
																<span className="text-zinc-500">default:</span>
																<span className="font-semibold text-zinc-200">
																	{String(col.default)}
																</span>
															</span>
														)}
													</div>
												) : (
													<span className="font-mono text-zinc-600 text-[11px]">
														—
													</span>
												)}
											</td>

											{/* Column 4: Dedicated Documentation / Description */}
											<td className="px-4 py-3 font-sans text-zinc-300 leading-relaxed align-top">
												{col.description ? (
													<span className="text-zinc-300 text-xs selection:bg-violet-500/30 selection:text-white">
														{col.description}
													</span>
												) : (
													<span className="font-mono text-zinc-600 text-[11px]">
														—
													</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Tab 2: Foreign Keys & Relationships */}
			{activeTab === "relations" && (
				<div className="p-4 space-y-3">
					{relationships.map((rel) => (
						<div
							key={`${rel.type}-${rel.sourceColumn}-${rel.targetTable}-${rel.targetColumn}`}
							className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] p-3 text-xs"
						>
							<div className="flex items-center gap-3">
								<div className="flex size-7 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-500/10 text-sky-400">
									<Link2 size={13} />
								</div>
								<div>
									<div className="font-mono font-medium text-white">
										{rel.sourceColumn} &rarr; {rel.targetTable}.
										{rel.targetColumn}
									</div>
									<div className="text-[11px] text-zinc-400 font-sans">
										{rel.type === "many-to-one"
											? "Foreign Key (References Parent)"
											: "Referenced By (Child Table)"}
									</div>
								</div>
							</div>
							{rel.onDelete && (
								<span className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
									ON DELETE {rel.onDelete}
								</span>
							)}
						</div>
					))}
				</div>
			)}

			{/* Tab 3: Indices */}
			{activeTab === "indices" && (
				<div className="p-4 space-y-3">
					{indices.map((idx) => (
						<div
							key={idx.name}
							className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] p-3 text-xs"
						>
							<div className="flex items-center gap-3">
								<div className="flex size-7 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-400">
									<Sparkles size={13} />
								</div>
								<div>
									<div className="font-mono font-semibold text-white">
										{idx.name}
									</div>
									<div className="font-mono text-[11px] text-zinc-400">
										Columns: ({idx.columns.join(", ")})
									</div>
								</div>
							</div>
							{idx.unique && (
								<span className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-violet-300">
									UNIQUE
								</span>
							)}
						</div>
					))}
				</div>
			)}

			{/* Tab 4: SQL DDL with Full Syntax Highlighting */}
			{activeTab === "ddl" && (
				<div className="relative p-4">
					<button
						type="button"
						onClick={handleCopyDdl}
						title="Copy SQL DDL"
						className="absolute top-6 right-6 flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer z-10 backdrop-blur-sm"
					>
						{copied ? (
							<>
								<Check size={12} className="text-emerald-400" />
								<span className="text-emerald-400 text-[11px]">Copied</span>
							</>
						) : (
							<>
								<Copy size={12} />
								<span className="text-[11px]">Copy SQL</span>
							</>
						)}
					</button>

					<div className="overflow-x-auto rounded-xl bg-zinc-950/90 border border-white/6 p-4 font-mono text-xs leading-relaxed text-zinc-300 shadow-inner">
						<code className="block table w-full">
							{generatedDdl.split("\n").map((line, idx) => (
								<div key={idx} className="table-row leading-6">
									<span className="table-cell pr-4 select-none text-right text-zinc-600 font-mono text-[11px] w-6 shrink-0">
										{idx + 1}
									</span>
									<span className="table-cell whitespace-pre font-mono">
										{renderHighlightedSqlLine(line)}
									</span>
								</div>
							))}
						</code>
					</div>
				</div>
			)}
		</div>
	);
}
