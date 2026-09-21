import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import PermissionCategoryGrid from "@/components/roles/PermissionCategoryGrid";
import Input from "@/components/ui/Input";
import Modal, { ModalErrorAlert, ModalFooter } from "@/components/ui/Modal";
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

const PRINCIPAL_REGEX = /^[a-zA-Z0-9_.][a-zA-Z0-9_.-]{0,63}$/;

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
	"ssh:principal:*": ["ssh:ca:read", "ssh:cert:issue"],
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
	if (permId.startsWith("ssh:principal:")) {
		const prereqs = ["ssh:ca:read", "ssh:cert:issue"];
		return validPermSet ? prereqs.filter((p) => validPermSet.has(p)) : prereqs;
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

	const customPrincipals = useMemo(
		() =>
			selectedPermissions
				.filter(
					(p) => p.startsWith("ssh:principal:") && p !== "ssh:principal:*",
				)
				.map((p) => p.slice("ssh:principal:".length)),
		[selectedPermissions],
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

	function getActiveDependents(permId: string): string[] {
		return selectedPermissions.filter((selectedId) =>
			isDependentOn(
				selectedId,
				permId,
				validPermSet.size > 0 ? validPermSet : undefined,
			),
		);
	}

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

	function handleAddPrincipal(principal: string) {
		const permId =
			principal === "*" ? "ssh:principal:*" : `ssh:principal:${principal}`;
		const prereqs = getPrerequisites(
			permId,
			validPermSet.size > 0 ? validPermSet : undefined,
		);
		setSelectedPermissions((current) =>
			Array.from(new Set([...current, permId, ...prereqs])),
		);
	}

	function handleRemovePrincipal(principalName: string) {
		const permId = `ssh:principal:${principalName}`;
		togglePermission(permId);
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
			const isValidPermission = (p: string) =>
				validPermSet.has(p) ||
				(p.startsWith("ssh:principal:") &&
					PRINCIPAL_REGEX.test(p.slice("ssh:principal:".length)));

			const sanitizedPermissions =
				validPermSet.size > 0
					? selectedPermissions.filter(isValidPermission)
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
				<ModalErrorAlert error={error} />

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
						<PermissionCategoryGrid
							categories={permData?.categories ?? {}}
							selectedPermissions={selectedPermissions}
							customPrincipals={customPrincipals}
							onTogglePermission={togglePermission}
							onToggleCategory={toggleCategory}
							onAddPrincipal={handleAddPrincipal}
							onRemovePrincipal={handleRemovePrincipal}
							getActiveDependents={getActiveDependents}
						/>
					)}
				</div>

				<ModalFooter
					onCancel={onClose}
					cancelLabel="Cancel"
					submitLabel={isEditing ? "Save changes" : "Create role"}
					submitVariant="primary"
					submitIcon={<Shield size={14} />}
					loading={saveMutation.isPending}
				/>
			</form>
		</Modal>
	);
}
