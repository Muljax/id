import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Calendar,
	Check,
	Clock,
	Copy,
	Crown,
	Key,
	Lock,
	Shield,
	Ticket,
	UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select, { type SelectOption } from "@/components/ui/Select";
import {
	type CreateDirectUserResponse,
	type CreateInviteResponse,
	createDirectUser,
	createInvite,
} from "@/lib/api/invites";
import { getRoles } from "@/lib/api/rbac";
import { type SignupMode, getInstanceSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/queryKeys";

const EXPIRATION_OPTIONS: SelectOption<number>[] = [
	{
		value: 24,
		label: "24 Hours",
		description: "Expires in 1 day",
		icon: <Clock size={14} />,
	},
	{
		value: 72,
		label: "3 Days",
		description: "Expires in 3 days",
		icon: <Clock size={14} />,
	},
	{
		value: 168,
		label: "7 Days",
		description: "Expires in 1 week",
		icon: <Clock size={14} />,
		badge: "Default",
	},
	{
		value: 720,
		label: "30 Days",
		description: "Expires in 1 month",
		icon: <Calendar size={14} />,
	},
];

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
	const toast = useToast();
	const queryClient = useQueryClient();

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

	// Invite Form State
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("user");
	const [inviteTtlHours, setInviteTtlHours] = useState(168); // 7 days default
	const [createdInvite, setCreatedInvite] = useState<
		CreateInviteResponse["invite"] | null
	>(null);
	const [copiedInvite, setCopiedInvite] = useState(false);

	// Direct User Creation Form State
	const [directEmail, setDirectEmail] = useState("");
	const [directPassword, setDirectPassword] = useState("");
	const [directRole, setDirectRole] = useState("user");
	const [createdDirectUser, setCreatedDirectUser] =
		useState<CreateDirectUserResponse | null>(null);
	const [copiedPassword, setCopiedPassword] = useState(false);

	// Default tab based on signupMode
	useEffect(() => {
		if (signupMode === "disabled") {
			setTab("direct");
		} else {
			setTab("invite");
		}
	}, [signupMode]);

	// Reset state on modal open/close
	useEffect(() => {
		if (!open) {
			setCreatedInvite(null);
			setCreatedDirectUser(null);
			setInviteEmail("");
			setDirectEmail("");
			setDirectPassword("");
			setCopiedInvite(false);
			setCopiedPassword(false);
		}
	}, [open]);

	const inviteMutation = useMutation({
		mutationFn: async () => {
			return createInvite({
				email: inviteEmail.trim() || undefined,
				roleId: inviteRole,
				ttlHours: inviteTtlHours,
			});
		},
		onSuccess: (data) => {
			setCreatedInvite(data.invite);
			toast.success("Invitation generated successfully.");
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.invites });
			onSuccess?.();
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to generate invite.");
		},
	});

	const directUserMutation = useMutation({
		mutationFn: async () => {
			return createDirectUser({
				email: directEmail.trim(),
				password: directPassword || undefined,
				roleId: directRole,
			});
		},
		onSuccess: (data) => {
			setCreatedDirectUser(data);
			toast.success(`User ${data.user.email} provisioned successfully.`);
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
			onSuccess?.();
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to create user.");
		},
	});

	async function handleCopyInviteUrl() {
		if (!createdInvite) return;
		await navigator.clipboard.writeText(createdInvite.inviteUrl);
		setCopiedInvite(true);
		toast.success("Invite link copied to clipboard.");
		setTimeout(() => setCopiedInvite(false), 2000);
	}

	async function handleCopyPassword() {
		if (!createdDirectUser?.temporaryPassword) return;
		await navigator.clipboard.writeText(createdDirectUser.temporaryPassword);
		setCopiedPassword(true);
		toast.success("Temporary password copied to clipboard.");
		setTimeout(() => setCopiedPassword(false), 2000);
	}

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
							setCreatedInvite(null);
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
						onClick={() => {
							setTab("direct");
							setCreatedDirectUser(null);
						}}
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

				{/* TAB 1: INVITE */}
				{tab === "invite" &&
					(isInviteDisabled ? (
						<div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-6 text-center opacity-70">
							<div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">
								<Lock size={18} />
							</div>
							<div>
								<h4 className="text-sm font-semibold text-zinc-300">
									Invite tokens are disabled
								</h4>
								<p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
									The tenant signup policy is currently set to{" "}
									<strong className="text-zinc-400">Closed</strong>. User
									self-registration with invite tokens cannot be used while
									signups are disabled.
								</p>
							</div>
							<div className="pt-2">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => setTab("direct")}
								>
									Switch to Direct Creation
								</Button>
							</div>
						</div>
					) : createdInvite ? (
						<div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
							<div className="flex items-center gap-2 text-emerald-400">
								<Check size={18} />
								<h3 className="text-sm font-semibold">
									Invite token generated!
								</h3>
							</div>

							<p className="text-xs text-zinc-300">
								Share this one-time link with the user. It allows them to
								register an account with the{" "}
								<span className="font-semibold text-white">
									{createdInvite.roleId}
								</span>{" "}
								role.
							</p>

							<div className="space-y-2">
								<label
									htmlFor="invite-url-output"
									className="text-[11px] font-medium text-zinc-400"
								>
									Invitation Link
								</label>
								<div className="flex items-center gap-2">
									<input
										id="invite-url-output"
										type="text"
										readOnly
										value={createdInvite.inviteUrl}
										className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-300 select-all"
									/>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={() => void handleCopyInviteUrl()}
										icon={
											copiedInvite ? <Check size={14} /> : <Copy size={14} />
										}
									>
										{copiedInvite ? "Copied" : "Copy link"}
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 pt-2 text-xs text-zinc-400 border-t border-white/8">
								<div>
									<span className="text-zinc-500">Target Email:</span>{" "}
									<span className="text-zinc-300 font-mono">
										{createdInvite.email || "Any email"}
									</span>
								</div>
								<div>
									<span className="text-zinc-500">Expires:</span>{" "}
									<span className="text-zinc-300">
										{new Date(createdInvite.expiresAt).toLocaleDateString()}
									</span>
								</div>
							</div>

							<div className="pt-2 flex justify-end gap-2">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => {
										setCreatedInvite(null);
										setInviteEmail("");
									}}
								>
									Create another invite
								</Button>
								<Button
									type="button"
									variant="primary"
									size="sm"
									onClick={onClose}
								>
									Done
								</Button>
							</div>
						</div>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								void inviteMutation.mutateAsync();
							}}
							className="space-y-4"
						>
							<div>
								<label
									htmlFor="invite-email"
									className="mb-1.5 block text-xs font-medium text-zinc-300"
								>
									Recipient email{" "}
									<span className="text-zinc-500 font-normal">(optional)</span>
								</label>
								<Input
									id="invite-email"
									type="email"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									placeholder="user@example.com"
								/>
								<p className="mt-1 text-[11px] text-zinc-500">
									If specified, only this email address will be allowed to use
									this invite token.
								</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="invite-role"
										className="mb-1.5 block text-xs font-medium text-zinc-300"
									>
										Initial role
									</label>
									<Select
										id="invite-role"
										value={inviteRole}
										onChange={(val) => setInviteRole(val)}
										options={roleOptions}
										disabled={loadingRoles}
										placeholder="Select role..."
									/>
								</div>

								<div>
									<label
										htmlFor="invite-expiration"
										className="mb-1.5 block text-xs font-medium text-zinc-300"
									>
										Expiration
									</label>
									<Select
										id="invite-expiration"
										value={inviteTtlHours}
										onChange={(val) => setInviteTtlHours(val)}
										options={EXPIRATION_OPTIONS}
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={onClose}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="primary"
									size="sm"
									loading={inviteMutation.isPending}
									icon={<Ticket size={14} />}
								>
									Generate invite link
								</Button>
							</div>
						</form>
					))}

				{/* TAB 2: DIRECT CREATION */}
				{tab === "direct" &&
					(createdDirectUser ? (
						<div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
							<div className="flex items-center gap-2 text-emerald-400">
								<Check size={18} />
								<h3 className="text-sm font-semibold">
									Account provisioned successfully!
								</h3>
							</div>

							<p className="text-xs text-zinc-300">
								The user account for{" "}
								<span className="font-semibold text-white">
									{createdDirectUser.user.email}
								</span>{" "}
								is ready.
							</p>

							{createdDirectUser.temporaryPassword && (
								<div className="space-y-2 rounded-xl border border-violet-500/20 bg-violet-950/20 p-3">
									<label
										htmlFor="direct-temp-password-output"
										className="text-[11px] font-medium text-violet-300 flex items-center gap-1.5"
									>
										<Key size={13} className="text-violet-400" />
										Temporary generated password
									</label>
									<div className="flex items-center gap-2">
										<input
											id="direct-temp-password-output"
											type="text"
											readOnly
											value={createdDirectUser.temporaryPassword}
											className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-violet-200 select-all"
										/>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() => void handleCopyPassword()}
											icon={
												copiedPassword ? (
													<Check size={14} />
												) : (
													<Copy size={14} />
												)
											}
										>
											{copiedPassword ? "Copied" : "Copy"}
										</Button>
									</div>
									<p className="text-[11px] text-zinc-400">
										Make sure to share this password with the user. They will be
										able to update it in their profile.
									</p>
								</div>
							)}

							<div className="pt-2 flex justify-end gap-2">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => {
										setCreatedDirectUser(null);
										setDirectEmail("");
										setDirectPassword("");
									}}
								>
									Create another user
								</Button>
								<Button
									type="button"
									variant="primary"
									size="sm"
									onClick={onClose}
								>
									Done
								</Button>
							</div>
						</div>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								void directUserMutation.mutateAsync();
							}}
							className="space-y-4"
						>
							<div>
								<label
									htmlFor="direct-email"
									className="mb-1.5 block text-xs font-medium text-zinc-300"
								>
									Email address <span className="text-red-400">*</span>
								</label>
								<Input
									id="direct-email"
									type="email"
									required
									value={directEmail}
									onChange={(e) => setDirectEmail(e.target.value)}
									placeholder="newuser@example.com"
								/>
							</div>

							<div>
								<label
									htmlFor="direct-password"
									className="mb-1.5 block text-xs font-medium text-zinc-300"
								>
									Password{" "}
									<span className="text-zinc-500 font-normal">
										(optional: leave blank to auto-generate)
									</span>
								</label>
								<Input
									id="direct-password"
									type="password"
									value={directPassword}
									onChange={(e) => setDirectPassword(e.target.value)}
									placeholder="Enter password (min. 8 characters)"
								/>
							</div>

							<div>
								<label
									htmlFor="direct-role"
									className="mb-1.5 block text-xs font-medium text-zinc-300"
								>
									Role
								</label>
								<Select
									id="direct-role"
									value={directRole}
									onChange={(val) => setDirectRole(val)}
									options={roleOptions}
									disabled={loadingRoles}
									placeholder="Select role..."
								/>
							</div>

							<div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={onClose}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="primary"
									size="sm"
									loading={directUserMutation.isPending}
									icon={<UserPlus size={14} />}
								>
									Create user
								</Button>
							</div>
						</form>
					))}
			</div>
		</Modal>
	);
}
