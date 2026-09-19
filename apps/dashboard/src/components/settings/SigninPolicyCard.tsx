import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Key, LogIn, ShieldAlert } from "lucide-react";
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
	type SigninMode,
	updateInstanceSettings,
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/queryKeys";

interface SigninPolicyCardProps {
	settings: InstanceSettings;
	canEdit: boolean;
}

interface SigninPolicyOption {
	value: SigninMode;
	title: string;
	description: string;
	badge: string;
	badgeVariant: "success" | "warning" | "danger" | "default";
	icon: typeof LogIn;
}

const POLICY_OPTIONS: SigninPolicyOption[] = [
	{
		value: "enabled",
		title: "Enabled (Standard)",
		description:
			"Users and administrators can sign in normally using their credentials, passkeys, or sessions.",
		badge: "Standard",
		badgeVariant: "success",
		icon: LogIn,
	},
	{
		value: "admin_key",
		title: "Admin Key Required",
		description:
			"Sign-in requires an administrative access key or emergency bypass credential.",
		badge: "Restricted",
		badgeVariant: "warning",
		icon: Key,
	},
	{
		value: "disabled",
		title: "Disabled (Locked)",
		description:
			"All user sign-ins are completely locked down. Active sessions remain subject to token expiration.",
		badge: "Locked",
		badgeVariant: "danger",
		icon: ShieldAlert,
	},
];

export default function SigninPolicyCard({
	settings,
	canEdit,
}: SigninPolicyCardProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [selectedMode, setSelectedMode] = useState<SigninMode>(
		settings.signinMode,
	);

	const mutation = useMutation({
		mutationFn: async (signinMode: SigninMode) => {
			return updateInstanceSettings({ signinMode });
		},
		onSuccess: (data) => {
			toast.success("Sign-in policy updated successfully.");
			queryClient.setQueryData(queryKeys.admin.settings, data);
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to update sign-in policy.");
			setSelectedMode(settings.signinMode);
		},
	});

	const hasPendingChange = selectedMode !== settings.signinMode;

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
							<LogIn size={18} className="text-violet-400" />
							Authentication & sign-in policy
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-zinc-400">
							Controls how users authenticate and gain access to the tenant.
						</CardDescription>
					</div>

					{hasPendingChange && canEdit && (
						<div className="flex items-center gap-2 mt-2 sm:mt-0">
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={mutation.isPending}
								onClick={() => setSelectedMode(settings.signinMode)}
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
						const isCurrent = settings.signinMode === option.value;
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
