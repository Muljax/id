import { KeyRound, UserCheck, UserX } from "lucide-react";

import Button from "@/components/ui/Button";
import { getUserStatus } from "@/components/users/status";
import type { AdminUser } from "@/lib/api/admin";

export default function UserDetails({
	user,
	isSelf,
	onResetPassword,
	onManageLifecycle,
}: {
	user: AdminUser;
	isSelf: boolean;
	onResetPassword: (user: AdminUser) => void;
	onManageLifecycle: (user: AdminUser) => void;
}) {
	const status = getUserStatus(user);
	const statusText =
		user.disabledAt != null
			? status.isDisabled
				? `Disabled on ${new Date(user.disabledAt).toLocaleString()}`
				: `Scheduled to disable on ${new Date(user.disabledAt).toLocaleString()}`
			: "Active";

	const fields = [
		["User ID", user.id],
		["Email", user.email],
		["Display name", user.displayName],
		["Given name", user.givenName],
		["Family name", user.familyName],
		["Middle name", user.middleName],
		["Nickname", user.nickname],
		["Preferred username", user.preferredUsername],
		["Profile URL", user.profileUrl],
		["Website", user.website],
		["Gender", user.gender],
		["Birthdate", user.birthdate],
		["Time zone", user.zoneinfo],
		["Locale", user.locale],
		["Role", user.isAdmin ? "Administrator" : "Standard User"],
		["Account status", statusText],
		[
			"Email verified",
			user.emailVerifiedAt
				? new Date(user.emailVerifiedAt).toLocaleString()
				: "Unverified",
		],
		["Registered at", new Date(user.createdAt).toLocaleString()],
		["Updated at", new Date(user.updatedAt).toLocaleString()],
	] as const;

	return (
		<div className="border-t border-white/6 bg-white/[0.015] px-6 py-5">
			<div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
				{fields.map(([label, value]) => (
					<div key={label} className="min-w-0">
						<span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
							{label}
						</span>
						<p className="mt-1 truncate font-mono text-xs text-zinc-200">
							{value || "—"}
						</p>
					</div>
				))}
			</div>

			<div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-white/6 pt-4">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					icon={<KeyRound size={14} />}
					onClick={() => onResetPassword(user)}
				>
					Generate Password Reset Link
				</Button>

				{status.isDisabled ? (
					<Button
						type="button"
						variant="secondary"
						size="sm"
						icon={<UserCheck size={14} className="text-emerald-400" />}
						onClick={() => onManageLifecycle(user)}
					>
						Enable Account
					</Button>
				) : (
					<Button
						type="button"
						variant="danger"
						size="sm"
						disabled={isSelf}
						icon={<UserX size={14} />}
						onClick={() => onManageLifecycle(user)}
					>
						{status.isScheduled ? "Manage Deactivation" : "Disable Account"}
					</Button>
				)}
			</div>
		</div>
	);
}
