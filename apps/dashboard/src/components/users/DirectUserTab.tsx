import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Key, UserPlus } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select, { type SelectOption } from "@/components/ui/Select";
import {
	type CreateDirectUserResponse,
	createDirectUser,
} from "@/lib/api/invites";
import { queryKeys } from "@/lib/queryKeys";

interface DirectUserTabProps {
	roleOptions: SelectOption<string>[];
	loadingRoles: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function DirectUserTab({
	roleOptions,
	loadingRoles,
	onClose,
	onSuccess,
}: DirectUserTabProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [directEmail, setDirectEmail] = useState("");
	const [directPassword, setDirectPassword] = useState("");
	const [directRole, setDirectRole] = useState("user");
	const [createdDirectUser, setCreatedDirectUser] =
		useState<CreateDirectUserResponse | null>(null);
	const [copiedPassword, setCopiedPassword] = useState(false);

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

	async function handleCopyPassword() {
		if (!createdDirectUser?.temporaryPassword) return;
		await navigator.clipboard.writeText(createdDirectUser.temporaryPassword);
		setCopiedPassword(true);
		toast.success("Temporary password copied to clipboard.");
		setTimeout(() => setCopiedPassword(false), 2000);
	}

	if (createdDirectUser) {
		return (
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
								icon={copiedPassword ? <Check size={14} /> : <Copy size={14} />}
							>
								{copiedPassword ? "Copied" : "Copy"}
							</Button>
						</div>
						<p className="text-[11px] text-zinc-400">
							Make sure to share this password with the user. They will be able
							to update it in their profile.
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
				<Button type="button" variant="secondary" size="sm" onClick={onClose}>
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
	);
}
