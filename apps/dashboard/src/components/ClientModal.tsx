import { Globe, Server, Shield } from "lucide-react";
import { useEffect, useState } from "react";

import ClientCredentialsView from "@/components/clients/ClientCredentialsView";
import ScopeSelector from "@/components/clients/ScopeSelector";
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

type ClientProfile = "web_app" | "spa_native" | "m2m_service";
type ClientType = "public" | "confidential";

interface ClientModalProps {
	open: boolean;
	client: OAuthClient | null;
	onClose: () => void;
	onSaved: () => Promise<void>;
}

/**
 * Modal for creating and managing OAuth 2.0 / OIDC clients across Web, SPA, and M2M profiles.
 */
export default function ClientModal({
	open,
	client,
	onClose,
	onSaved,
}: ClientModalProps) {
	const toast = useToast();
	const editing = client !== null;

	const [name, setName] = useState("");
	const [profile, setProfile] = useState<ClientProfile>("m2m_service");
	const [redirectUris, setRedirectUris] = useState("");
	const [scopes, setScopes] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	const [createdClientId, setCreatedClientId] = useState<string | null>(null);
	const [secret, setSecret] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;

		if (client) {
			setName(client.name);
			setRedirectUris(client.redirectUris.join("\n"));
			setScopes(client.scopes);
			if (client.clientType === "public") {
				setProfile("spa_native");
			} else if (
				client.redirectUris.length === 0 ||
				!client.scopes.includes("openid")
			) {
				setProfile("m2m_service");
			} else {
				setProfile("web_app");
			}
		} else {
			setName("");
			setProfile("m2m_service");
			setRedirectUris("");
			setScopes([]);
		}

		setCreatedClientId(null);
		setSecret(null);
	}, [open, client]);

	function handleProfileChange(newProfile: ClientProfile) {
		setProfile(newProfile);
		if (newProfile === "m2m_service") {
			// Clear standard OIDC scopes if they were just the defaults
			if (
				scopes.length === 3 &&
				scopes.includes("openid") &&
				scopes.includes("profile") &&
				scopes.includes("email")
			) {
				setScopes([]);
			}
		} else if (newProfile === "web_app" || newProfile === "spa_native") {
			if (!scopes.includes("openid")) {
				setScopes(["openid", "profile", "email"]);
			}
		}
	}

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

		const clientType: ClientType =
			profile === "spa_native" ? "public" : "confidential";

		if (clientType === "public" && normalizedRedirectUris.length === 0) {
			toast.error("Public clients require at least one redirect URI.");
			return;
		}

		if (scopes.length === 0) {
			toast.error("At least one scope must be assigned to the client.");
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
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to save OAuth client.",
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<Modal
			open={open}
			title={
				createdClientId
					? "Client Credentials Generated"
					: editing
						? "Edit OAuth Client"
						: "Register New OAuth / M2M Client"
			}
			description={
				createdClientId
					? "Save these credentials securely. The client secret will not be displayed again."
					: editing
						? "Update your application's OAuth 2.0 / OIDC & M2M configuration."
						: "Create an OAuth client for web applications, mobile apps, or Machine-to-Machine service accounts."
			}
			onClose={onClose}
			size="lg"
		>
			{createdClientId ? (
				<ClientCredentialsView
					clientId={createdClientId}
					secret={secret}
					isM2M={profile === "m2m_service"}
					onDone={() => void onSaved()}
				/>
			) : (
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label
							htmlFor="client-name"
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Client Name
						</label>
						<Input
							id="client-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="e.g. Keyzori License Server, Billing Sync Worker"
							disabled={saving}
							required
						/>
					</div>

					{!editing && (
						<div>
							<p className="mb-2 block text-sm font-medium text-zinc-300">
								Client Type & Use Case
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
								<button
									type="button"
									onClick={() => handleProfileChange("m2m_service")}
									disabled={saving}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										profile === "m2m_service"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Server size={13} className="text-violet-400" />
										<span>Machine / M2M</span>
									</div>
									<span className="text-[11px] text-zinc-400 mt-1">
										Keyzori, Daemons, APIs (Client Credentials)
									</span>
								</button>

								<button
									type="button"
									onClick={() => handleProfileChange("web_app")}
									disabled={saving}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										profile === "web_app"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Shield size={13} className="text-emerald-400" />
										<span>Web App</span>
									</div>
									<span className="text-[11px] text-zinc-400 mt-1">
										Backend server with secret (Auth Code)
									</span>
								</button>

								<button
									type="button"
									onClick={() => handleProfileChange("spa_native")}
									disabled={saving}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										profile === "spa_native"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Globe size={13} className="text-amber-400" />
										<span>SPA / Native</span>
									</div>
									<span className="text-[11px] text-zinc-400 mt-1">
										React / Mobile apps (PKCE flow)
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
							Redirect URIs{" "}
							{profile === "m2m_service" && (
								<span className="text-zinc-500 font-normal">
									(Optional for M2M)
								</span>
							)}
						</label>
						<Textarea
							id="redirect-uris"
							value={redirectUris}
							onChange={(event) => setRedirectUris(event.target.value)}
							disabled={saving}
							rows={profile === "m2m_service" ? 2 : 3}
							placeholder={
								profile === "m2m_service"
									? "Not required for Client Credentials grant"
									: "https://app.example.com/oauth/callback"
							}
							required={profile !== "m2m_service"}
						/>
						<p className="mt-1.5 text-xs text-zinc-500">
							{profile === "m2m_service"
								? "Machine-to-machine clients do not require redirect URIs unless also using user authorization code flow."
								: "Enter one redirect URI per line."}
						</p>
					</div>

					<ScopeSelector
						profile={profile}
						scopes={scopes}
						onChange={setScopes}
						disabled={saving}
					/>

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
