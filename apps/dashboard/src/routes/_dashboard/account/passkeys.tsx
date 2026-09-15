import { startRegistration } from "@simplewebauthn/browser";
import { createFileRoute } from "@tanstack/react-router";
import { Fingerprint, KeyRound, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import {
	deletePasskey,
	getPasskeys,
	getPasskeyRegistrationOptions,
	type Passkey,
	verifyPasskeyRegistration,
} from "@/lib/api";
import {
	type FieldValidators,
	validateForm,
	validators,
} from "@/lib/validation";

export const Route = createFileRoute("/_dashboard/account/passkeys")({
	staticData: {
		navigation: {
			label: "Passkeys",
			order: 20,
		},
	},
	component: PasskeysPage,
});

const PASSKEY_VALIDATORS: FieldValidators<{ passkeyName: string }> = {
	passkeyName: [
		validators.maxLength(100, "Passkey name must be 100 characters or fewer."),
	],
};

function PasskeysPage() {
	const toast = useToast();

	const [passkeys, setPasskeys] = useState<Passkey[]>([]);
	const [loading, setLoading] = useState(true);
	const [registering, setRegistering] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);
	const [registerModalOpen, setRegisterModalOpen] = useState(false);
	const [passkeyName, setPasskeyName] = useState("");

	const { errors, isValid } = useMemo(
		() => validateForm({ passkeyName }, PASSKEY_VALIDATORS),
		[passkeyName],
	);

	const canRegister = isValid && !registering;

	const loadPasskeys = useCallback(async () => {
		try {
			const response = await getPasskeys();
			setPasskeys(response.passkeys);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to load passkeys.",
			);
		} finally {
			setLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		void loadPasskeys();
	}, [loadPasskeys]);

	async function handleRegister() {
		if (!canRegister) {
			return;
		}

		setRegistering(true);

		try {
			const options = await getPasskeyRegistrationOptions();

			const response = await startRegistration({
				optionsJSON: options,
			});

			await verifyPasskeyRegistration(
				response,
				passkeyName.trim() || "Passkey",
			);

			setPasskeyName("");
			setRegisterModalOpen(false);

			await loadPasskeys();
		} catch (error) {
			if (
				error instanceof Error &&
				(error.name === "NotAllowedError" ||
					error.message.toLowerCase().includes("not allowed"))
			) {
				setRegisterModalOpen(false);
				setPasskeyName("");
				toast.error("Passkey registration was cancelled.");
				return;
			}

			toast.error(
				error instanceof Error ? error.message : "Unable to register passkey.",
			);
		} finally {
			setRegistering(false);
		}
	}

	async function handleDelete() {
		if (!passkeyToDelete) {
			return;
		}

		const id = passkeyToDelete.id;
		setDeleting(id);

		try {
			await deletePasskey(id);
			setPasskeys((current) => current.filter((passkey) => passkey.id !== id));
			setPasskeyToDelete(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to remove passkey.",
			);
		} finally {
			setDeleting(null);
		}
	}

	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="Passkeys"
				description="Manage FIDO2/WebAuthn credentials for fast, phishing-resistant passwordless login."
				actions={
					<Button
						type="button"
						onClick={() => setRegisterModalOpen(true)}
						icon={<Plus size={16} />}
					>
						Register passkey
					</Button>
				}
			/>

			{passkeys.length === 0 ? (
				<EmptyState
					icon={<KeyRound size={24} />}
					title="No passkeys registered"
					description="Passkeys allow you to sign in safely using your fingerprint, face recognition, or hardware security key."
					action={
						<Button
							type="button"
							onClick={() => setRegisterModalOpen(true)}
							icon={<Plus size={16} />}
						>
							Register your first passkey
						</Button>
					}
				/>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold">
								Your passkeys
							</CardTitle>
							<Badge variant="success">{passkeys.length} Registered</Badge>
						</div>
					</CardHeader>
					<div className="divide-y divide-white/6">
						{passkeys.map((passkey) => (
							<div
								key={passkey.id}
								className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="flex items-start gap-3.5 min-w-0">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
										<Fingerprint size={20} />
									</div>
									<div className="min-w-0">
										<h4 className="truncate text-sm font-medium text-white">
											{passkey.name ?? "Unnamed passkey"}
										</h4>
										<p className="mt-0.5 truncate font-mono text-xs text-zinc-500 max-w-xs sm:max-w-md">
											{passkey.id}
										</p>
										<div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
											<span>
												Created:{" "}
												{new Date(passkey.createdAt).toLocaleDateString(
													undefined,
													{
														month: "short",
														day: "numeric",
														year: "numeric",
													},
												)}
											</span>
											<span>•</span>
											<span>
												Last used:{" "}
												{passkey.lastUsedAt
													? new Date(passkey.lastUsedAt).toLocaleDateString(
															undefined,
															{
																month: "short",
																day: "numeric",
																year: "numeric",
															},
														)
													: "Never"}
											</span>
										</div>
									</div>
								</div>

								<Button
									type="button"
									variant="danger"
									size="sm"
									disabled={deleting === passkey.id}
									loading={deleting === passkey.id}
									onClick={() => setPasskeyToDelete(passkey)}
									icon={<Trash2 size={14} />}
									className="self-end sm:self-center shrink-0"
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				</Card>
			)}

			{/* Register Modal */}
			<Modal
				open={registerModalOpen}
				title="Register new passkey"
				description="Choose a friendly name for this credential (e.g. 'MacBook Touch ID' or 'YubiKey 5C')."
				onClose={() => {
					if (!registering) {
						setRegisterModalOpen(false);
						setPasskeyName("");
					}
				}}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void handleRegister();
					}}
					className="space-y-5"
				>
					<div>
						<label
							htmlFor="passkey-name"
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Passkey name
						</label>

						<Input
							id="passkey-name"
							name="passkey-name"
							type="text"
							placeholder="e.g. Work MacBook"
							value={passkeyName}
							onChange={(event) => setPasskeyName(event.target.value)}
							hasError={Boolean(errors.passkeyName && passkeyName)}
							autoFocus
							disabled={registering}
						/>
						{errors.passkeyName && passkeyName && (
							<p className="mt-1.5 text-xs text-red-400">
								{errors.passkeyName}
							</p>
						)}
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="ghost"
							disabled={registering}
							onClick={() => {
								setRegisterModalOpen(false);
								setPasskeyName("");
							}}
						>
							Cancel
						</Button>

						<Button type="submit" loading={registering} disabled={!canRegister}>
							Continue
						</Button>
					</div>
				</form>
			</Modal>

			{/* Remove Modal */}
			<Modal
				open={passkeyToDelete !== null}
				title="Remove passkey?"
				description="Are you sure you want to remove this passkey? You will no longer be able to use it to authenticate."
				onClose={() => {
					if (!deleting) {
						setPasskeyToDelete(null);
					}
				}}
			>
				<div className="flex justify-end gap-3 pt-4">
					<Button
						type="button"
						variant="ghost"
						disabled={deleting !== null}
						onClick={() => setPasskeyToDelete(null)}
					>
						Cancel
					</Button>

					<Button
						type="button"
						variant="danger"
						loading={deleting !== null}
						onClick={() => void handleDelete()}
					>
						Remove passkey
					</Button>
				</div>
			</Modal>
		</div>
	);
}
