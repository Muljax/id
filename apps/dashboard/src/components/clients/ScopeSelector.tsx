import { useQuery } from "@tanstack/react-query";
import {
	Check,
	ChevronDown,
	ChevronRight,
	Plus,
	Search,
	Shield,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { getPermissions } from "@/lib/api/rbac";
import { queryKeys } from "@/lib/queryKeys";

export const STANDARD_OIDC_SCOPES = [
	{
		id: "openid",
		label: "openid",
		description: "Grants access to user identity and unique subject ID (sub).",
		requiredForUserApps: true,
	},
	{
		id: "profile",
		label: "profile",
		description:
			"Grants read access to name, avatar, timezone, and profile fields.",
		requiredForUserApps: false,
	},
	{
		id: "email",
		label: "email",
		description:
			"Grants read access to user email address and verification state.",
		requiredForUserApps: false,
	},
	{
		id: "offline_access",
		label: "offline_access",
		description:
			"Enables issuing refresh tokens for long-lived offline sessions.",
		requiredForUserApps: false,
	},
] as const;

interface ScopeSelectorProps {
	profile: "web_app" | "spa_native" | "m2m_service";
	scopes: string[];
	onChange: (scopes: string[]) => void;
	disabled?: boolean;
}

/**
 * UI selector for choosing standard OIDC scopes, platform capability permissions,
 * or managing custom granular application scopes across Web, SPA, and M2M clients.
 */
export default function ScopeSelector({
	profile,
	scopes,
	onChange,
	disabled = false,
}: ScopeSelectorProps) {
	const [customInput, setCustomInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedCategories, setExpandedCategories] = useState<
		Record<string, boolean>
	>({
		ssh: true,
		users: true,
	});

	const { data: permData, isLoading: permsLoading } = useQuery({
		queryKey: queryKeys.admin.permissions,
		queryFn: getPermissions,
	});

	const isUserFacing = profile === "web_app" || profile === "spa_native";

	function toggleScope(scopeId: string) {
		if (profile === "spa_native" && scopeId === "openid") {
			return; // Public clients must retain openid
		}
		if (scopes.includes(scopeId)) {
			onChange(scopes.filter((s) => s !== scopeId));
		} else {
			onChange([...scopes, scopeId]);
		}
	}

	function addCustomScope() {
		const trimmed = customInput.trim();
		if (!trimmed) return;
		if (!/^[a-zA-Z0-9_:.*-]+$/.test(trimmed)) {
			return;
		}
		if (!scopes.includes(trimmed)) {
			onChange([...scopes, trimmed]);
		}
		setCustomInput("");
	}

	function removeScope(scope: string) {
		if (profile === "spa_native" && scope === "openid") {
			return;
		}
		onChange(scopes.filter((s) => s !== scope));
	}

	function toggleCategory(categoryPermIds: string[]) {
		const allSelected = categoryPermIds.every((id) => scopes.includes(id));
		if (allSelected) {
			onChange(scopes.filter((s) => !categoryPermIds.includes(s)));
		} else {
			const toAdd = categoryPermIds.filter((id) => !scopes.includes(id));
			onChange([...scopes, ...toAdd]);
		}
	}

	function toggleCategoryAccordion(category: string) {
		setExpandedCategories((prev) => ({
			...prev,
			[category]: !prev[category],
		}));
	}

	const filteredCategories = useMemo(() => {
		if (!permData?.categories) return {};
		if (!searchQuery.trim()) return permData.categories;

		const q = searchQuery.toLowerCase().trim();
		const result: Record<string, typeof permData.permissions> = {};

		for (const [cat, items] of Object.entries(permData.categories)) {
			const matching = items.filter(
				(item) =>
					item.id.toLowerCase().includes(q) ||
					item.name.toLowerCase().includes(q) ||
					item.description?.toLowerCase().includes(q),
			);
			if (matching.length > 0) {
				result[cat] = matching;
			}
		}

		return result;
	}, [permData, searchQuery]);

	return (
		<div className="space-y-4">
			{/* Currently Selected Scopes Summary */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
						Assigned Scopes ({scopes.length})
					</p>
					{scopes.length > 0 && (
						<button
							type="button"
							onClick={() => {
								if (profile === "spa_native") {
									onChange(["openid"]);
								} else {
									onChange([]);
								}
							}}
							disabled={disabled}
							className="text-[11px] text-zinc-400 hover:text-white cursor-pointer transition-colors"
						>
							Clear all
						</button>
					)}
				</div>

				<div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-white/8 bg-zinc-950/60 min-h-[44px] items-center">
					{scopes.length === 0 ? (
						<span className="text-xs text-zinc-500 italic pl-1">
							No scopes selected yet. Choose standard scopes or platform
							permissions below.
						</span>
					) : (
						scopes.map((scope) => {
							const isMandatory =
								profile === "spa_native" && scope === "openid";
							return (
								<span
									key={scope}
									className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-mono text-violet-200"
								>
									{scope}
									{!isMandatory && !disabled && (
										<button
											type="button"
											onClick={() => removeScope(scope)}
											className="text-violet-400 hover:text-white transition-colors cursor-pointer ml-0.5"
											title={`Remove ${scope}`}
										>
											<X size={11} />
										</button>
									)}
								</span>
							);
						})
					)}
				</div>
			</div>

			{/* Standard OIDC Scopes */}
			{isUserFacing && (
				<div className="space-y-2.5 rounded-xl border border-white/8 bg-zinc-900/30 p-3.5">
					<div className="flex items-center justify-between border-b border-white/6 pb-2">
						<span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
							Standard OpenID Connect Scopes
						</span>
						<span className="text-[11px] text-zinc-500">Identity & claims</span>
					</div>

					<div className="grid gap-2 sm:grid-cols-2">
						{STANDARD_OIDC_SCOPES.map((item) => {
							const isChecked = scopes.includes(item.id);
							const isRequired =
								profile === "spa_native" && item.requiredForUserApps;

							return (
								<button
									key={item.id}
									type="button"
									disabled={isRequired || disabled}
									onClick={() => toggleScope(item.id)}
									className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
										isChecked
											? "border-emerald-500/40 bg-emerald-500/10 text-white"
											: "border-white/6 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-zinc-200"
									} ${isRequired ? "opacity-90 cursor-not-allowed" : ""}`}
								>
									<div
										className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
											isChecked
												? "border-emerald-400 bg-emerald-500 text-white"
												: "border-zinc-600 bg-transparent"
										}`}
									>
										{isChecked && <Check size={12} strokeWidth={3} />}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-1.5">
											<span className="font-mono text-xs font-medium text-white truncate">
												{item.label}
											</span>
											{isRequired && (
												<span className="text-[9px] font-medium text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded">
													Required
												</span>
											)}
										</div>
										<p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
											{item.description}
										</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Platform & Capability Scopes Catalog */}
			<div className="space-y-3 rounded-xl border border-white/8 bg-zinc-900/30 p-3.5">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/6 pb-2.5">
					<div>
						<div className="flex items-center gap-2">
							<Shield size={14} className="text-violet-400" />
							<span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
								Platform & Capability Permissions
							</span>
						</div>
						<p className="text-[11px] text-zinc-400 mt-0.5">
							Grant client permission to request SSH certificates, manage keys,
							or access platform APIs.
						</p>
					</div>

					<div className="relative w-full sm:w-48 flex items-center">
						<Search
							size={13}
							className="absolute left-2.5 text-zinc-500 pointer-events-none"
						/>
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search permissions..."
							className="pl-8 text-xs py-1 h-8"
						/>
					</div>
				</div>

				{permsLoading ? (
					<div className="flex justify-center py-6">
						<Spinner size="sm" />
					</div>
				) : Object.keys(filteredCategories).length === 0 ? (
					<p className="text-xs text-zinc-500 italic py-2 text-center">
						No matching permissions found.
					</p>
				) : (
					<div className="max-h-[32vh] overflow-y-auto space-y-3 pr-1">
						{Object.entries(filteredCategories).map(
							([category, categoryPerms]) => {
								const permIds = categoryPerms.map((p) => p.id);
								const allSelected = permIds.every((id) => scopes.includes(id));
								const isExpanded =
									searchQuery.trim().length > 0 ||
									Boolean(expandedCategories[category]);

								return (
									<div
										key={category}
										className="rounded-lg border border-white/6 bg-zinc-950/40 overflow-hidden"
									>
										<div className="flex items-center justify-between p-2.5 bg-white/[0.02]">
											<button
												type="button"
												onClick={() => toggleCategoryAccordion(category)}
												className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
											>
												{isExpanded ? (
													<ChevronDown size={14} className="text-zinc-500" />
												) : (
													<ChevronRight size={14} className="text-zinc-500" />
												)}
												<span className="uppercase tracking-wider font-semibold text-xs">
													{category.replace("_", " ")}
												</span>
												<span className="text-[10px] text-zinc-500 font-mono">
													({categoryPerms.length})
												</span>
											</button>

											<button
												type="button"
												disabled={disabled}
												onClick={() => toggleCategory(permIds)}
												className="text-[11px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors"
											>
												{allSelected
													? "Clear section"
													: "Select all in section"}
											</button>
										</div>

										{isExpanded && (
											<div className="p-2.5 pt-1.5 grid gap-1.5 sm:grid-cols-2 border-t border-white/4">
												{categoryPerms.map((perm) => {
													const checked = scopes.includes(perm.id);

													return (
														<button
															key={perm.id}
															type="button"
															disabled={disabled}
															onClick={() => toggleScope(perm.id)}
															className={`flex items-start gap-2 rounded-lg border p-2 text-left transition-colors cursor-pointer ${
																checked
																	? "border-violet-500/40 bg-violet-500/10 text-white"
																	: "border-white/6 bg-white/[0.01] text-zinc-400 hover:border-white/10 hover:text-zinc-200"
															}`}
														>
															<div
																className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
																	checked
																		? "border-violet-400 bg-violet-500 text-white"
																		: "border-zinc-600 bg-transparent"
																}`}
															>
																{checked && <Check size={10} strokeWidth={3} />}
															</div>
															<div className="min-w-0 flex-1">
																<span className="font-mono text-xs font-medium text-white block truncate">
																	{perm.id}
																</span>
																<span className="text-[10px] text-zinc-400 block truncate">
																	{perm.name}
																</span>
															</div>
														</button>
													);
												})}
											</div>
										)}
									</div>
								);
							},
						)}
					</div>
				)}
			</div>

			{/* Custom Scope Input */}
			<div className="space-y-2">
				<label
					htmlFor="custom-scope-input"
					className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
				>
					Add Custom Scope
				</label>
				<div className="flex gap-2">
					<Input
						id="custom-scope-input"
						value={customInput}
						onChange={(e) => setCustomInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addCustomScope();
							}
						}}
						placeholder="Enter custom scope (e.g. read:reports, billing:manage)"
						disabled={disabled}
						className="text-xs font-mono h-9"
					/>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						disabled={!customInput.trim() || disabled}
						onClick={addCustomScope}
						icon={<Plus size={14} />}
					>
						Add
					</Button>
				</div>
			</div>
		</div>
	);
}
