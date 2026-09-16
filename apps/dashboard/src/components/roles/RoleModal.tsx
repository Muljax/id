import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Shield } from "lucide-react";
import { useEffect, useState } from "react";

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

	useEffect(() => {
		if (!open) return;
		if (role) {
			setName(role.name);
			setDescription(role.description ?? "");
			setSelectedPermissions(role.permissions ?? []);
		} else {
			setName("");
			setDescription("");
			setSelectedPermissions([]);
		}
		setError(null);
	}, [role, open]);

	function togglePermission(permId: string) {
		setSelectedPermissions((current) =>
			current.includes(permId)
				? current.filter((id) => id !== permId)
				: [...current, permId],
		);
	}

	function toggleCategory(categoryPermIds: string[]) {
		const allSelected = categoryPermIds.every((id) =>
			selectedPermissions.includes(id),
		);
		if (allSelected) {
			setSelectedPermissions((current) =>
				current.filter((id) => !categoryPermIds.includes(id)),
			);
		} else {
			setSelectedPermissions((current) =>
				Array.from(new Set([...current, ...categoryPermIds])),
			);
		}
	}

	const saveMutation = useMutation({
		mutationFn: async () => {
			setError(null);
			if (isEditing && role) {
				return updateRole(role.id, {
					name: role.isSystem ? undefined : name,
					description,
					permissions: selectedPermissions,
				});
			}

			return createRole({
				name,
				description,
				permissions: selectedPermissions,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
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
						<span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
							Granted permissions ({selectedPermissions.length})
						</span>
						<button
							type="button"
							onClick={() => {
								if (selectedPermissions.length > 0) {
									setSelectedPermissions([]);
								} else if (permData?.permissions) {
									setSelectedPermissions(permData.permissions.map((p) => p.id));
								}
							}}
							className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer transition-colors"
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
																<div className="font-mono text-xs font-medium text-white truncate">
																	{perm.id}
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
