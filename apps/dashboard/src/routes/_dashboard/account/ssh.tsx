import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import { useAuth } from "@/context/AuthContext";
import {
	addSshKey,
	deleteSshKey,
	getSshKeys,
	getSshPrincipals,
	issueSshCertificate,
	type IssueCertificateResponse,
	type SshKey,
} from "@/lib/api/ssh";
import { queryKeys } from "@/lib/queryKeys";

export const Route = createFileRoute("/_dashboard/account/ssh")({
	staticData: {
		navigation: {
			label: "SSH Keys",
			order: 25,
		},
	},
	component: SshAccountPage,
});

function SshAccountPage() {
	const toast = useToast();
	const queryClient = useQueryClient();
	const { hasPermission } = useAuth();
	const canManageKeys = hasPermission("ssh:keys:manage");
	const canIssueCert = hasPermission("ssh:cert:issue");

	const [addModalOpen, setAddModalOpen] = useState(false);
	const [keyName, setKeyName] = useState("");
	const [publicKey, setPublicKey] = useState("");

	const [keyToDelete, setKeyToDelete] = useState<SshKey | null>(null);

	const [certKey, setCertKey] = useState<SshKey | null>(null);
	const [certDuration, setCertDuration] = useState<number>(28800);
	const [issuedCert, setIssuedCert] = useState<IssueCertificateResponse | null>(
		null,
	);
	const [copied, setCopied] = useState(false);

	const { data: keysData, isLoading: loadingKeys } = useQuery({
		queryKey: queryKeys.ssh.keys,
		queryFn: getSshKeys,
	});

	const { data: principalsData } = useQuery({
		queryKey: queryKeys.ssh.principals,
		queryFn: getSshPrincipals,
	});

	const addMutation = useMutation({
		mutationFn: addSshKey,
		onSuccess: () => {
			toast.success("SSH key added.");
			void queryClient.invalidateQueries({ queryKey: queryKeys.ssh.keys });
			setAddModalOpen(false);
			setKeyName("");
			setPublicKey("");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to add SSH key.",
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteSshKey,
		onSuccess: () => {
			toast.success("SSH key removed.");
			void queryClient.invalidateQueries({ queryKey: queryKeys.ssh.keys });
			setKeyToDelete(null);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to remove SSH key.",
			);
		},
	});

	const issueMutation = useMutation({
		mutationFn: issueSshCertificate,
		onSuccess: (data) => {
			toast.success("Certificate issued.");
			setIssuedCert(data);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to issue certificate.",
			);
		},
	});

	function handleAddSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!keyName.trim() || !publicKey.trim()) {
			return;
		}
		addMutation.mutate({
			name: keyName.trim(),
			publicKey: publicKey.trim(),
		});
	}

	function handleIssueSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!certKey) {
			return;
		}
		issueMutation.mutate({
			savedKeyId: certKey.id,
			ttl: certDuration,
		});
	}

	function copyCert() {
		if (!issuedCert) {
			return;
		}
		navigator.clipboard.writeText(issuedCert.certificate);
		setCopied(true);
		toast.success("Copied certificate to clipboard");
		setTimeout(() => setCopied(false), 2000);
	}

	function closeCertModal() {
		setCertKey(null);
		setIssuedCert(null);
		setCopied(false);
	}

	if (loadingKeys) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	const keys = keysData?.keys ?? [];
	const principals = principalsData?.principals ?? [];

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="SSH Keys"
				description="Manage your SSH public keys to request signed certificates for server access."
				actions={
					canManageKeys ? (
						<Button
							type="button"
							onClick={() => setAddModalOpen(true)}
							icon={<Plus size={16} />}
						>
							Add SSH key
						</Button>
					) : undefined
				}
			/>

			{keys.length === 0 ? (
				<EmptyState
					icon={<KeyRound size={24} />}
					title={
						canManageKeys
							? "No SSH keys added"
							: "SSH key registration restricted"
					}
					description={
						canManageKeys
							? "Add an Ed25519 public key to request access certificates."
							: "Your account does not have permission to register personal SSH keys. Contact an administrator to request access."
					}
					action={
						canManageKeys ? (
							<Button
								type="button"
								onClick={() => setAddModalOpen(true)}
								icon={<Plus size={16} />}
							>
								Add your first key
							</Button>
						) : undefined
					}
				/>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold">
								Your SSH keys
							</CardTitle>
							<Badge variant="default">{keys.length} Registered</Badge>
						</div>
					</CardHeader>
					<div className="divide-y divide-white/6">
						{keys.map((key) => (
							<div
								key={key.id}
								className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="flex items-start gap-3.5 min-w-0">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
										<KeyRound size={20} />
									</div>
									<div className="min-w-0">
										<h4 className="truncate text-sm font-medium text-white">
											{key.name}
										</h4>
										<p className="mt-0.5 truncate font-mono text-xs text-zinc-500 max-w-xs sm:max-w-md">
											{key.fingerprint}
										</p>
										<div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
											<span>
												Added {new Date(key.createdAt).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2 self-end sm:self-center">
									{canIssueCert && (
										<Button
											variant="secondary"
											size="sm"
											icon={<ShieldCheck size={14} />}
											onClick={() => {
												setCertKey(key);
												setIssuedCert(null);
											}}
										>
											Get certificate
										</Button>
									)}
									{canManageKeys && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setKeyToDelete(key)}
											icon={<Trash2 size={14} className="text-red-400" />}
											title="Delete key"
										/>
									)}
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			{/* Add Key Modal */}
			<Modal
				open={addModalOpen}
				title="Add SSH key"
				description="Add an Ed25519 public key to authenticate to remote servers."
				onClose={() => setAddModalOpen(false)}
			>
				<form onSubmit={handleAddSubmit} className="space-y-4">
					<div className="space-y-2">
						<label
							htmlFor="key-name"
							className="block text-sm font-medium text-zinc-300"
						>
							Label
						</label>
						<Input
							id="key-name"
							value={keyName}
							onChange={(e) => setKeyName(e.target.value)}
							placeholder="e.g. Laptop"
							required
						/>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="key-data"
							className="block text-sm font-medium text-zinc-300"
						>
							Public key
						</label>
						<Textarea
							id="key-data"
							value={publicKey}
							onChange={(e) => setPublicKey(e.target.value)}
							placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..."
							rows={4}
							className="font-mono text-xs"
							required
						/>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setAddModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="primary"
							loading={addMutation.isPending}
						>
							Add key
						</Button>
					</div>
				</form>
			</Modal>

			{/* Issue Certificate Modal */}
			<Modal
				open={Boolean(certKey)}
				title={issuedCert ? "Certificate ready" : "Get SSH certificate"}
				description={
					issuedCert
						? "Use this certificate to authenticate to remote servers."
						: `Request a signed certificate for "${certKey?.name}".`
				}
				onClose={closeCertModal}
			>
				{issuedCert ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-xs text-zinc-400">
								<span>Certificate</span>
								<button
									type="button"
									onClick={copyCert}
									className="flex items-center gap-1 text-violet-400 hover:text-violet-300 cursor-pointer"
								>
									{copied ? <Check size={12} /> : <Copy size={12} />}
									{copied ? "Copied" : "Copy"}
								</button>
							</div>
							<pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-zinc-300 break-all select-all">
								{issuedCert.certificate}
							</pre>
						</div>

						<div className="flex justify-end pt-2">
							<Button variant="primary" onClick={closeCertModal}>
								Done
							</Button>
						</div>
					</div>
				) : (
					<form onSubmit={handleIssueSubmit} className="space-y-4">
						{principals.length > 0 && (
							<div className="space-y-1.5">
								<span className="block text-xs font-medium text-zinc-400">
									Allowed usernames
								</span>
								<div className="flex flex-wrap gap-1.5">
									{principals.map((p) => (
										<Badge key={p} variant="violet" size="sm">
											{p}
										</Badge>
									))}
								</div>
							</div>
						)}

						<div className="space-y-1.5">
							<label
								htmlFor="cert-ttl"
								className="block text-xs font-medium text-zinc-400"
							>
								Validity
							</label>
							<select
								id="cert-ttl"
								value={certDuration}
								onChange={(e) => setCertDuration(Number(e.target.value))}
								className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-400/60"
							>
								<option value={3600}>1 hour</option>
								<option value={28800}>8 hours (standard)</option>
								<option value={86400}>24 hours</option>
							</select>
						</div>

						<div className="flex justify-end gap-3 pt-4">
							<Button type="button" variant="ghost" onClick={closeCertModal}>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								loading={issueMutation.isPending}
							>
								Generate certificate
							</Button>
						</div>
					</form>
				)}
			</Modal>

			{/* Delete Key Modal */}
			<Modal
				open={Boolean(keyToDelete)}
				title="Remove SSH key"
				description={`Are you sure you want to remove "${keyToDelete?.name}"?`}
				onClose={() => setKeyToDelete(null)}
				size="sm"
			>
				<div className="flex justify-end gap-3 pt-4">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setKeyToDelete(null)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="danger"
						loading={deleteMutation.isPending}
						onClick={() => {
							if (keyToDelete) {
								deleteMutation.mutate(keyToDelete.id);
							}
						}}
					>
						Remove
					</Button>
				</div>
			</Modal>
		</div>
	);
}
