import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, Copy, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { PermissionGuard, useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api/client";
import {
	getCaPublicKey,
	getSshCertificates,
	revokeSshCertificate,
	type SshCertificate,
} from "@/lib/api/ssh";
import { queryKeys } from "@/lib/queryKeys";

export const Route = createFileRoute("/_dashboard/admin/ssh")({
	staticData: {
		navigation: {
			label: "SSH CA",
			order: 50,
			requiredPermission: "ssh:cert:list",
		},
	},
	component: AdminSshPageWrapper,
});

function AdminSshPageWrapper() {
	return (
		<PermissionGuard permission="ssh:cert:list">
			<AdminSshPage />
		</PermissionGuard>
	);
}

function AdminSshPage() {
	const toast = useToast();
	const queryClient = useQueryClient();
	const { hasPermission } = useAuth();
	const canRevoke = hasPermission("ssh:cert:revoke");

	const [copiedKey, setCopiedKey] = useState(false);
	const [certToRevoke, setCertToRevoke] = useState<SshCertificate | null>(null);
	const [revokeReason, setRevokeReason] = useState("");
	const [installCardOpen, setInstallCardOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<
		"active" | "revoked" | "expired" | "all"
	>("active");
	const [searchQuery, setSearchQuery] = useState("");
	const [syncTab, setSyncTab] = useState<"quick" | "service" | "timer">(
		"quick",
	);
	const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

	const apiOrigin = API_URL?.startsWith("http")
		? API_URL
		: typeof window !== "undefined"
			? `${window.location.origin}${API_URL ?? ""}`
			: (API_URL ?? "");

	const revokedKeysUrl = `${apiOrigin.replace(/\/$/, "")}/api/ssh/ca/revoked-keys?format=raw`;

	const serviceUnit = `[Unit]
Description=Sync OpenSSH Revoked Keys
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'curl -fsSL "${revokedKeysUrl}" -o /etc/ssh/revoked_keys.tmp && chmod 644 /etc/ssh/revoked_keys.tmp && mv /etc/ssh/revoked_keys.tmp /etc/ssh/revoked_keys'`;

	const timerUnit = `[Unit]
Description=Sync OpenSSH Revoked Keys Periodically

[Timer]
OnBootSec=1min
OnUnitActiveSec=15min
Persistent=true

[Install]
WantedBy=timers.target`;

	const quickInstallScript = `# 1. Create systemd service
sudo tee /etc/systemd/system/ssh-revoked-keys.service > /dev/null << 'EOF'
${serviceUnit}
EOF

# 2. Create systemd timer
sudo tee /etc/systemd/system/ssh-revoked-keys.timer > /dev/null << 'EOF'
${timerUnit}
EOF

# 3. Configure sshd and enable timer
sudo touch /etc/ssh/revoked_keys
grep -qxF 'RevokedKeys /etc/ssh/revoked_keys' /etc/ssh/sshd_config || echo 'RevokedKeys /etc/ssh/revoked_keys' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl daemon-reload
sudo systemctl enable --now ssh-revoked-keys.timer
sudo systemctl reload sshd`;

	function handleCopySnippet(text: string, id: string) {
		navigator.clipboard.writeText(text);
		setCopiedSnippet(id);
		toast.success("Copied to clipboard.");
		setTimeout(() => setCopiedSnippet(null), 2000);
	}

	const currentSnippet =
		syncTab === "quick"
			? quickInstallScript
			: syncTab === "service"
				? serviceUnit
				: timerUnit;

	const {
		data: caData,
		isLoading: loadingCa,
		refetch: refetchCa,
	} = useQuery({
		queryKey: queryKeys.ssh.ca,
		queryFn: getCaPublicKey,
	});

	const {
		data: certsData,
		isLoading: loadingCerts,
		isFetching: fetchingCerts,
		refetch: refetchCerts,
	} = useQuery({
		queryKey: queryKeys.ssh.certs(true),
		queryFn: () => getSshCertificates(true),
	});

	const revokeMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
			revokeSshCertificate(id, reason),
		onSuccess: () => {
			toast.success("Certificate revoked.");
			setCertToRevoke(null);
			setRevokeReason("");
			void queryClient.invalidateQueries({
				queryKey: queryKeys.ssh.certs(true),
			});
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to revoke certificate.",
			);
		},
	});

	async function handleRefresh() {
		await Promise.all([refetchCa(), refetchCerts()]);
	}

	function handleCopyKey() {
		if (!caData?.publicKey) {
			return;
		}
		navigator.clipboard.writeText(caData.publicKey);
		setCopiedKey(true);
		toast.success("CA public key copied to clipboard.");
		setTimeout(() => setCopiedKey(false), 2000);
	}

	if (loadingCa || loadingCerts) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	const certificates = certsData?.certificates ?? [];
	const nowSec = Math.floor(Date.now() / 1000);

	const counts = {
		all: certificates.length,
		active: certificates.filter((c) => !c.revokedAt && c.validBefore >= nowSec)
			.length,
		revoked: certificates.filter((c) => Boolean(c.revokedAt)).length,
		expired: certificates.filter((c) => !c.revokedAt && c.validBefore < nowSec)
			.length,
	};

	const filteredCertificates = certificates.filter((cert) => {
		const isRevoked = Boolean(cert.revokedAt);
		const isExpired = !isRevoked && cert.validBefore < nowSec;
		const isActive = !isRevoked && !isExpired;

		if (statusFilter === "active" && !isActive) return false;
		if (statusFilter === "revoked" && !isRevoked) return false;
		if (statusFilter === "expired" && !isExpired) return false;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			const matchesKeyId = cert.keyId.toLowerCase().includes(q);
			const matchesSerial = cert.serial.includes(q);
			const matchesPrincipal = cert.principals.some((p) =>
				p.toLowerCase().includes(q),
			);
			const matchesReason = cert.revokedReason?.toLowerCase().includes(q);
			return (
				matchesKeyId ||
				matchesSerial ||
				matchesPrincipal ||
				Boolean(matchesReason)
			);
		}

		return true;
	});

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="SSH Certificate Authority"
				description="Manage your OpenSSH Certificate Authority and monitor issued certificates."
				actions={
					<Button
						type="button"
						variant="secondary"
						size="sm"
						loading={fetchingCerts}
						onClick={handleRefresh}
						icon={<RefreshCw size={14} />}
					>
						Refresh
					</Button>
				}
			/>

			{/* Card 1: Certificate Authority */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-semibold">
							Certificate Authority
						</CardTitle>
						<Badge variant={caData ? "success" : "danger"}>
							{caData ? "Active" : "Not configured"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<span className="block text-xs font-medium text-zinc-500">
								Algorithm
							</span>
							<span className="mt-1 block font-mono text-sm text-zinc-200">
								{caData?.algorithm ?? "ssh-ed25519"}
							</span>
						</div>
						<div>
							<span className="block text-xs font-medium text-zinc-500">
								Fingerprint
							</span>
							<span className="mt-1 block font-mono text-xs text-zinc-400 truncate">
								{caData?.fingerprint ?? "—"}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs text-zinc-400">
							<span>Public key</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleCopyKey}
								icon={copiedKey ? <Check size={13} /> : <Copy size={13} />}
							>
								{copiedKey ? "Copied" : "Copy key"}
							</Button>
						</div>
						<div className="rounded-xl border border-white/8 bg-black/40 p-3 font-mono text-xs text-zinc-300 break-all select-all">
							{caData?.publicKey ?? "CA key unavailable"}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 2: Revocation Sync (systemd) - Collapsible */}
			<Card>
				<CardHeader
					className="cursor-pointer select-none transition-colors hover:bg-white/[0.02]"
					onClick={() => setInstallCardOpen((prev) => !prev)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<CardTitle className="text-sm font-semibold">
								Revocation sync (systemd)
							</CardTitle>
							<Badge variant="violet">Every 15 min</Badge>
						</div>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-xs text-zinc-400 hover:text-white pointer-events-none"
							>
								{installCardOpen ? "Hide setup" : "Setup guide"}
							</Button>
							<ChevronDown
								size={16}
								className={`text-zinc-400 transition-transform duration-200 ${
									installCardOpen ? "rotate-180" : ""
								}`}
							/>
						</div>
					</div>
				</CardHeader>
				{installCardOpen && (
					<CardContent className="space-y-5 border-t border-white/6 pt-5">
						<p className="text-xs text-zinc-400 leading-relaxed">
							Keep host{" "}
							<code className="font-mono text-zinc-300">
								/etc/ssh/revoked_keys
							</code>{" "}
							synchronized with this instance&apos;s Key Revocation List (KRL).
							Deploy this systemd timer on your servers so revoked certificates
							are immediately denied by OpenSSH.
						</p>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between text-xs text-zinc-400">
								<span>Instance raw revocation endpoint</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => handleCopySnippet(revokedKeysUrl, "url")}
									icon={
										copiedSnippet === "url" ? (
											<Check size={13} />
										) : (
											<Copy size={13} />
										)
									}
								>
									{copiedSnippet === "url" ? "Copied" : "Copy URL"}
								</Button>
							</div>
							<div className="rounded-xl border border-white/8 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-300 truncate select-all">
								{revokedKeysUrl}
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/6 w-fit text-xs">
								<button
									type="button"
									onClick={() => setSyncTab("quick")}
									className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
										syncTab === "quick"
											? "bg-white/10 text-white"
											: "text-zinc-400 hover:text-zinc-200"
									}`}
								>
									Quick install
								</button>
								<button
									type="button"
									onClick={() => setSyncTab("service")}
									className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
										syncTab === "service"
											? "bg-white/10 text-white"
											: "text-zinc-400 hover:text-zinc-200"
									}`}
								>
									ssh-revoked-keys.service
								</button>
								<button
									type="button"
									onClick={() => setSyncTab("timer")}
									className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
										syncTab === "timer"
											? "bg-white/10 text-white"
											: "text-zinc-400 hover:text-zinc-200"
									}`}
								>
									ssh-revoked-keys.timer
								</button>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between text-xs text-zinc-400">
									<span className="font-mono text-[11px] text-zinc-500">
										{syncTab === "quick"
											? "Automated setup script"
											: syncTab === "service"
												? "/etc/systemd/system/ssh-revoked-keys.service"
												: "/etc/systemd/system/ssh-revoked-keys.timer"}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => handleCopySnippet(currentSnippet, syncTab)}
										icon={
											copiedSnippet === syncTab ? (
												<Check size={13} />
											) : (
												<Copy size={13} />
											)
										}
									>
										{copiedSnippet === syncTab
											? "Copied"
											: "Copy configuration"}
									</Button>
								</div>
								<pre className="overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-3 font-mono text-xs text-zinc-300 leading-relaxed break-all select-all whitespace-pre">
									{currentSnippet}
								</pre>
							</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Card 3: Issued Certificates */}
			<Card>
				<CardHeader className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2.5">
							<CardTitle className="text-sm font-semibold">
								Issued certificates
							</CardTitle>
							<Badge variant="default">{certificates.length} Total</Badge>
						</div>

						{/* Search Input */}
						<div className="relative w-full sm:w-64">
							<Search
								size={13}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
							/>
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Filter key ID or serial..."
								className="pl-8 text-xs py-1.5 h-8 bg-black/40 border-white/10"
							/>
						</div>
					</div>

					{/* Status Filter Tabs */}
					<div className="flex items-center gap-1 border-t border-white/6 pt-3 text-xs">
						<button
							type="button"
							onClick={() => setStatusFilter("active")}
							className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
								statusFilter === "active"
									? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							Active ({counts.active})
						</button>
						<button
							type="button"
							onClick={() => setStatusFilter("revoked")}
							className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
								statusFilter === "revoked"
									? "bg-red-500/10 text-red-400 border border-red-500/20"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							Revoked ({counts.revoked})
						</button>
						<button
							type="button"
							onClick={() => setStatusFilter("expired")}
							className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
								statusFilter === "expired"
									? "bg-zinc-800 text-zinc-300 border border-zinc-700"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							Expired ({counts.expired})
						</button>
						<button
							type="button"
							onClick={() => setStatusFilter("all")}
							className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
								statusFilter === "all"
									? "bg-white/10 text-white border border-white/20"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							All ({counts.all})
						</button>
					</div>
				</CardHeader>
				{filteredCertificates.length === 0 ? (
					<CardContent>
						<p className="text-sm text-zinc-500 text-center py-6">
							{certificates.length === 0
								? "No certificates have been issued yet."
								: `No ${statusFilter === "all" ? "" : statusFilter} certificates match your filter.`}
						</p>
					</CardContent>
				) : (
					<div className="divide-y divide-white/6">
						{filteredCertificates.map((cert) => {
							const isRevoked = Boolean(cert.revokedAt);
							const isExpired = !isRevoked && cert.validBefore < nowSec;
							return (
								<div
									key={cert.id}
									className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="space-y-1.5 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium text-sm text-white truncate">
												{cert.keyId}
											</span>
											{isRevoked ? (
												<Badge variant="danger" size="sm">
													Revoked
												</Badge>
											) : isExpired ? (
												<Badge variant="default" size="sm">
													Expired
												</Badge>
											) : (
												<Badge variant="success" size="sm">
													Active
												</Badge>
											)}
										</div>
										<div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
											<span className="text-zinc-500">Principals:</span>
											{cert.principals.map((p) => (
												<Badge
													key={p}
													variant="violet"
													size="sm"
													className="text-[11px] font-mono"
												>
													{p}
												</Badge>
											))}
										</div>
										{isRevoked && cert.revokedReason && (
											<p className="text-xs text-red-400/80">
												Reason: {cert.revokedReason}
											</p>
										)}
									</div>

									<div className="flex items-center gap-3 self-end sm:self-center">
										<div className="text-xs text-zinc-400 sm:text-right space-y-0.5 shrink-0">
											<div>
												{cert.revokedAt
													? `Revoked on ${new Date(cert.revokedAt).toLocaleDateString()}`
													: `Expires ${new Date(cert.validBefore * 1000).toLocaleDateString()}`}
											</div>
											{cert.clientIp && (
												<div className="font-mono text-zinc-500 text-[11px]">
													IP: {cert.clientIp}
												</div>
											)}
										</div>

										{!isRevoked && !isExpired && canRevoke && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													setCertToRevoke(cert);
													setRevokeReason("");
												}}
											>
												<span className="text-red-400 hover:text-red-300">
													Revoke
												</span>
											</Button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>

			{/* Revoke Certificate Modal */}
			<Modal
				open={Boolean(certToRevoke)}
				title="Revoke certificate"
				description={`Revoke certificate for "${certToRevoke?.keyId}" (serial: ${certToRevoke?.serial})?`}
				onClose={() => setCertToRevoke(null)}
				size="sm"
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<label
							htmlFor="revoke-reason"
							className="block text-sm font-medium text-zinc-300"
						>
							Reason (optional)
						</label>
						<Input
							id="revoke-reason"
							value={revokeReason}
							onChange={(e) => setRevokeReason(e.target.value)}
							placeholder="e.g. Lost device, offboarding"
						/>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setCertToRevoke(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="danger"
							loading={revokeMutation.isPending}
							onClick={() => {
								if (certToRevoke) {
									revokeMutation.mutate({
										id: certToRevoke.id,
										reason: revokeReason.trim() || undefined,
									});
								}
							}}
						>
							Revoke certificate
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
