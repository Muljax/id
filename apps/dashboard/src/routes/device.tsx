import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Laptop,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstanceLogo from "@/components/ui/InstanceLogo";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import {
	approveOAuthDevice,
	denyOAuthDevice,
	getOAuthDeviceDetails,
} from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";

export interface DeviceSearch {
	user_code?: string;
}

export const Route = createFileRoute("/device")({
	validateSearch: (search: Record<string, unknown>): DeviceSearch => ({
		user_code:
			typeof search.user_code === "string" ? search.user_code : undefined,
	}),
	staticData: {
		title: "Device Activation",
	},
	component: DeviceActivationPage,
});

function formatCode(input: string): string {
	const cleaned = input.replaceAll(/[^A-Za-z0-9]/g, "").toUpperCase();
	if (cleaned.length > 4) {
		return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
	}
	return cleaned;
}

function DeviceActivationPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { user, loading: authLoading } = useAuth();

	const [inputCode, setInputCode] = useState(search.user_code ?? "");
	const [activeCode, setActiveCode] = useState(
		search.user_code ? formatCode(search.user_code) : "",
	);
	const [actionResult, setActionResult] = useState<
		"approved" | "denied" | null
	>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (search.user_code) {
			const formatted = formatCode(search.user_code);
			setInputCode(search.user_code);
			setActiveCode(formatted);
		}
	}, [search.user_code]);

	const {
		data: deviceDetails,
		isLoading: loadingDetails,
		error: detailsError,
	} = useQuery({
		queryKey: queryKeys.oauth.deviceDetails(activeCode),
		queryFn: () => getOAuthDeviceDetails(activeCode),
		enabled: Boolean(activeCode && activeCode.length >= 8),
		retry: false,
	});

	const approveMutation = useMutation({
		mutationFn: () => approveOAuthDevice(activeCode),
		onSuccess: () => {
			setActionResult("approved");
			setErrorMessage(null);
		},
		onError: (err) => {
			setErrorMessage(
				err instanceof Error ? err.message : "Failed to approve device.",
			);
		},
	});

	const denyMutation = useMutation({
		mutationFn: () => denyOAuthDevice(activeCode),
		onSuccess: () => {
			setActionResult("denied");
			setErrorMessage(null);
		},
		onError: (err) => {
			setErrorMessage(
				err instanceof Error ? err.message : "Failed to deny device.",
			);
		},
	});

	function handleCodeSubmit(e: React.FormEvent) {
		e.preventDefault();
		const formatted = formatCode(inputCode);
		if (formatted.length >= 8) {
			setActiveCode(formatted);
			setActionResult(null);
			setErrorMessage(null);
			navigate({
				search: () => ({ user_code: formatted }),
			});
		}
	}

	if (authLoading) {
		return (
			<PreAuthLayout>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Spinner size="lg" />
					<p className="mt-4 text-sm text-zinc-400">Loading your session...</p>
				</div>
			</PreAuthLayout>
		);
	}

	if (!user) {
		const currentUrl = activeCode
			? `/device?user_code=${encodeURIComponent(activeCode)}`
			: "/device";
		return (
			<PreAuthLayout>
				<div className="flex flex-col items-center text-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400 shadow-inner">
						<Laptop size={28} />
					</div>
					<h1 className="mt-4 text-xl font-semibold text-white">
						Sign In to Connect Device
					</h1>
					<p className="mt-2 text-sm text-zinc-400">
						You need to be signed in to your {INSTANCE_NAME} account to
						authorize a device or CLI session.
					</p>

					<div className="mt-6 w-full">
						<Button
							variant="primary"
							className="w-full justify-center"
							onClick={() => {
								window.location.href = `/login?return_to=${encodeURIComponent(
									currentUrl,
								)}`;
							}}
						>
							Sign In with Passkey or Password
						</Button>
					</div>
				</div>
			</PreAuthLayout>
		);
	}

	if (actionResult === "approved") {
		return (
			<PreAuthLayout>
				<div className="flex flex-col items-center text-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner">
						<CheckCircle2 size={28} />
					</div>
					<h1 className="mt-4 text-xl font-semibold text-white">
						Device Connected
					</h1>
					<p className="mt-2 text-sm text-zinc-300">
						Successfully authorized{" "}
						<span className="font-semibold text-white">
							{deviceDetails?.client_name ?? "your device"}
						</span>
						.
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						You can safely close this browser window and return to your
						terminal.
					</p>

					<div className="mt-6 w-full">
						<Button
							variant="secondary"
							className="w-full justify-center"
							onClick={() => navigate({ to: "/" })}
						>
							Go to Dashboard
						</Button>
					</div>
				</div>
			</PreAuthLayout>
		);
	}

	if (actionResult === "denied") {
		return (
			<PreAuthLayout>
				<div className="flex flex-col items-center text-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 shadow-inner">
						<XCircle size={28} />
					</div>
					<h1 className="mt-4 text-xl font-semibold text-white">
						Device Denied
					</h1>
					<p className="mt-2 text-sm text-zinc-400">
						The device authorization request was denied.
					</p>

					<div className="mt-6 w-full">
						<Button
							variant="secondary"
							className="w-full justify-center"
							onClick={() => {
								setActiveCode("");
								setInputCode("");
								setActionResult(null);
								navigate({
									search: () => ({ user_code: undefined }),
								});
							}}
						>
							Authorize Another Device
						</Button>
					</div>
				</div>
			</PreAuthLayout>
		);
	}

	return (
		<PreAuthLayout>
			<div className="flex flex-col">
				{/* Top branding */}
				<div className="mb-6 flex items-center justify-between border-b border-white/6 pb-5">
					<div className="flex items-center gap-3">
						<InstanceLogo className="h-8 w-8 rounded-xl border border-white/10" />
						<div>
							<div className="text-sm font-semibold text-white">
								{INSTANCE_NAME}
							</div>
							<div className="text-xs text-zinc-500">Device Activation</div>
						</div>
					</div>
				</div>

				{/* Code input form if no active code or not yet entered */}
				{!activeCode ? (
					<form onSubmit={handleCodeSubmit} className="space-y-4">
						<div>
							<h1 className="text-lg font-semibold text-white">
								Connect a New Device
							</h1>
							<p className="mt-1 text-xs text-zinc-400 leading-relaxed">
								Enter the 8-character activation code displayed on your
								terminal, CLI, or headless device.
							</p>
						</div>

						<div>
							<label
								htmlFor="user-code-input"
								className="block text-xs font-medium text-zinc-300 mb-1.5"
							>
								User Code
							</label>
							<Input
								id="user-code-input"
								type="text"
								value={inputCode}
								onChange={(e) => setInputCode(formatCode(e.target.value))}
								placeholder="WDJB-4921"
								maxLength={9}
								className="text-center font-mono text-lg tracking-widest uppercase font-semibold py-3"
								autoFocus
							/>
						</div>

						<Button
							type="submit"
							variant="primary"
							disabled={formatCode(inputCode).length < 8}
							className="w-full justify-center"
						>
							<span>Continue</span>
							<ArrowRight size={16} />
						</Button>
					</form>
				) : loadingDetails ? (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Spinner size="md" />
						<p className="mt-3 text-xs text-zinc-400">
							Validating code{" "}
							<span className="font-mono text-zinc-200">{activeCode}</span>...
						</p>
					</div>
				) : detailsError || !deviceDetails || deviceDetails.expired ? (
					<div className="flex flex-col items-center text-center space-y-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
							<AlertTriangle size={24} />
						</div>
						<div>
							<h2 className="text-base font-semibold text-white">
								Invalid or Expired Code
							</h2>
							<p className="mt-1 text-xs text-zinc-400">
								The code{" "}
								<span className="font-mono text-zinc-300">{activeCode}</span> is
								invalid, has expired, or was already used.
							</p>
						</div>
						<Button
							variant="secondary"
							className="w-full justify-center"
							onClick={() => {
								setActiveCode("");
								setInputCode("");
								navigate({
									search: () => ({ user_code: undefined }),
								});
							}}
						>
							Enter Different Code
						</Button>
					</div>
				) : (
					/* Explicit Device Confirmation View */
					<div className="space-y-5">
						<div>
							<h1 className="text-lg font-semibold text-white">
								Confirm Device Authorization
							</h1>
							<p className="mt-1 text-xs text-zinc-400 leading-relaxed">
								Please verify that the code on your device matches the code
								below before granting access.
							</p>
						</div>

						{/* Code Verification Box */}
						<div className="flex flex-col items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/5 py-4 px-3 text-center">
							<span className="text-[11px] font-medium tracking-wider uppercase text-zinc-400">
								Activation Code
							</span>
							<span className="mt-1 font-mono text-2xl font-bold tracking-widest text-violet-300">
								{activeCode}
							</span>
						</div>

						{/* Requesting Application Details */}
						<div className="flex items-center gap-3.5 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
								<Laptop size={20} />
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-[11px] font-medium text-zinc-400">
									Requesting Application
								</div>
								<div className="truncate text-sm font-semibold text-white">
									{deviceDetails.client_name}
								</div>
							</div>
						</div>

						{/* Requested Scopes */}
						<div>
							<div className="text-xs font-medium text-zinc-400 mb-2">
								Requested Permissions:
							</div>
							<div className="flex flex-wrap gap-1.5">
								{deviceDetails.scopes.map((scope) => (
									<Badge key={scope} variant="default" size="sm">
										<ShieldCheck size={12} className="text-violet-400" />
										<span>{scope}</span>
									</Badge>
								))}
							</div>
						</div>

						{errorMessage && (
							<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
								{errorMessage}
							</div>
						)}

						<div className="flex items-center gap-3 pt-2">
							<Button
								variant="secondary"
								className="flex-1 justify-center"
								disabled={denyMutation.isPending || approveMutation.isPending}
								onClick={() => denyMutation.mutate()}
							>
								{denyMutation.isPending ? <Spinner size="sm" /> : "Deny"}
							</Button>
							<Button
								variant="primary"
								className="flex-1 justify-center"
								disabled={approveMutation.isPending || denyMutation.isPending}
								onClick={() => approveMutation.mutate()}
							>
								{approveMutation.isPending ? (
									<Spinner size="sm" />
								) : (
									"Confirm & Connect"
								)}
							</Button>
						</div>

						<div className="text-center">
							<button
								type="button"
								onClick={() => {
									setActiveCode("");
									setInputCode("");
									navigate({
										search: () => ({ user_code: undefined }),
									});
								}}
								className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
							>
								Not your device? Enter different code
							</button>
						</div>
					</div>
				)}
			</div>
		</PreAuthLayout>
	);
}
