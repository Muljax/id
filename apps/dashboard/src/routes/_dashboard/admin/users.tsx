import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import CreateUserModal from "@/components/users/CreateUserModal";
import ResetPasswordModal from "@/components/users/ResetPasswordModal";
import UserLifecycleModal from "@/components/users/UserLifecycleModal";
import UserRolesModal from "@/components/users/UserRolesModal";
import UserRow from "@/components/users/UserRow";
import { PermissionGuard, useAuth } from "@/context/AuthContext";
import { getUsers, type AdminUser } from "@/lib/api/admin";
import { INSTANCE_NAME } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";

export interface UsersSearch {
	userId?: string;
}

export const Route = createFileRoute("/_dashboard/admin/users")({
	validateSearch: (search: Record<string, unknown>): UsersSearch => ({
		userId: typeof search.userId === "string" ? search.userId : undefined,
	}),
	staticData: {
		navigation: {
			label: "Users",
			order: 30,
			requiredPermission: "users:read",
		},
	},
	component: UsersPageWrapper,
});

function UsersPageWrapper() {
	return (
		<PermissionGuard permission="users:read">
			<UsersPage />
		</PermissionGuard>
	);
}

function UsersPage() {
	const { userId } = Route.useSearch();
	const { user: currentUser, hasPermission } = useAuth();
	const canWriteUsers = hasPermission("users:write");
	const queryClient = useQueryClient();

	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [expandedUserId, setExpandedUserId] = useState<string | null>(
		userId ?? null,
	);
	const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(
		null,
	);
	const [lifecycleTargetUser, setLifecycleTargetUser] =
		useState<AdminUser | null>(null);
	const [rolesTargetUser, setRolesTargetUser] = useState<AdminUser | null>(
		null,
	);

	const {
		data: users = [],
		isLoading,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: queryKeys.admin.users,
		queryFn: async () => {
			const res = await getUsers();
			return res.users;
		},
	});

	useEffect(() => {
		if (userId) {
			setExpandedUserId(userId);
		}
	}, [userId]);

	useEffect(() => {
		if (userId && !isLoading && users.length > 0) {
			const element = document.getElementById(`user-row-${userId}`);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}, [userId, isLoading, users]);

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
				title="User directory"
				description={
					<>
						Browse and inspect all registered accounts within your{" "}
						<span className="text-violet-400 font-medium">{INSTANCE_NAME}</span>{" "}
						identity tenant.
					</>
				}
				actions={
					<div className="flex items-center gap-2.5">
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

						{canWriteUsers && (
							<Button
								type="button"
								variant="primary"
								size="sm"
								icon={<UserPlus size={14} />}
								onClick={() => setCreateModalOpen(true)}
							>
								Add user
							</Button>
						)}
					</div>
				}
			/>

			{users.length === 0 ? (
				<EmptyState
					icon={<Users size={24} />}
					title="No users found"
					description="No user accounts currently exist in this database."
				/>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold">
								Registered users
							</CardTitle>
							<Badge variant="default">{users.length} Total</Badge>
						</div>
					</CardHeader>

					<div className="divide-y divide-white/6">
						{users.map((user) => (
							<UserRow
								key={user.id}
								user={user}
								isSelf={currentUser?.id === user.id}
								expanded={expandedUserId === user.id}
								isTarget={userId === user.id}
								onToggle={() =>
									setExpandedUserId((current) =>
										current === user.id ? null : user.id,
									)
								}
								onResetPassword={(target) => setResetTargetUser(target)}
								onManageLifecycle={(target) => setLifecycleTargetUser(target)}
								onManageRoles={(target) => setRolesTargetUser(target)}
							/>
						))}
					</div>
				</Card>
			)}

			{rolesTargetUser && (
				<UserRolesModal
					user={rolesTargetUser}
					onClose={() => setRolesTargetUser(null)}
				/>
			)}

			{resetTargetUser && (
				<ResetPasswordModal
					user={resetTargetUser}
					onClose={() => setResetTargetUser(null)}
				/>
			)}

			{lifecycleTargetUser && (
				<UserLifecycleModal
					user={lifecycleTargetUser}
					isSelf={currentUser?.id === lifecycleTargetUser.id}
					onClose={() => setLifecycleTargetUser(null)}
					onSuccess={() => {
						setLifecycleTargetUser(null);
						void queryClient.invalidateQueries({
							queryKey: queryKeys.admin.users,
						});
					}}
				/>
			)}

			{createModalOpen && (
				<CreateUserModal
					open={createModalOpen}
					onClose={() => setCreateModalOpen(false)}
					onSuccess={() => {
						void queryClient.invalidateQueries({
							queryKey: queryKeys.admin.users,
						});
					}}
				/>
			)}
		</div>
	);
}
