import { Layers, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { schemaTables } from "virtual:db-schema";
import { Mermaid } from "../mermaid/Mermaid";

export interface DatabaseDiagramProps {
	title?: string;
	tables?: string[];
	defaultCategory?: string;
	includeFields?: boolean;
}

const CATEGORY_GROUPS: Record<string, { label: string; tableNames: string[] }> =
	{
		all: {
			label: "All Tables",
			tableNames: [], // empty means all
		},
		identity: {
			label: "Identity & Sessions",
			tableNames: [
				"users",
				"sessions",
				"passkeys",
				"passkey_challenges",
				"password_reset_tokens",
			],
		},
		oauth: {
			label: "OAuth & OIDC",
			tableNames: [
				"users",
				"oauth_clients",
				"oauth_grants",
				"oauth_authorization_codes",
				"oauth_device_codes",
				"oauth_access_tokens",
				"oauth_refresh_tokens",
			],
		},
		ssh: {
			label: "SSH CA",
			tableNames: ["users", "user_ssh_keys", "ssh_certificates"],
		},
		rbac: {
			label: "RBAC",
			tableNames: [
				"users",
				"roles",
				"permissions",
				"user_roles",
				"role_permissions",
			],
		},
		admin: {
			label: "Admin & Operations",
			tableNames: [
				"users",
				"roles",
				"invite_tokens",
				"signin_keys",
				"instance_settings",
				"lifecycle_actions",
				"notifications",
			],
		},
	};

function mapMermaidType(type: string): string {
	const t = type.toLowerCase();
	if (t === "integer" || t === "int" || t === "bigint") return "int";
	if (t === "real" || t === "float" || t === "double") return "float";
	if (t === "boolean") return "boolean";
	if (t === "blob") return "binary";
	if (t === "json") return "json";
	return "string";
}

export function DatabaseDiagram({
	title = "Entity Relationship Diagram",
	tables: propTables,
	defaultCategory = "all",
	includeFields = false,
}: DatabaseDiagramProps) {
	const [selectedCategory, setSelectedCategory] =
		useState<string>(defaultCategory);
	const [showFields, setShowFields] = useState<boolean>(includeFields);

	const activeTableNames = useMemo(() => {
		if (propTables && propTables.length > 0) return new Set(propTables);
		const group = CATEGORY_GROUPS[selectedCategory];
		if (group && group.tableNames.length > 0) {
			return new Set(group.tableNames);
		}
		return new Set(Object.keys(schemaTables));
	}, [propTables, selectedCategory]);

	// Generate dynamic Mermaid erDiagram string from active schema reflection
	const mermaidCode = useMemo(() => {
		const lines: string[] = ["erDiagram"];
		const renderedRelations = new Set<string>();

		// Filter active tables
		const targetTables = Object.values(schemaTables).filter((tbl) =>
			activeTableNames.has(tbl.name),
		);

		// Optional fields definition
		if (showFields) {
			for (const table of targetTables) {
				lines.push(`    ${table.name} {`);
				for (const col of table.columns) {
					const type = mapMermaidType(col.type);
					const keyTag = col.primaryKey
						? "PK"
						: col.foreignKey
							? "FK"
							: col.unique
								? "UK"
								: "";
					lines.push(`        ${type} ${col.name} ${keyTag}`.trimEnd());
				}
				lines.push("    }");
			}
		}

		// Generate foreign key relationships
		for (const table of targetTables) {
			for (const col of table.columns) {
				if (col.foreignKey && activeTableNames.has(col.foreignKey.table)) {
					const relKey = `${col.foreignKey.table}->${table.name}:${col.name}`;
					if (!renderedRelations.has(relKey)) {
						renderedRelations.add(relKey);
						const label = col.name.replace(/_id$/, "").replace(/_/g, " ");
						lines.push(
							`    ${col.foreignKey.table} ||--o{ ${table.name} : "${label || col.name}"`,
						);
					}
				}
			}
		}

		// Fallback if no relations in selected subset
		if (renderedRelations.size === 0 && !showFields) {
			for (const table of targetTables) {
				lines.push(`    ${table.name} {`);
				lines.push(`        string id PK`);
				lines.push("    }");
			}
		}

		return lines.join("\n");
	}, [activeTableNames, showFields]);

	return (
		<div className="my-6 space-y-2 not-prose">
			{/* Category / Scope Filter Buttons (when not locked to explicit prop tables) */}
			{!propTables && (
				<div className="flex flex-wrap items-center justify-between gap-2 px-1">
					<div className="flex flex-wrap items-center gap-1.5">
						<div className="flex items-center gap-1 mr-1 text-[11px] font-mono text-zinc-400">
							<Layers size={12} className="text-violet-400" />
							<span>View:</span>
						</div>
						{Object.entries(CATEGORY_GROUPS).map(([key, group]) => {
							const isActive = selectedCategory === key;
							return (
								<button
									key={key}
									type="button"
									onClick={() => setSelectedCategory(key)}
									className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
										isActive
											? "bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm"
											: "border border-white/6 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
									}`}
								>
									{group.label}
								</button>
							);
						})}
					</div>

					{/* Toggle Fields Switch */}
					<button
						type="button"
						onClick={() => setShowFields(!showFields)}
						className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
							showFields
								? "border-sky-500/30 bg-sky-500/15 text-sky-200"
								: "border-white/6 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
						}`}
					>
						<Sparkles size={11} className={showFields ? "text-sky-300" : ""} />
						<span>{showFields ? "Hide Columns" : "Show Columns"}</span>
					</button>
				</div>
			)}

			{/* Render dynamic zoomable diagram */}
			<Mermaid
				chart={mermaidCode}
				title={`${title} (${
					CATEGORY_GROUPS[selectedCategory]?.label || "Reflected"
				})`}
			/>
		</div>
	);
}
