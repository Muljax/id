import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Copy, Lock, Ticket } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select, { type SelectOption } from "@/components/ui/Select";
import { type CreateInviteResponse, createInvite } from "@/lib/api/invites";
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
		icon: <Clock size={14} />,
	},
];

interface InviteUserTabProps {
	isInviteDisabled: boolean;
	roleOptions: SelectOption<string>[];
	loadingRoles: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	onSwitchToDirect: () => void;
}

export default function InviteUserTab({
	isInviteDisabled,
	roleOptions,
	loadingRoles,
	onClose,
	onSuccess,
	onSwitchToDirect,
}: InviteUserTabProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("user");
	const [inviteTtlHours, setInviteTtlHours] = useState(168);
	const [createdInvite, setCreatedInvite] = useState<
		CreateInviteResponse["invite"] | null
	>(null);
	const [copiedInvite, setCopiedInvite] = useState(false);

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

	async function handleCopyInviteUrl() {
		if (!createdInvite) return;
		await navigator.clipboard.writeText(createdInvite.inviteUrl);
		setCopiedInvite(true);
		toast.success("Invite link copied to clipboard.");
		setTimeout(() => setCopiedInvite(false), 2000);
	}

	if (isInviteDisabled) {
		return (
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
						self-registration with invite tokens cannot be used while signups
						are disabled.
					</p>
				</div>
				<div className="pt-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={onSwitchToDirect}
					>
						Switch to Direct Creation
					</Button>
				</div>
			</div>
		);
	}

	if (createdInvite) {
		return (
			<div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
				<div className="flex items-center gap-2 text-emerald-400">
					<Check size={18} />
					<h3 className="text-sm font-semibold">Invite token generated!</h3>
				</div>

				<p className="text-xs text-zinc-300">
					Share this one-time link with the user. It allows them to register an
					account with the{" "}
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
							icon={copiedInvite ? <Check size={14} /> : <Copy size={14} />}
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
					<Button type="button" variant="primary" size="sm" onClick={onClose}>
						Done
					</Button>
				</div>
			</div>
		);
	}

	return (
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
					If specified, only this email address will be allowed to use this
					invite token.
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
				<Button type="button" variant="secondary" size="sm" onClick={onClose}>
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
	);
}
