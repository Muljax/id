import { startRegistration } from "@simplewebauthn/browser";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Fingerprint, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
	deletePasskey,
	getPasskeys,
	getPasskeyRegistrationOptions,
	renamePasskey,
	type Passkey,
	verifyPasskeyRegistration,
} from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import {
	type FieldValidators,
	validateField,
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
		validators.required("Passkey name is required."),
		validators.maxLength(100, "Passkey name must be 100 characters or fewer."),
	],
};

function PasskeysPage() {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);
	const [passkeyToRename, setPasskeyToRename] = useState<Passkey | null>(null);
	const [registerModalOpen, setRegisterModalOpen] = useState(false);

	const { data: passkeys = [], isLoading } = useQuery({
		queryKey: queryKeys.account.passkeys,
		queryFn: async () => {
			const res = await getPasskeys();
			return res.passkeys;
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deletePasskey(id),
		onSuccess: () => {
			setPasskeyToDelete(null);
			toast.success("Passkey removed successfully.");
			void queryClient.invalidateQueries({
				queryKey: queryKeys.account.passkeys,
			});
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Unable to remove passkey.",
			);
		},
	});

	const renameMutation = useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			renamePasskey(id, name),
		onSuccess: () => {
			setPasskeyToRename(null);
			toast.success("Passkey renamed successfully.");
			void queryClient.invalidateQueries({
				queryKey: queryKeys.account.passkeys,
			});
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Unable to rename passkey.",
			);
		},
	});

	const registerForm = useForm({
		defaultValues: {
			passkeyName: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const options = await getPasskeyRegistrationOptions();

				const response = await startRegistration({
					optionsJSON: options as Parameters<
						typeof startRegistration
					>[0]["optionsJSON"],
				});

				await verifyPasskeyRegistration(
					response,
					value.passkeyName.trim() || "Passkey",
				);

				registerForm.reset();
				setRegisterModalOpen(false);
				toast.success("Passkey registered successfully.");

				void queryClient.invalidateQueries({
					queryKey: queryKeys.account.passkeys,
				});
			} catch (error) {
				if (
					error instanceof Error &&
					(error.name === "NotAllowedError" ||
						error.message.toLowerCase().includes("not allowed"))
				) {
					setRegisterModalOpen(false);
					registerForm.reset();
					toast.error("Passkey registration was cancelled.");
					return;
				}

				toast.error(
					error instanceof Error
						? error.message
						: "Unable to register passkey.",
				);
			}
		},
	});

	const renameForm = useForm({
		defaultValues: {
			passkeyName: passkeyToRename?.name ?? "",
		},
		onSubmit: async ({ value }) => {
			if (!passkeyToRename) return;
			await renameMutation.mutateAsync({
				id: passkeyToRename.id,
				name: value.passkeyName.trim(),
			});
		},
	});

	async function handleDelete() {
		if (!passkeyToDelete) {
			return;
		}
		await deleteMutation.mutateAsync(passkeyToDelete.id);
	}

	if (isLoading) {
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
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
										<Fingerprint size={20} />
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<h4 className="truncate text-sm font-medium text-white">
												{passkey.name ?? "Unnamed passkey"}
											</h4>
											<button
												type="button"
												onClick={() => {
													setPasskeyToRename(passkey);
													renameForm.setFieldValue(
														"passkeyName",
														passkey.name ?? "",
													);
												}}
												className="rounded p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
												title="Rename passkey"
											>
												<Pencil size={13} />
											</button>
										</div>
										<div className="mt-1 flex flex-wrap gap-4 text-xs text-zinc-400">
											<span>
												Added{" "}
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
									disabled={
										deleteMutation.isPending &&
										deleteMutation.variables === passkey.id
									}
									loading={
										deleteMutation.isPending &&
										deleteMutation.variables === passkey.id
									}
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
					if (!registerForm.state.isSubmitting) {
						setRegisterModalOpen(false);
						registerForm.reset();
					}
				}}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						registerForm.handleSubmit();
					}}
					className="space-y-5"
				>
					<registerForm.Field
						name="passkeyName"
						validators={{
							onChange: validateField(PASSKEY_VALIDATORS.passkeyName),
						}}
					>
						{(field) => (
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
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
									onBlur={field.handleBlur}
									hasError={Boolean(
										field.state.meta.errors[0] && field.state.value,
									)}
									autoFocus
									disabled={registerForm.state.isSubmitting}
								/>
								{field.state.meta.errors[0] && field.state.value && (
									<p className="mt-1.5 text-xs text-red-400">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</registerForm.Field>

					<div className="flex justify-end gap-3 pt-2">
						<registerForm.Subscribe selector={(state) => [state.isSubmitting]}>
							{([isSubmitting]) => (
								<Button
									type="button"
									variant="ghost"
									disabled={Boolean(isSubmitting)}
									onClick={() => {
										setRegisterModalOpen(false);
										registerForm.reset();
									}}
								>
									Cancel
								</Button>
							)}
						</registerForm.Subscribe>

						<registerForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									loading={Boolean(isSubmitting)}
									disabled={!canSubmit}
								>
									Continue
								</Button>
							)}
						</registerForm.Subscribe>
					</div>
				</form>
			</Modal>

			{/* Remove Modal */}
			<Modal
				open={passkeyToDelete !== null}
				title="Remove passkey?"
				description="Are you sure you want to remove this passkey? You will no longer be able to use it to authenticate."
				onClose={() => {
					if (!deleteMutation.isPending) {
						setPasskeyToDelete(null);
					}
				}}
			>
				<div className="flex justify-end gap-3 pt-4">
					<Button
						type="button"
						variant="ghost"
						disabled={deleteMutation.isPending}
						onClick={() => setPasskeyToDelete(null)}
					>
						Cancel
					</Button>

					<Button
						type="button"
						variant="danger"
						loading={deleteMutation.isPending}
						onClick={() => void handleDelete()}
					>
						Remove passkey
					</Button>
				</div>
			</Modal>

			{/* Rename Modal */}
			<Modal
				open={passkeyToRename !== null}
				title="Rename passkey"
				description="Choose a new name for this passkey."
				onClose={() => {
					if (!renameMutation.isPending) {
						setPasskeyToRename(null);
						renameForm.reset();
					}
				}}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						renameForm.handleSubmit();
					}}
					className="space-y-5"
				>
					<renameForm.Field
						name="passkeyName"
						validators={{
							onChange: validateField(PASSKEY_VALIDATORS.passkeyName),
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor="rename-passkey-name"
									className="mb-2 block text-sm font-medium text-zinc-300"
								>
									Passkey name
								</label>

								<Input
									id="rename-passkey-name"
									name="rename-passkey-name"
									type="text"
									placeholder="e.g. Work MacBook"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
									onBlur={field.handleBlur}
									hasError={Boolean(
										field.state.meta.errors[0] && field.state.value,
									)}
									autoFocus
									disabled={renameMutation.isPending}
								/>
								{field.state.meta.errors[0] && field.state.value && (
									<p className="mt-1.5 text-xs text-red-400">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</renameForm.Field>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="ghost"
							disabled={renameMutation.isPending}
							onClick={() => {
								setPasskeyToRename(null);
								renameForm.reset();
							}}
						>
							Cancel
						</Button>

						<renameForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									loading={Boolean(isSubmitting) || renameMutation.isPending}
									disabled={!canSubmit}
								>
									Save
								</Button>
							)}
						</renameForm.Subscribe>
					</div>
				</form>
			</Modal>
		</div>
	);
}
