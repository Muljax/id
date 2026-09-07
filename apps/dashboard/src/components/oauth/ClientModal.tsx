import { useEffect, useState } from "react";

import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
	createOAuthClient,
	type OAuthClient,
	updateOAuthClient,
} from "@/lib/api";

const AVAILABLE_SCOPES = ["openid", "profile", "email"] as const;

type ClientType = "public" | "confidential";

interface ClientModalProps {
	open: boolean;
	client: OAuthClient | null;
	onClose: () => void;
	onSaved: () => Promise<void>;
}

export default function ClientModal({
	open,
	client,
	onClose,
	onSaved,
}: ClientModalProps) {
	const toast = useToast();
	const editing = client !== null;

	const [name, setName] = useState("");
	const [clientType, setClientType] = useState<ClientType>("confidential");
	const [redirectUris, setRedirectUris] = useState("");
	const [scopes, setScopes] = useState<string[]>(["openid"]);
	const [saving, setSaving] = useState(false);

	const [createdClientId, setCreatedClientId] = useState<string | null>(null);
	const [secret, setSecret] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		setName(client?.name ?? "");
		setClientType(client?.clientType ?? "confidential");
		setRedirectUris(client?.redirectUris.join("\n") ?? "");
		setScopes(client?.scopes ?? ["openid"]);
		setCreatedClientId(null);
		setSecret(null);
	}, [open, client]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const normalizedName = name.trim();

		const normalizedRedirectUris = redirectUris
			.split("\n")
			.map((uri) => uri.trim())
			.filter(Boolean);

		if (!normalizedName) {
			toast.error("Client name is required.");
			return;
		}

		if (!normalizedRedirectUris.length) {
			toast.error("At least one redirect URI is required.");
			return;
		}

		setSaving(true);

		try {
			if (editing) {
				await updateOAuthClient(client.id, {
					name: normalizedName,
					redirectUris: normalizedRedirectUris,
					scopes,
				});

				toast.success("OAuth client updated.");
				await onSaved();
				return;
			}

			const response = await createOAuthClient({
				name: normalizedName,
				clientType,
				redirectUris: normalizedRedirectUris,
				scopes,
			});

			setCreatedClientId(response.client_id);
			setSecret(response.client_secret ?? null);

			toast.success("OAuth client created.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to save OAuth client.",
			);
		} finally {
			setSaving(false);
		}
	}

	function toggleScope(scope: string) {
		if (scope === "openid") {
			return;
		}

		setScopes((current) =>
			current.includes(scope)
				? current.filter((item) => item !== scope)
				: [...current, scope],
		);
	}

	return (
		<Modal
			open={open}
			title={
				createdClientId
					? "OAuth client created"
					: editing
						? "Edit OAuth client"
						: "Create OAuth client"
			}
			description={
				createdClientId
					? "Save these credentials now. The client secret will not be shown again."
					: editing
						? "Update this application's OAuth configuration."
						: "Register an application that will use Muljax ID for authentication."
			}
			onClose={onClose}
		>
			{createdClientId ? (
				<div className="space-y-5">
					<div className="rounded-md border border-amber-900/50 bg-amber-950/20 p-4">
						<p className="text-sm font-medium text-amber-300">
							Save your client credentials
						</p>

						<p className="mt-2 text-xs text-amber-200/70">
							Save these credentials now. The client secret will not be shown
							again.
						</p>

						<div className="mt-4">
							<p className="text-xs font-medium text-amber-300">Client ID</p>

							<div className="mt-2 break-all rounded-md bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
								{createdClientId}
							</div>

							<Button
								type="button"
								variant="secondary"
								className="mt-3 w-full"
								onClick={() => {
									void navigator.clipboard.writeText(createdClientId);
									toast.success("Client ID copied.");
								}}
							>
								Copy client ID
							</Button>
						</div>

						{secret && (
							<div className="mt-4">
								<p className="text-xs font-medium text-amber-300">
									Client secret
								</p>

								<div className="mt-2 break-all rounded-md bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
									{secret}
								</div>

								<Button
									type="button"
									variant="secondary"
									className="mt-3 w-full"
									onClick={() => {
										void navigator.clipboard.writeText(secret);
										toast.success("Client secret copied.");
									}}
								>
									Copy client secret
								</Button>
							</div>
						)}
					</div>

					<Button
						type="button"
						className="w-full"
						onClick={() => {
							void onSaved();
						}}
					>
						Done
					</Button>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label
							htmlFor="client-name"
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Name
						</label>

						<Input
							id="client-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							disabled={saving}
						/>
					</div>

					{!editing && (
						<div className="grid grid-cols-2 gap-2">
							<Button
								type="button"
								variant={
									clientType === "confidential" ? "primary" : "secondary"
								}
								onClick={() => setClientType("confidential")}
								disabled={saving}
							>
								Confidential
							</Button>

							<Button
								type="button"
								variant={clientType === "public" ? "primary" : "secondary"}
								onClick={() => setClientType("public")}
								disabled={saving}
							>
								Public
							</Button>
						</div>
					)}

					<div>
						<label
							htmlFor="redirect-uris"
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Redirect URIs
						</label>

						<textarea
							id="redirect-uris"
							value={redirectUris}
							onChange={(event) => setRedirectUris(event.target.value)}
							disabled={saving}
							rows={4}
							className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 disabled:opacity-50"
						/>
					</div>

					<div>
						<p className="mb-2 text-sm font-medium text-zinc-300">Scopes</p>

						<div className="space-y-2">
							{AVAILABLE_SCOPES.map((scope) => {
								const selected = scopes.includes(scope);

								return (
									<label
										key={scope}
										className="flex cursor-pointer items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5"
									>
										<span className="text-sm text-zinc-300">{scope}</span>

										<input
											type="checkbox"
											checked={selected}
											disabled={scope === "openid" || saving}
											onChange={() => toggleScope(scope)}
										/>
									</label>
								);
							})}
						</div>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={saving}
						>
							Cancel
						</Button>

						<Button type="submit" disabled={saving}>
							{saving
								? "Saving..."
								: editing
									? "Save changes"
									: "Create client"}
						</Button>
					</div>
				</form>
			)}
		</Modal>
	);
}
