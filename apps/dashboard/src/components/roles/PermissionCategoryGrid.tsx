import { Check } from "lucide-react";

import CustomPrincipalManager from "@/components/roles/CustomPrincipalManager";
import type { Permission } from "@/lib/api/rbac";

interface PermissionCategoryGridProps {
	categories: Record<string, Permission[]>;
	selectedPermissions: string[];
	customPrincipals: string[];
	onTogglePermission: (permId: string) => void;
	onToggleCategory: (categoryPermIds: string[]) => void;
	onAddPrincipal: (principal: string) => void;
	onRemovePrincipal: (principal: string) => void;
	getActiveDependents: (permId: string) => string[];
}

export default function PermissionCategoryGrid({
	categories,
	selectedPermissions,
	customPrincipals,
	onTogglePermission,
	onToggleCategory,
	onAddPrincipal,
	onRemovePrincipal,
	getActiveDependents,
}: PermissionCategoryGridProps) {
	return (
		<div className="max-h-[45vh] overflow-y-auto space-y-4 pr-1">
			{Object.entries(categories).map(([category, categoryPerms]) => {
				const permIds = categoryPerms.map((p) => p.id);
				const allSelected = permIds.every((id) =>
					selectedPermissions.includes(id),
				);

				return (
					<div
						key={category}
						className="rounded-xl border border-white/8 bg-zinc-900/40 p-3.5 space-y-2.5"
					>
						<div className="flex items-center justify-between border-b border-white/6 pb-2">
							<span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
								{category.replace("_", " ")}
							</span>
							<button
								type="button"
								onClick={() => onToggleCategory(permIds)}
								className="text-[11px] text-zinc-400 hover:text-white cursor-pointer transition-colors"
							>
								{allSelected ? "Clear section" : "Select section"}
							</button>
						</div>

						<div className="grid gap-2 sm:grid-cols-2">
							{categoryPerms.map((perm) => {
								const checked = selectedPermissions.includes(perm.id);
								const requiredBy = checked ? getActiveDependents(perm.id) : [];

								return (
									<button
										key={perm.id}
										type="button"
										onClick={() => onTogglePermission(perm.id)}
										className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
											checked
												? "border-violet-500/40 bg-violet-500/10 text-white"
												: "border-white/6 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-zinc-200"
										}`}
									>
										<div
											className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
												checked
													? "border-violet-400 bg-violet-500 text-white"
													: "border-zinc-600 bg-transparent"
											}`}
										>
											{checked && <Check size={12} strokeWidth={3} />}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-1.5">
												<span className="font-mono text-xs font-medium text-white truncate">
													{perm.id}
												</span>
												{requiredBy.length > 0 && (
													<span className="text-[10px] text-violet-400 font-medium shrink-0">
														Required by{" "}
														{requiredBy
															.map((p) => p.split(":")[1] || p)
															.join(", ")}
													</span>
												)}
											</div>
											<div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
												{perm.name}
											</div>
										</div>
									</button>
								);
							})}
						</div>

						{category === "ssh" && (
							<CustomPrincipalManager
								principals={customPrincipals}
								onAddPrincipal={onAddPrincipal}
								onRemovePrincipal={onRemovePrincipal}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
