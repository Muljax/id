import { startRegistration } from "@simplewebauthn/browser";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import {
	deletePasskey,
	getPasskeys,
	getPasskeyRegistrationOptions,
	type Passkey,
	verifyPasskeyRegistration,
} from "@/lib/api";

export const Route = createFileRoute("/_dashboard/account/passkeys")({
	staticData: {
		navigation: {
			label: "Passkeys",
			order: 20,
		},
	},
	component: PasskeysPage,
});

function PasskeysPage() {
	const toast = useToast();

	const [passkeys, setPasskeys] = useState<Passkey[]>([]);
	const [loading, setLoading] = useState(true);
	const [registering, setRegistering] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);
	const [registerModalOpen, setRegisterModalOpen] = useState(false);
	const [passkeyName, setPasskeyName] = useState("");

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

			toast.success("Passkey registered.");
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

			toast.success("Passkey removed.");
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
		<div className="max-w-2xl">
			<div className="mb-8 flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
						Passkeys
					</h1>

					<p className="mt-2 text-sm leading-6 text-zinc-500">
						Manage the passkeys you use to sign in to your Muljax ID account.
					</p>
				</div>

				<Button
					type="button"
					disabled={registering}
					onClick={() => setRegisterModalOpen(true)}
					className="shrink-0"
				>
					Register passkey
				</Button>
			</div>

			{passkeys.length === 0 ? (
				<div className="rounded-2xl border border-white/10 bg-white/2 px-6 py-6">
					<p className="text-sm text-zinc-500">
						You have not registered any passkeys.
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
					<div className="border-b border-white/8 px-6 py-5">
						<h2 className="text-sm font-medium text-white">Your passkeys</h2>

						<p className="mt-1 text-sm text-zinc-500">
							Use a passkey for fast and secure sign-in without a password.
						</p>
					</div>

					<div className="divide-y divide-white/8">
						{passkeys.map((passkey) => (
							<div key={passkey.id} className="px-6 py-6">
								<div className="flex items-start justify-between gap-5">
									<div className="min-w-0">
										<h2 className="truncate text-base font-medium text-white">
											{passkey.name ?? "Unnamed passkey"}
										</h2>

										<p className="mt-1 break-all font-mono text-xs text-zinc-600">
											{passkey.id}
										</p>
									</div>

									<Button
										type="button"
										variant="danger"
										disabled={deleting === passkey.id}
										onClick={() => setPasskeyToDelete(passkey)}
										className="shrink-0"
									>
										Remove
									</Button>
								</div>

								<div className="mt-5 grid gap-4 sm:grid-cols-2">
									<div>
										<p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
											Created
										</p>

										<p className="mt-2 text-sm text-zinc-400">
											{new Date(passkey.createdAt).toLocaleDateString(
												undefined,
												{
													month: "long",
													day: "numeric",
													year: "numeric",
												},
											)}
										</p>
									</div>

									<div>
										<p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
											Last used
										</p>

										<p className="mt-2 text-sm text-zinc-400">
											{passkey.lastUsedAt
												? new Date(passkey.lastUsedAt).toLocaleDateString(
														undefined,
														{
															month: "long",
															day: "numeric",
															year: "numeric",
														},
													)
												: "Never"}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<Modal
				open={registerModalOpen}
				title="Register passkey"
				description="Choose a name for this passkey so you can identify it later."
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
							Name
						</label>

						<Input
							id="passkey-name"
							name="passkey-name"
							type="text"
							placeholder="e.g. MacBook Pro"
							value={passkeyName}
							onChange={(event) => setPasskeyName(event.target.value)}
							maxLength={100}
							autoFocus
							disabled={registering}
						/>
					</div>

					<div className="flex justify-end gap-3">
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

						<Button type="submit" disabled={registering}>
							{registering ? "Registering..." : "Continue"}
						</Button>
					</div>
				</form>
			</Modal>

			<Modal
				open={passkeyToDelete !== null}
				title="Remove passkey"
				description="Are you sure you want to remove this passkey? You will no longer be able to use it to sign in to your Muljax ID account."
				onClose={() => {
					if (!deleting) {
						setPasskeyToDelete(null);
					}
				}}
			>
				<div className="flex justify-end gap-3">
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
						disabled={deleting !== null}
						onClick={() => void handleDelete()}
					>
						{deleting !== null ? "Removing..." : "Remove passkey"}
					</Button>
				</div>
			</Modal>
		</div>
	);
}
