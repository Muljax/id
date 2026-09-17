import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import {
	createRole,
	getPermissions,
	type Role,
	updateRole,
} from "@/lib/api/rbac";
import { queryKeys } from "@/lib/queryKeys";

interface RoleModalProps {
	open: boolean;
	role?: Role | null;
	onClose: () => void;
	onSuccess?: () => void;
}

/**
 * Defines required prerequisite permissions for specific actions.
 * For instance, write or deletion operations require corresponding read access.
 */
const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
	"users:write": ["users:read"],
	"users:delete": ["users:read"],
	"users:lifecycle": ["users:read"],
	"users:password-reset": ["users:read"],
	"roles:write": ["roles:read", "permissions:read"],
	"roles:assign": ["roles:read"],
	"oauth_clients:write": ["oauth_clients:read"],
	"notifications:write": ["notifications:read"],
	"settings:write": ["settings:read"],
	"ssh:keys:manage": ["ssh:ca:read"],
	"ssh:cert:issue": ["ssh:ca:read"],
	"ssh:cert:revoke": ["ssh:ca:read"],
	"ssh:cert:list": ["ssh:ca:read"],
	"ssh:keys:admin": ["ssh:ca:read"],
};

function getPrerequisites(
	permId: string,
	validPermSet?: Set<string>,
): string[] {
	const explicit = PERMISSION_DEPENDENCIES[permId];
	if (explicit) {
		return validPermSet
			? explicit.filter((p) => validPermSet.has(p))
			: explicit;
	}
	const colonIndex = permId.indexOf(":");
	if (colonIndex !== -1) {
		const action = permId.slice(colonIndex + 1);
		if (action !== "read" && action !== "*") {
			const candidate = `${permId.slice(0, colonIndex)}:read`;
			if (!validPermSet || validPermSet.has(candidate)) {
				return [candidate];
			}
		}
	}
	return [];
}

function isDependentOn(
	depPerm: string,
	targetPerm: string,
	validPermSet?: Set<string>,
): boolean {
	const prereqs = getPrerequisites(depPerm, validPermSet);
	return prereqs.includes(targetPerm);
}

function getActiveDependents(
	permId: string,
	selected: string[],
	validPermSet?: Set<string>,
): string[] {
	return selected.filter((selectedId) =>
		isDependentOn(selectedId, permId, validPermSet),
	);
}

export default function RoleModal({
	open,
	role,
	onClose,
	onSuccess,
}: RoleModalProps) {
	const isEditing = Boolean(role);
	const queryClient = useQueryClient();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const { data: permData, isLoading: permsLoading } = useQuery({
		queryKey: queryKeys.admin.permissions,
		queryFn: getPermissions,
		enabled: open,
	});

	const validPermSet = useMemo(
		() => new Set(permData?.permissions.map((p) => p.id) ?? []),
		[permData],
	);

	useEffect(() => {
		if (!open) return;
		if (role) {
			setName(role.name);
			setDescription(role.description ?? "");
			const perms = new Set(role.permissions ?? []);
			// Ensure any prerequisites for existing permissions are satisfied
			for (const p of role.permissions ?? []) {
				for (const prereq of getPrerequisites(
					p,
					validPermSet.size > 0 ? validPermSet : undefined,
				)) {
					perms.add(prereq);
				}
			}
			setSelectedPermissions(Array.from(perms));
		} else {
			setName("");
			setDescription("");
			setSelectedPermissions([]);
		}
		setError(null);
	}, [role, open, validPermSet]);

	function togglePermission(permId: string) {
		setSelectedPermissions((current) => {
			const isSelected = current.includes(permId);

			if (isSelected) {
				// Deselecting: also remove anything currently selected that depends on this permission
				const toRemove = new Set<string>([permId]);
				for (const id of current) {
					if (
						isDependentOn(
							id,
							permId,
							validPermSet.size > 0 ? validPermSet : undefined,
						)
					) {
						toRemove.add(id);
					}
				}
				return current.filter((id) => !toRemove.has(id));
			}

			// Selecting: also add all prerequisites
			const prereqs = getPrerequisites(
				permId,
				validPermSet.size > 0 ? validPermSet : undefined,
			);
			return Array.from(new Set([...current, permId, ...prereqs]));
		});
	}

	function toggleCategory(categoryPermIds: string[]) {
		const allSelected = categoryPermIds.every((id) =>
			selectedPermissions.includes(id),
		);
		if (allSelected) {
			const toRemove = new Set<string>(categoryPermIds);
			for (const id of categoryPermIds) {
				for (const selectedId of selectedPermissions) {
					if (
						isDependentOn(
							selectedId,
							id,
							validPermSet.size > 0 ? validPermSet : undefined,
						)
					) {
						toRemove.add(selectedId);
					}
				}
			}
			setSelectedPermissions((current) =>
				current.filter((id) => !toRemove.has(id)),
			);
		} else {
			const toAdd = new Set<string>(categoryPermIds);
			for (const id of categoryPermIds) {
				for (const p of getPrerequisites(
					id,
					validPermSet.size > 0 ? validPermSet : undefined,
				)) {
					toAdd.add(p);
				}
			}
			setSelectedPermissions((current) =>
				Array.from(new Set([...current, ...toAdd])),
			);
		}
	}

	const saveMutation = useMutation({
		mutationFn: async () => {
			setError(null);
			const sanitizedPermissions =
				validPermSet.size > 0
					? selectedPermissions.filter((p) => validPermSet.has(p))
					: selectedPermissions;

			if (isEditing && role) {
				return updateRole(role.id, {
					name: role.isSystem ? undefined : name,
					description,
					permissions: sanitizedPermissions,
				});
			}

			return createRole({
				name,
				description,
				permissions: sanitizedPermissions,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
			void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
			onSuccess?.();
			onClose();
		},
		onError: (err: Error) => {
			setError(err.message || "Failed to save role.");
		},
	});

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={isEditing ? `Edit role: ${role?.name}` : "Create new role"}
			description={
				isEditing
					? "Update role details and granted permissions."
					: "Define a new custom role with granular permissions."
			}
			size="xl"
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					saveMutation.mutate();
				}}
				className="space-y-6"
			>
				{error && (
					<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
						{error}
					</div>
				)}

				<div className="space-y-4">
					<div className="space-y-1.5">
						<label
							htmlFor="role-name"
							className="block text-sm font-medium text-zinc-300"
						>
							Role name
						</label>
						<Input
							id="role-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. security_auditor"
							required
							disabled={role?.isSystem}
						/>
						{role?.isSystem && (
							<p className="text-xs text-zinc-500">
								System role names cannot be modified.
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="role-description"
							className="block text-sm font-medium text-zinc-300"
						>
							Description (optional)
						</label>
						<Textarea
							id="role-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the responsibilities and access level of this role..."
							rows={2}
						/>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div>
							<span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
								Granted permissions ({selectedPermissions.length})
							</span>
							<p className="text-[11px] text-zinc-500 mt-0.5">
								Write and management permissions automatically include required
								read access.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								if (selectedPermissions.length > 0) {
									setSelectedPermissions([]);
								} else if (permData?.permissions) {
									setSelectedPermissions(permData.permissions.map((p) => p.id));
								}
							}}
							className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer transition-colors shrink-0"
						>
							{selectedPermissions.length > 0 ? "Deselect all" : "Select all"}
						</button>
					</div>

					{permsLoading ? (
						<div className="flex justify-center py-8">
							<Spinner size="md" />
						</div>
					) : (
						<div className="max-h-[45vh] overflow-y-auto space-y-4 pr-1">
							{Object.entries(permData?.categories ?? {}).map(
								([category, categoryPerms]) => {
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
													onClick={() => toggleCategory(permIds)}
													className="text-[11px] text-zinc-400 hover:text-white cursor-pointer transition-colors"
												>
													{allSelected ? "Clear section" : "Select section"}
												</button>
											</div>

											<div className="grid gap-2 sm:grid-cols-2">
												{categoryPerms.map((perm) => {
													const checked = selectedPermissions.includes(perm.id);
													const requiredBy = checked
														? getActiveDependents(perm.id, selectedPermissions)
														: [];

													return (
														<button
															key={perm.id}
															type="button"
															onClick={() => togglePermission(perm.id)}
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
										</div>
									);
								},
							)}
						</div>
					)}
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
					<Button
						type="button"
						variant="ghost"
						onClick={onClose}
						disabled={saveMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						loading={saveMutation.isPending}
						icon={<Shield size={14} />}
					>
						{isEditing ? "Save changes" : "Create role"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
