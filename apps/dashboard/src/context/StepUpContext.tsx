import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, KeyRound, ShieldAlert } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal, { ModalErrorAlert } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import {
	getElevateOptions,
	type ElevateOptionsResponse,
	verifyElevate,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface StepUpContextType {
	elevate: () => Promise<boolean>;
	requireElevation: <T>(action: () => Promise<T>) => Promise<T>;
}

const StepUpContext = createContext<StepUpContextType | null>(null);

export function StepUpProvider({ children }: { children: ReactNode }) {
	const toast = useToast();
	const [isOpen, setIsOpen] = useState(false);
	const [loadingOptions, setLoadingOptions] = useState(false);
	const [options, setOptions] = useState<ElevateOptionsResponse | null>(null);
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resolverRef = useRef<((value: boolean) => void) | null>(null);

	const openModal = useCallback(async () => {
		setError(null);
		setPassword("");
		setLoadingOptions(true);
		setIsOpen(true);

		try {
			const opt = await getElevateOptions();
			setOptions(opt);
			setLoadingOptions(false);
		} catch (err) {
			setLoadingOptions(false);
			setError(
				err instanceof Error
					? err.message
					: "Failed to initialize elevation prompt.",
			);
		}

		return new Promise<boolean>((resolve) => {
			resolverRef.current = resolve;
		});
	}, []);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		if (resolverRef.current) {
			resolverRef.current(false);
			resolverRef.current = null;
		}
	};

	const handlePasskeyVerification = async () => {
		if (!options?.challenge) return;
		setIsSubmitting(true);
		setError(null);

		try {
			const credential = await startAuthentication({
				optionsJSON: {
					challenge: options.challenge,
					rpId: options.rpId,
					timeout: options.timeout,
					userVerification: options.userVerification as never,
					allowCredentials: options.allowCredentials as never,
				},
			});

			await verifyElevate({
				type: "passkey",
				challengeId: options.challengeId,
				response: credential as unknown as Record<string, unknown>,
			});

			setIsOpen(false);
			toast.success("Identity verified successfully.");
			if (resolverRef.current) {
				resolverRef.current(true);
				resolverRef.current = null;
			}
		} catch (err) {
			if (
				err instanceof Error &&
				(err.name === "NotAllowedError" ||
					err.message.toLowerCase().includes("not allowed") ||
					err.message.toLowerCase().includes("cancelled"))
			) {
				setError("Passkey verification cancelled.");
			} else {
				setError(
					err instanceof Error ? err.message : "Passkey verification failed.",
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePasswordVerification = async (e?: React.FormEvent) => {
		if (e) {
			e.preventDefault();
		}
		if (!password.trim()) return;

		setIsSubmitting(true);
		setError(null);

		try {
			await verifyElevate({
				type: "password",
				password: password.trim(),
			});

			setIsOpen(false);
			toast.success("Identity verified successfully.");
			if (resolverRef.current) {
				resolverRef.current(true);
				resolverRef.current = null;
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Invalid password entered.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const requireElevation = useCallback(
		async <T,>(action: () => Promise<T>): Promise<T> => {
			try {
				return await action();
			} catch (err) {
				if (err instanceof ApiError && err.code === "STEP_UP_REQUIRED") {
					const ok = await openModal();
					if (ok) {
						return await action();
					}
					throw new Error("Action cancelled: security verification required.");
				}
				throw err;
			}
		},
		[openModal],
	);

	return (
		<StepUpContext.Provider value={{ elevate: openModal, requireElevation }}>
			{children}

			<Modal
				open={isOpen}
				title="Confirm Your Identity"
				description="This sensitive action requires step-up re-authentication."
				onClose={handleClose}
				size="md"
			>
				<div className="space-y-5">
					<ModalErrorAlert error={error} />

					{loadingOptions ? (
						<div className="flex flex-col items-center justify-center py-8 gap-3">
							<Spinner size="md" />
							<span className="text-xs text-zinc-400">
								Initializing authentication challenge...
							</span>
						</div>
					) : (
						<>
							{options?.hasPasskeys && (
								<div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
									<div className="flex items-center gap-3">
										<div className="flex size-9 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400">
											<Fingerprint size={18} />
										</div>
										<div>
											<h4 className="text-xs font-semibold text-white">
												Biometric or Security Key
											</h4>
											<p className="text-[11px] text-zinc-400">
												Verify using Touch ID, Face ID, Windows Hello, or
												YubiKey.
											</p>
										</div>
									</div>

									<Button
										type="button"
										variant="primary"
										className="w-full"
										loading={isSubmitting}
										onClick={handlePasskeyVerification}
										icon={<ShieldAlert size={14} />}
									>
										Verify with Passkey
									</Button>
								</div>
							)}

							{options?.hasPasskeys && options?.hasPassword && (
								<div className="flex items-center gap-3">
									<div className="h-px flex-1 bg-white/10" />
									<span className="text-[11px] font-medium uppercase text-zinc-500">
										Or continue with password
									</span>
									<div className="h-px flex-1 bg-white/10" />
								</div>
							)}

							{options?.hasPassword && (
								<form
									onSubmit={handlePasswordVerification}
									className="space-y-3"
								>
									<div>
										<label
											htmlFor="stepup-password"
											className="block text-xs font-medium text-zinc-300 mb-1.5"
										>
											Account password:
										</label>
										<Input
											id="stepup-password"
											type="password"
											placeholder="Enter your current password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											disabled={isSubmitting}
											autoFocus={!options.hasPasskeys}
										/>
									</div>

									<Button
										type="submit"
										variant={options.hasPasskeys ? "secondary" : "primary"}
										className="w-full"
										loading={isSubmitting}
										disabled={!password.trim() || isSubmitting}
										icon={<KeyRound size={14} />}
									>
										Verify with Password
									</Button>
								</form>
							)}
						</>
					)}

					<div className="flex justify-center pt-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
					</div>
				</div>
			</Modal>
		</StepUpContext.Provider>
	);
}

export function useStepUp() {
	const context = useContext(StepUpContext);
	if (!context) {
		throw new Error("useStepUp must be used within a StepUpProvider");
	}
	return context;
}
