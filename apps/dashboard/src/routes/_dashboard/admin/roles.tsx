import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus, RefreshCw, Shield } from "lucide-react";
import { useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import DeleteRoleModal from "@/components/roles/DeleteRoleModal";
import PermissionsCatalogModal from "@/components/roles/PermissionsCatalogModal";
import RoleModal from "@/components/roles/RoleModal";
import RoleRow from "@/components/roles/RoleRow";
import { PermissionGuard, useAuth } from "@/context/AuthContext";
import { getRoles, type Role } from "@/lib/api/rbac";
import { INSTANCE_NAME } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";

export const Route = createFileRoute("/_dashboard/admin/roles")({
	staticData: {
		navigation: {
			label: "Roles & Permissions",
			order: 40,
			requiredPermission: "roles:read",
		},
	},
	component: RolesPageWrapper,
});

function RolesPageWrapper() {
	return (
		<PermissionGuard permission="roles:read">
			<RolesPage />
		</PermissionGuard>
	);
}

function RolesPage() {
	const { hasPermission } = useAuth();
	const canWriteRoles = hasPermission("roles:write");
	const canReadPermissions = hasPermission("permissions:read");

	const [createOpen, setCreateOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [deletingRole, setDeletingRole] = useState<Role | null>(null);
	const [catalogOpen, setCatalogOpen] = useState(false);

	const { data, isLoading, isFetching, refetch } = useQuery({
		queryKey: queryKeys.admin.roles,
		queryFn: getRoles,
	});

	const roles = data?.roles ?? [];

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="Roles & permissions"
				description={
					<>
						Manage custom roles, scope assignments, and access policies for{" "}
						<span className="text-violet-400 font-medium">{INSTANCE_NAME}</span>
						.
					</>
				}
				actions={
					<div className="flex items-center gap-2.5">
						{canReadPermissions && (
							<Button
								type="button"
								variant="secondary"
								size="sm"
								icon={<BookOpen size={14} />}
								onClick={() => setCatalogOpen(true)}
							>
								Permissions Catalog
							</Button>
						)}

						<Button
							type="button"
							variant="secondary"
							size="sm"
							loading={isFetching && !isLoading}
							onClick={() => {
								void refetch();
							}}
							icon={<RefreshCw size={14} />}
						>
							Refresh
						</Button>

						{canWriteRoles && (
							<Button
								type="button"
								variant="primary"
								size="sm"
								icon={<Plus size={14} />}
								onClick={() => setCreateOpen(true)}
							>
								Create role
							</Button>
						)}
					</div>
				}
			/>

			{roles.length === 0 ? (
				<EmptyState
					icon={<Shield size={24} />}
					title="No roles configured"
					description="No roles exist in the database yet. Default roles will be initialized automatically."
					action={
						canWriteRoles ? (
							<Button
								type="button"
								variant="primary"
								size="sm"
								icon={<Plus size={14} />}
								onClick={() => setCreateOpen(true)}
							>
								Create first role
							</Button>
						) : undefined
					}
				/>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold">
								Defined roles
							</CardTitle>
							<Badge variant="default">{roles.length} Total</Badge>
						</div>
					</CardHeader>

					<div className="divide-y divide-white/6">
						{roles.map((role) => (
							<RoleRow
								key={role.id}
								role={role}
								canEdit={canWriteRoles}
								canDelete={canWriteRoles}
								onEdit={(r) => setEditingRole(r)}
								onDelete={(r) => setDeletingRole(r)}
							/>
						))}
					</div>
				</Card>
			)}

			{createOpen && (
				<RoleModal open={createOpen} onClose={() => setCreateOpen(false)} />
			)}

			{editingRole && (
				<RoleModal
					open={true}
					role={editingRole}
					onClose={() => setEditingRole(null)}
				/>
			)}

			{deletingRole && (
				<DeleteRoleModal
					role={deletingRole}
					onClose={() => setDeletingRole(null)}
				/>
			)}

			{catalogOpen && (
				<PermissionsCatalogModal
					open={catalogOpen}
					onClose={() => setCatalogOpen(false)}
				/>
			)}
		</div>
	);
}
