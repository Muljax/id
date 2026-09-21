import Badge from "@/components/ui/Badge";
import EntityRow from "@/components/ui/EntityRow";
import UserAvatar from "@/components/users/UserAvatar";
import UserDetails from "@/components/users/UserDetails";
import { getUserStatus } from "@/components/users/status";
import type { AdminUser } from "@/lib/api/admin";

interface UserRowProps {
	user: AdminUser;
	isSelf: boolean;
	expanded: boolean;
	isTarget: boolean;
	onToggle: () => void;
	onResetPassword: (user: AdminUser) => void;
	onManageLifecycle: (user: AdminUser) => void;
	onManageRoles: (user: AdminUser) => void;
	onManageSessions?: (user: AdminUser) => void;
	onDeleteUser?: (user: AdminUser) => void;
}

export default function UserRow({
	user,
	isSelf,
	expanded,
	isTarget,
	onToggle,
	onResetPassword,
	onManageLifecycle,
	onManageRoles,
	onManageSessions,
	onDeleteUser,
}: UserRowProps) {
	const name = user.displayName || user.email;
	const status = getUserStatus(user);
	const isAdministrator = Boolean(
		user.roleIds?.includes("admin") ||
			user.roles?.some(
				(r) =>
					r.toLowerCase() === "admin" || r.toLowerCase() === "administrator",
			),
	);

	return (
		<EntityRow
			id={`user-row-${user.id}`}
			isTarget={isTarget}
			onClick={onToggle}
			expandable={true}
			expanded={expanded}
			avatar={<UserAvatar user={user} />}
			title={
				<span className="truncate text-sm font-medium text-white">{name}</span>
			}
			subtitle={user.email}
			badges={
				<>
					{isAdministrator && (
						<Badge variant="violet" size="sm">
							Admin
						</Badge>
					)}
					{isSelf && (
						<Badge variant="default" size="sm">
							You
						</Badge>
					)}
				</>
			}
			actions={
				<div className="hidden sm:flex items-center gap-2">
					<Badge variant={status.variant} size="sm">
						{status.label}
					</Badge>

					<Badge variant={user.emailVerifiedAt ? "info" : "default"} size="sm">
						{user.emailVerifiedAt ? "Verified" : "Unverified"}
					</Badge>
				</div>
			}
		>
			{expanded && (
				<UserDetails
					user={user}
					isSelf={isSelf}
					onResetPassword={onResetPassword}
					onManageLifecycle={onManageLifecycle}
					onManageRoles={onManageRoles}
					onManageSessions={onManageSessions}
					onDeleteUser={onDeleteUser}
				/>
			)}
		</EntityRow>
	);
}
