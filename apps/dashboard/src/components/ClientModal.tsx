import { Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
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
					? "OAuth client credentials"
					: editing
						? "Edit OAuth client"
						: "Create OAuth client"
			}
			description={
				createdClientId
					? "Save these credentials securely. The client secret will not be displayed again."
					: editing
						? "Update your application's OAuth 2.0 / OIDC configuration."
						: "Register a new application to authenticate users with Muljax ID."
			}
			onClose={onClose}
			size="lg"
		>
			{createdClientId ? (
				<div className="space-y-6">
					<div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 space-y-4">
						<div>
							<span className="text-xs font-medium text-amber-400">
								Client ID
							</span>
							<div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
								<code className="font-mono text-xs text-zinc-200 break-all">
									{createdClientId}
								</code>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									icon={<Copy size={13} />}
									onClick={() => {
										void navigator.clipboard.writeText(createdClientId);
										toast.success("Client ID copied to clipboard.");
									}}
								>
									Copy
								</Button>
							</div>
						</div>

						{secret && (
							<div>
								<span className="text-xs font-medium text-amber-400">
									Client Secret
								</span>
								<div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
									<code className="font-mono text-xs text-zinc-200 break-all">
										{secret}
									</code>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										icon={<Copy size={13} />}
										onClick={() => {
											void navigator.clipboard.writeText(secret);
											toast.success("Client secret copied to clipboard.");
										}}
									>
										Copy
									</Button>
								</div>
							</div>
						)}
					</div>

					<Button
						type="button"
						className="w-full"
						onClick={() => void onSaved()}
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
							Client name
						</label>
						<Input
							id="client-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="e.g. My Web App"
							disabled={saving}
							required
						/>
					</div>

					{!editing && (
						<div>
							<p className="mb-2 block text-sm font-medium text-zinc-300">
								Client type
							</p>
							<div className="grid grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setClientType("confidential")}
									disabled={saving}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										clientType === "confidential"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<span className="text-xs font-semibold text-white">
										Confidential
									</span>
									<span className="text-[11px] text-zinc-400 mt-0.5">
										Server-side apps with secrets
									</span>
								</button>

								<button
									type="button"
									onClick={() => setClientType("public")}
									disabled={saving}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										clientType === "public"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<span className="text-xs font-semibold text-white">
										Public (SPA / Native)
									</span>
									<span className="text-[11px] text-zinc-400 mt-0.5">
										Requires PKCE flow
									</span>
								</button>
							</div>
						</div>
					)}

					<div>
						<label
							htmlFor="redirect-uris"
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Redirect URIs
						</label>
						<Textarea
							id="redirect-uris"
							value={redirectUris}
							onChange={(event) => setRedirectUris(event.target.value)}
							disabled={saving}
							rows={3}
							placeholder="https://app.example.com/oauth/callback"
							required
						/>
						<p className="mt-1.5 text-xs text-zinc-500">
							Enter one redirect URI per line.
						</p>
					</div>

					<div>
						<p className="mb-2 block text-sm font-medium text-zinc-300">
							Allowed scopes
						</p>
						<div className="grid grid-cols-3 gap-2">
							{AVAILABLE_SCOPES.map((scope) => {
								const selected = scopes.includes(scope);
								return (
									<label
										key={scope}
										className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
											selected
												? "border-violet-500/40 bg-violet-500/10 text-violet-200"
												: "border-white/8 bg-zinc-900/40 text-zinc-400"
										}`}
									>
										<span className="text-xs font-medium">{scope}</span>
										<input
											type="checkbox"
											checked={selected}
											disabled={scope === "openid" || saving}
											onChange={() => toggleScope(scope)}
											className="rounded border-white/10 bg-zinc-800 accent-violet-500"
										/>
									</label>
								);
							})}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-3">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={saving}
						>
							Cancel
						</Button>

						<Button type="submit" loading={saving}>
							{editing ? "Save changes" : "Create client"}
						</Button>
					</div>
				</form>
			)}
		</Modal>
	);
}
