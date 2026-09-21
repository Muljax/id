import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Lock, Ticket, UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/Card";
import {
	type InstanceSettings,
	type SignupMode,
	updateInstanceSettings,
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/queryKeys";

interface SignupPolicyCardProps {
	settings: InstanceSettings;
	canEdit: boolean;
}

interface PolicyOption {
	value: SignupMode;
	title: string;
	description: string;
	badge: string;
	badgeVariant: "success" | "warning" | "danger" | "default";
	icon: typeof UserPlus;
}

const POLICY_OPTIONS: PolicyOption[] = [
	{
		value: "enabled",
		title: "Allowed (Public)",
		description:
			"Anyone can register a new account on this instance without an invitation.",
		badge: "Open",
		badgeVariant: "success",
		icon: UserPlus,
	},
	{
		value: "invite",
		title: "Allowed with Invite Token",
		description:
			"Registration requires a valid, pre-generated invitation token or link created by an administrator.",
		badge: "Invite Only",
		badgeVariant: "warning",
		icon: Ticket,
	},
	{
		value: "disabled",
		title: "Not Allowed (Closed)",
		description:
			"Public signups are completely disabled. User accounts can only be provisioned directly by administrators.",
		badge: "Closed",
		badgeVariant: "danger",
		icon: Lock,
	},
];

export default function SignupPolicyCard({
	settings,
	canEdit,
}: SignupPolicyCardProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [selectedMode, setSelectedMode] = useState<SignupMode>(
		settings.signupMode,
	);

	const mutation = useMutation({
		mutationFn: async (signupMode: SignupMode) => {
			return updateInstanceSettings({ signupMode });
		},
		onSuccess: (data) => {
			toast.success("Signup policy updated successfully.");
			queryClient.setQueryData(queryKeys.admin.settings, data);
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to update signup policy.");
			setSelectedMode(settings.signupMode);
		},
	});

	const hasPendingChange = selectedMode !== settings.signupMode;

	async function handleSave() {
		if (!canEdit || !hasPendingChange) return;
		await mutation.mutateAsync(selectedMode);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div>
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<UserCheck size={18} className="text-violet-400" />
							User registration policy
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-zinc-400">
							Controls how new users can register accounts on this instance.
						</CardDescription>
					</div>

					{hasPendingChange && canEdit && (
						<div className="flex items-center gap-2 mt-2 sm:mt-0">
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={mutation.isPending}
								onClick={() => setSelectedMode(settings.signupMode)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="primary"
								size="sm"
								loading={mutation.isPending}
								onClick={() => void handleSave()}
								icon={<Check size={14} />}
							>
								Save changes
							</Button>
						</div>
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				<div className="grid grid-cols-1 gap-3">
					{POLICY_OPTIONS.map((option) => {
						const isSelected = selectedMode === option.value;
						const isCurrent = settings.signupMode === option.value;
						const Icon = option.icon;

						return (
							<button
								type="button"
								key={option.value}
								disabled={!canEdit || mutation.isPending}
								onClick={() => setSelectedMode(option.value)}
								className={`group relative flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer ${
									isSelected
										? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.12)] ring-1 ring-violet-500/30"
										: "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
								} ${!canEdit ? "opacity-75 cursor-not-allowed" : ""}`}
							>
								<div
									className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
										isSelected
											? "border-violet-500/40 bg-violet-500/20 text-violet-300"
											: "border-violet-500/20 bg-violet-500/10 text-violet-400 group-hover:text-violet-300 group-hover:border-violet-500/30"
									}`}
								>
									<Icon size={18} />
								</div>

								<div className="flex-1 min-w-0 pr-2">
									<div className="flex items-center gap-2">
										<span
											className={`text-sm font-medium transition-colors ${
												isSelected ? "text-white" : "text-zinc-200"
											}`}
										>
											{option.title}
										</span>
										<Badge variant={option.badgeVariant} size="sm">
											{option.badge}
										</Badge>
										{isCurrent && (
											<Badge variant="default" size="sm">
												Current Active
											</Badge>
										)}
									</div>
									<p className="mt-1 text-xs text-zinc-400 leading-relaxed">
										{option.description}
									</p>
								</div>

								<div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 bg-zinc-900">
									{isSelected && (
										<div className="h-2.5 w-2.5 rounded-full bg-violet-400" />
									)}
								</div>
							</button>
						);
					})}
				</div>

				{!canEdit && (
					<p className="text-xs text-zinc-500 italic mt-2">
						You have read-only access to settings. The{" "}
						<code className="text-violet-400 font-mono">settings:write</code>{" "}
						permission is required to modify policies.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
