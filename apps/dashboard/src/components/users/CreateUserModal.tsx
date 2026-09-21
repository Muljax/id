import { useQuery } from "@tanstack/react-query";
import { Crown, Shield, Ticket, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import type { SelectOption } from "@/components/ui/Select";
import DirectUserTab from "@/components/users/DirectUserTab";
import InviteUserTab from "@/components/users/InviteUserTab";
import { getRoles } from "@/lib/api/rbac";
import { type SignupMode, getInstanceSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/queryKeys";

interface CreateUserModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function CreateUserModal({
	open,
	onClose,
	onSuccess,
}: CreateUserModalProps) {
	const { data: settingsData } = useQuery({
		queryKey: queryKeys.admin.settings,
		queryFn: getInstanceSettings,
	});

	const signupMode: SignupMode =
		settingsData?.settings?.signupMode ?? "enabled";
	const isInviteDisabled = signupMode === "disabled";

	const { data: rolesData, isLoading: loadingRoles } = useQuery({
		queryKey: queryKeys.admin.roles,
		queryFn: getRoles,
	});

	const roles = rolesData?.roles ?? [];

	const roleOptions: SelectOption<string>[] = roles.map((r) => ({
		value: r.id,
		label: r.name,
		description: r.description || undefined,
		icon: r.id === "admin" ? <Crown size={14} /> : <Shield size={14} />,
		badge: r.isSystem ? "System" : undefined,
	}));

	const [tab, setTab] = useState<"invite" | "direct">("invite");

	// Default tab based on signupMode
	useEffect(() => {
		if (signupMode === "disabled") {
			setTab("direct");
		} else {
			setTab("invite");
		}
	}, [signupMode]);

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Add new user"
			description="Generate an invitation token or directly provision a new user account."
			size="lg"
		>
			<div className="space-y-6">
				{/* Mode status banner */}
				<div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-zinc-400">
					<div className="flex items-center gap-2">
						<span className="text-zinc-500">Signup Policy:</span>
						<span className="text-zinc-200 font-medium capitalize">
							{signupMode === "enabled"
								? "Public signups allowed"
								: signupMode === "invite"
									? "Invite only"
									: "Signups disabled"}
						</span>
					</div>
					<Badge
						variant={
							signupMode === "enabled"
								? "success"
								: signupMode === "invite"
									? "warning"
									: "danger"
						}
						size="sm"
					>
						{signupMode === "enabled"
							? "Open"
							: signupMode === "invite"
								? "Invite Required"
								: "Closed"}
					</Badge>
				</div>

				{/* Tabs */}
				<div className="flex rounded-xl border border-white/8 bg-zinc-900/60 p-1">
					<button
						type="button"
						disabled={isInviteDisabled}
						onClick={() => {
							if (isInviteDisabled) return;
							setTab("invite");
						}}
						className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all ${
							isInviteDisabled
								? "opacity-40 cursor-not-allowed text-zinc-500 bg-white/[0.01]"
								: tab === "invite"
									? "bg-violet-500/20 text-violet-200 shadow-sm border border-violet-500/30 cursor-pointer"
									: "text-zinc-400 hover:text-zinc-200 cursor-pointer"
						}`}
						title={
							isInviteDisabled
								? "Signup policy is currently Closed. Switch policy in Settings to enable invites."
								: undefined
						}
					>
						<Ticket
							size={14}
							className={isInviteDisabled ? "text-zinc-500" : "text-violet-400"}
						/>
						Generate invite token
						{isInviteDisabled && (
							<span className="text-[10px] text-zinc-500 font-mono">
								(Disabled)
							</span>
						)}
					</button>

					<button
						type="button"
						onClick={() => setTab("direct")}
						className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all cursor-pointer ${
							tab === "direct"
								? "bg-violet-500/20 text-violet-200 shadow-sm border border-violet-500/30"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						<UserPlus size={14} className="text-violet-400" />
						Direct user creation
					</button>
				</div>

				{tab === "invite" && (
					<InviteUserTab
						isInviteDisabled={isInviteDisabled}
						roleOptions={roleOptions}
						loadingRoles={loadingRoles}
						onClose={onClose}
						onSuccess={onSuccess}
						onSwitchToDirect={() => setTab("direct")}
					/>
				)}

				{tab === "direct" && (
					<DirectUserTab
						roleOptions={roleOptions}
						loadingRoles={loadingRoles}
						onClose={onClose}
						onSuccess={onSuccess}
					/>
				)}
			</div>
		</Modal>
	);
}
