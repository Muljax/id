import { ChevronDown } from "lucide-react";

import Badge from "@/components/ui/Badge";
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
		<div
			id={`user-row-${user.id}`}
			className={`transition-colors ${
				isTarget ? "bg-violet-500/[0.05] ring-1 ring-violet-500/30" : ""
			}`}
		>
			<button
				type="button"
				onClick={onToggle}
				className="w-full p-5 sm:p-6 text-left transition-colors hover:bg-white/[0.02] cursor-pointer"
			>
				<div className="flex items-center gap-4">
					<UserAvatar user={user} />

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<span className="truncate text-sm font-medium text-white">
								{name}
							</span>
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
						</div>
						<div className="mt-0.5 truncate text-xs text-zinc-400">
							{user.email}
						</div>
					</div>

					<div className="hidden sm:flex items-center gap-2">
						<Badge variant={status.variant} size="sm">
							{status.label}
						</Badge>

						<Badge
							variant={user.emailVerifiedAt ? "info" : "default"}
							size="sm"
						>
							{user.emailVerifiedAt ? "Verified" : "Unverified"}
						</Badge>
					</div>

					<ChevronDown
						size={16}
						className={`text-zinc-500 transition-transform duration-200 ${
							expanded ? "rotate-180" : ""
						}`}
					/>
				</div>
			</button>

			{expanded && (
				<UserDetails
					user={user}
					isSelf={isSelf}
					onResetPassword={onResetPassword}
					onManageLifecycle={onManageLifecycle}
					onManageRoles={onManageRoles}
				/>
			)}
		</div>
	);
}
