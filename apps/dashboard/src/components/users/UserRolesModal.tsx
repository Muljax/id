import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Modal, { ModalErrorAlert, ModalFooter } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser } from "@/lib/api/admin";
import {
	getRoles,
	getUserPermissions,
	getUserRoles,
	setUserRoles,
} from "@/lib/api/rbac";
import { queryKeys } from "@/lib/queryKeys";

interface UserRolesModalProps {
	user: AdminUser;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function UserRolesModal({
	user,
	onClose,
	onSuccess,
}: UserRolesModalProps) {
	const queryClient = useQueryClient();
	const { user: currentUser } = useAuth();
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
	const [showPermissions, setShowPermissions] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { data: allRolesData, isLoading: rolesLoading } = useQuery({
		queryKey: queryKeys.admin.roles,
		queryFn: getRoles,
	});

	const { data: userRolesData, isLoading: userRolesLoading } = useQuery({
		queryKey: queryKeys.admin.userRoles(user.id),
		queryFn: () => getUserRoles(user.id),
	});

	const { data: userPermsData } = useQuery({
		queryKey: queryKeys.admin.userPermissions(user.id),
		queryFn: () => getUserPermissions(user.id),
		enabled: showPermissions,
	});

	useEffect(() => {
		if (userRolesData?.roles) {
			setSelectedRoleIds(userRolesData.roles.map((r) => r.roleId));
		}
	}, [userRolesData]);

	function toggleRole(roleId: string) {
		setSelectedRoleIds((current) =>
			current.includes(roleId)
				? current.filter((id) => id !== roleId)
				: [...current, roleId],
		);
	}

	const saveMutation = useMutation({
		mutationFn: () => setUserRoles(user.id, selectedRoleIds),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.admin.userRoles(user.id),
			});
			void queryClient.invalidateQueries({
				queryKey: queryKeys.admin.userPermissions(user.id),
			});
			void queryClient.invalidateQueries({
				queryKey: queryKeys.admin.users,
			});
			if (currentUser && currentUser.id === user.id) {
				void queryClient.invalidateQueries({
					queryKey: queryKeys.auth.me,
				});
			}
			onSuccess?.();
			onClose();
		},
		onError: (err: Error) => {
			setError(err.message || "Failed to update user roles.");
		},
	});

	const isLoading = rolesLoading || userRolesLoading;
	const allRoles = allRolesData?.roles ?? [];

	return (
		<Modal
			open={true}
			onClose={onClose}
			title={`Manage roles: ${user.displayName || user.email}`}
			description="Assign or revoke roles to define this user's permissions."
			size="lg"
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (!saveMutation.isPending && !isLoading) {
						saveMutation.mutate();
					}
				}}
				className="space-y-6"
			>
				<ModalErrorAlert error={error} />

				<div className="space-y-2">
					<div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
						Assigned roles ({selectedRoleIds.length})
					</div>

					{isLoading ? (
						<div className="flex justify-center py-8">
							<Spinner size="md" />
						</div>
					) : (
						<div className="divide-y divide-white/6 rounded-xl border border-white/8 bg-zinc-900/40">
							{allRoles.map((role) => {
								const checked = selectedRoleIds.includes(role.id);

								return (
									<button
										key={role.id}
										type="button"
										onClick={() => toggleRole(role.id)}
										className={`flex w-full items-start gap-3.5 p-3.5 text-left transition-colors cursor-pointer ${
											checked ? "bg-violet-500/[0.06]" : "hover:bg-white/[0.02]"
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
											<div className="flex items-center gap-2">
												<span className="text-xs font-medium text-white">
													{role.name}
												</span>
												{role.isSystem && (
													<Badge variant="default" size="sm">
														System
													</Badge>
												)}
											</div>

											{role.description && (
												<p className="mt-0.5 text-xs text-zinc-400">
													{role.description}
												</p>
											)}
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Effective permissions accordion */}
				<div className="rounded-xl border border-white/8 bg-zinc-900/40 p-4">
					<button
						type="button"
						onClick={() => setShowPermissions((prev) => !prev)}
						className="flex w-full items-center justify-between text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
					>
						<span>View effective permissions</span>
						<ChevronDown
							size={14}
							className={`text-zinc-500 transition-transform duration-200 ${
								showPermissions ? "rotate-180" : ""
							}`}
						/>
					</button>

					{showPermissions && (
						<div className="mt-3 border-t border-white/6 pt-3">
							{!userPermsData ? (
								<div className="flex justify-center py-4">
									<Spinner size="sm" />
								</div>
							) : userPermsData.permissions.length === 0 ? (
								<p className="text-xs text-zinc-500 italic">
									No effective permissions granted.
								</p>
							) : (
								<div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
									{userPermsData.permissions.map((perm) => (
										<span
											key={perm}
											className="rounded-md border border-white/6 bg-white/[0.03] px-2 py-0.5 font-mono text-xs text-violet-300"
										>
											{perm}
										</span>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				<ModalFooter
					onCancel={onClose}
					cancelLabel="Cancel"
					submitLabel="Save roles"
					submitVariant="primary"
					loading={saveMutation.isPending}
				/>
			</form>
		</Modal>
	);
}
