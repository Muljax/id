import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Calendar,
	Check,
	Clock,
	Copy,
	Infinity as InfinityIcon,
	Key,
	Plus,
	Trash2,
} from "lucide-react";
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
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select, { type SelectOption } from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import {
	type AdminSigninKey,
	type CreateSigninKeyResponse,
	createSigninKey,
	getSigninKeys,
	revokeSigninKey,
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/queryKeys";

const KEY_EXPIRATION_OPTIONS: SelectOption<number>[] = [
	{
		value: 0,
		label: "Never expires",
		description: "Permanent access key until manually revoked",
		icon: <InfinityIcon size={14} />,
		badge: "Default",
	},
	{
		value: 24,
		label: "24 Hours",
		description: "Expires 1 day after creation",
		icon: <Clock size={14} />,
	},
	{
		value: 168,
		label: "7 Days",
		description: "Expires 1 week after creation",
		icon: <Clock size={14} />,
	},
	{
		value: 720,
		label: "30 Days",
		description: "Expires 1 month after creation",
		icon: <Calendar size={14} />,
	},
];

interface SigninKeysCardProps {
	canEdit: boolean;
}

export default function SigninKeysCard({ canEdit }: SigninKeysCardProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [modalOpen, setModalOpen] = useState(false);
	const [keyName, setKeyName] = useState("");
	const [ttlHours, setTtlHours] = useState<number | undefined>(undefined);
	const [createdKey, setCreatedKey] = useState<
		CreateSigninKeyResponse["key"] | null
	>(null);
	const [copiedKey, setCopiedKey] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: queryKeys.admin.signinKeys,
		queryFn: getSigninKeys,
	});

	const keys = data?.keys ?? [];

	const createMutation = useMutation({
		mutationFn: async () => {
			return createSigninKey({
				name: keyName.trim(),
				ttlHours: ttlHours === 0 ? undefined : ttlHours,
			});
		},
		onSuccess: (res) => {
			setCreatedKey(res.key);
			toast.success("Administrator sign-in key created.");
			void queryClient.invalidateQueries({
				queryKey: queryKeys.admin.signinKeys,
			});
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to generate sign-in key.");
		},
	});

	const revokeMutation = useMutation({
		mutationFn: async (id: string) => {
			return revokeSigninKey(id);
		},
		onSuccess: () => {
			toast.success("Sign-in key revoked successfully.");
			void queryClient.invalidateQueries({
				queryKey: queryKeys.admin.signinKeys,
			});
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to revoke key.");
		},
	});

	async function handleCopyKey() {
		if (!createdKey) return;
		await navigator.clipboard.writeText(createdKey.key);
		setCopiedKey(true);
		toast.success("Key copied to clipboard.");
		setTimeout(() => setCopiedKey(false), 2000);
	}

	function handleCloseModal() {
		setModalOpen(false);
		setCreatedKey(null);
		setKeyName("");
		setTtlHours(undefined);
		setCopiedKey(false);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div>
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<Key size={18} className="text-violet-400" />
							Admin sign-in access keys
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-zinc-400">
							Active access keys required to sign in when the authentication
							policy is restricted to{" "}
							<strong className="text-zinc-300">Admin Key Required</strong>.
						</CardDescription>
					</div>

					{canEdit && (
						<Button
							type="button"
							variant="primary"
							size="sm"
							icon={<Plus size={14} />}
							onClick={() => setModalOpen(true)}
						>
							Generate sign-in key
						</Button>
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{isLoading ? (
					<div className="flex justify-center py-8">
						<Spinner size="md" />
					</div>
				) : keys.length === 0 ? (
					<EmptyState
						icon={<Key size={20} />}
						title="No sign-in keys generated"
						description="When sign-in mode is restricted to Admin Key Required, users must supply an active sign-in key from this list."
					/>
				) : (
					<div className="divide-y divide-white/6 rounded-xl border border-white/8 bg-white/[0.01]">
						{keys.map((key: AdminSigninKey) => {
							const isExpired =
								key.expiresAt !== null && key.expiresAt < Date.now();

							return (
								<div
									key={key.id}
									className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-white">
												{key.name}
											</span>
											<code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-zinc-400">
												{key.keyPrefix}
											</code>
											{isExpired ? (
												<Badge variant="danger" size="sm">
													Expired
												</Badge>
											) : (
												<Badge variant="success" size="sm">
													Active
												</Badge>
											)}
										</div>

										<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
											<span>
												Created: {new Date(key.createdAt).toLocaleDateString()}
											</span>
											<span>
												Expires:{" "}
												{key.expiresAt
													? new Date(key.expiresAt).toLocaleDateString()
													: "Never"}
											</span>
											{key.lastUsedAt && (
												<span>
													Last used:{" "}
													{new Date(key.lastUsedAt).toLocaleDateString()}
												</span>
											)}
										</div>
									</div>

									{canEdit && (
										<div className="flex items-center gap-2 self-end sm:self-center">
											<Button
												type="button"
												variant="danger"
												size="sm"
												loading={revokeMutation.isPending}
												onClick={() => void revokeMutation.mutateAsync(key.id)}
												icon={<Trash2 size={13} />}
											>
												Revoke
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</CardContent>

			{/* Modal to generate key */}
			{modalOpen && (
				<Modal
					open={modalOpen}
					onClose={handleCloseModal}
					title="Generate Admin Sign-in Key"
					description="Create a new access key that authorizes sign-ins when restricted mode is active."
					size="md"
				>
					{createdKey ? (
						<div className="space-y-4 rounded-xl border border-violet-500/30 bg-violet-950/20 p-5">
							<div className="flex items-center gap-2 text-violet-300">
								<Check size={18} />
								<h3 className="text-sm font-semibold">Access Key Generated!</h3>
							</div>

							<p className="text-xs text-zinc-300 leading-relaxed">
								Copy this key now. For security reasons,{" "}
								<strong className="text-violet-300">
									it will never be displayed again
								</strong>
								.
							</p>

							<div className="space-y-2">
								<label
									htmlFor="raw-key-output"
									className="text-[11px] font-medium text-zinc-400"
								>
									Secret Sign-in Key
								</label>
								<div className="flex items-center gap-2">
									<input
										id="raw-key-output"
										type="text"
										readOnly
										value={createdKey.key}
										className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-violet-200 select-all"
									/>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={() => void handleCopyKey()}
										icon={copiedKey ? <Check size={14} /> : <Copy size={14} />}
									>
										{copiedKey ? "Copied" : "Copy"}
									</Button>
								</div>
							</div>

							<div className="flex justify-end pt-2">
								<Button
									type="button"
									variant="primary"
									size="sm"
									onClick={handleCloseModal}
								>
									Done
								</Button>
							</div>
						</div>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								void createMutation.mutateAsync();
							}}
							className="space-y-4"
						>
							<div>
								<label
									htmlFor="signin-key-name"
									className="mb-1.5 block text-xs font-medium text-zinc-300"
								>
									Key Name / Description <span className="text-red-400">*</span>
								</label>
								<Input
									id="signin-key-name"
									type="text"
									required
									value={keyName}
									onChange={(e) => setKeyName(e.target.value)}
									placeholder="e.g. Maintenance Access Key, Emergency 2026"
								/>
							</div>

							<div>
								<label
									htmlFor="signin-key-expiration"
									className="mb-1.5 block text-xs font-medium text-zinc-300"
								>
									Expiration
								</label>
								<Select
									id="signin-key-expiration"
									value={ttlHours ?? 0}
									onChange={(val) => setTtlHours(val === 0 ? undefined : val)}
									options={KEY_EXPIRATION_OPTIONS}
								/>
							</div>

							<div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={handleCloseModal}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="primary"
									size="sm"
									loading={createMutation.isPending}
									icon={<Key size={14} />}
								>
									Create access key
								</Button>
							</div>
						</form>
					)}
				</Modal>
			)}
		</Card>
	);
}
