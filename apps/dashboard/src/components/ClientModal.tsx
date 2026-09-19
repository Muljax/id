import { useForm } from "@tanstack/react-form";
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
import { validateField, validators } from "@/lib/validation";

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

	const [createdClientId, setCreatedClientId] = useState<string | null>(null);
	const [secret, setSecret] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: "",
			profile: "m2m_service" as ClientProfile,
			redirectUris: "",
			scopes: [] as string[],
		},
		onSubmit: async ({ value }) => {
			const normalizedName = value.name.trim();
			const normalizedRedirectUris = value.redirectUris
				.split("\n")
				.map((uri) => uri.trim())
				.filter(Boolean);

			const clientType: ClientType =
				value.profile === "spa_native" ? "public" : "confidential";

			try {
				if (editing) {
					await updateOAuthClient(client.id, {
						name: normalizedName,
						redirectUris: normalizedRedirectUris,
						scopes: value.scopes,
					});

					await onSaved();
					return;
				}

				const response = await createOAuthClient({
					name: normalizedName,
					clientType,
					redirectUris: normalizedRedirectUris,
					scopes: value.scopes,
				});

				setCreatedClientId(response.client_id);
				setSecret(response.client_secret ?? null);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Unable to save OAuth client.",
				);
			}
		},
	});

	useEffect(() => {
		if (!open) return;

		if (client) {
			let clientProfile: ClientProfile = "web_app";
			if (client.clientType === "public") {
				clientProfile = "spa_native";
			} else if (
				client.redirectUris.length === 0 ||
				!client.scopes.includes("openid")
			) {
				clientProfile = "m2m_service";
			}

			form.reset({
				name: client.name,
				profile: clientProfile,
				redirectUris: client.redirectUris.join("\n"),
				scopes: client.scopes,
			});
		} else {
			form.reset({
				name: "",
				profile: "m2m_service",
				redirectUris: "",
				scopes: [],
			});
		}

		setCreatedClientId(null);
		setSecret(null);
	}, [open, client, form]);

	function handleProfileChange(newProfile: ClientProfile) {
		form.setFieldValue("profile", newProfile);
		const currentScopes = form.state.values.scopes;
		if (newProfile === "m2m_service") {
			if (
				currentScopes.length === 3 &&
				currentScopes.includes("openid") &&
				currentScopes.includes("profile") &&
				currentScopes.includes("email")
			) {
				form.setFieldValue("scopes", []);
			}
		} else if (newProfile === "web_app" || newProfile === "spa_native") {
			if (!currentScopes.includes("openid")) {
				form.setFieldValue("scopes", ["openid", "profile", "email"]);
			}
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
			size="xl"
		>
			{createdClientId ? (
				<ClientCredentialsView
					clientId={createdClientId}
					secret={secret}
					isM2M={form.state.values.profile === "m2m_service"}
					onDone={() => void onSaved()}
				/>
			) : (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-5"
				>
					<form.Field
						name="name"
						validators={{
							onChange: validateField([
								validators.required("Client name is required."),
								validators.maxLength(
									100,
									"Client name must be 100 characters or fewer.",
								),
							]),
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="mb-2 block text-sm font-medium text-zinc-300"
								>
									Client Name
								</label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="e.g. Keyzori License Server, Billing Sync Worker"
									disabled={form.state.isSubmitting}
									hasError={
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0
									}
									required
								/>
								{field.state.meta.isTouched && field.state.meta.errors[0] ? (
									<p className="mt-1.5 text-xs text-red-400">
										{String(field.state.meta.errors[0])}
									</p>
								) : null}
							</div>
						)}
					</form.Field>

					{!editing && (
						<div>
							<p className="mb-2 block text-sm font-medium text-zinc-300">
								Client Type & Use Case
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
								<button
									type="button"
									onClick={() => handleProfileChange("m2m_service")}
									disabled={form.state.isSubmitting}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										form.state.values.profile === "m2m_service"
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
									disabled={form.state.isSubmitting}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										form.state.values.profile === "web_app"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Shield size={13} className="text-violet-400" />
										<span>Web App</span>
									</div>
									<span className="text-[11px] text-zinc-400 mt-1">
										Backend server with secret (Auth Code)
									</span>
								</button>

								<button
									type="button"
									onClick={() => handleProfileChange("spa_native")}
									disabled={form.state.isSubmitting}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										form.state.values.profile === "spa_native"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Globe size={13} className="text-violet-400" />
										<span>SPA / Native</span>
									</div>
									<span className="text-[11px] text-zinc-400 mt-1">
										React / Mobile apps (PKCE flow)
									</span>
								</button>
							</div>
						</div>
					)}

					<form.Field
						name="redirectUris"
						validators={{
							onChangeListenTo: ["profile"],
							onChange: validateField([
								validators.custom((val, f: { profile?: ClientProfile }) => {
									if (
										f?.profile === "spa_native" &&
										typeof val === "string" &&
										!val.trim()
									) {
										return "Public clients require at least one redirect URI.";
									}
									return null;
								}, "Public clients require at least one redirect URI."),
								validators.urlList(
									"Each line must be a valid HTTP or HTTPS URL.",
								),
							]),
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="mb-2 block text-sm font-medium text-zinc-300"
								>
									Redirect URIs{" "}
									{form.state.values.profile === "m2m_service" && (
										<span className="text-zinc-500 font-normal">
											(Optional for M2M)
										</span>
									)}
								</label>
								<Textarea
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									disabled={form.state.isSubmitting}
									hasError={
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0
									}
									rows={form.state.values.profile === "m2m_service" ? 2 : 3}
									placeholder={
										form.state.values.profile === "m2m_service"
											? "Not required for Client Credentials grant"
											: "https://app.example.com/oauth/callback"
									}
									required={form.state.values.profile !== "m2m_service"}
								/>
								{field.state.meta.isTouched && field.state.meta.errors[0] ? (
									<p className="mt-1.5 text-xs text-red-400">
										{String(field.state.meta.errors[0])}
									</p>
								) : (
									<p className="mt-1.5 text-xs text-zinc-500">
										{form.state.values.profile === "m2m_service"
											? "Machine-to-machine clients do not require redirect URIs unless also using user authorization code flow."
											: "Enter one redirect URI per line."}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field
						name="scopes"
						validators={{
							onChange: validateField(
								validators.minItems(
									1,
									"At least one scope must be assigned to the client.",
								),
							),
						}}
					>
						{(field) => (
							<div>
								<ScopeSelector
									profile={form.state.values.profile}
									scopes={field.state.value}
									onChange={(newScopes) => field.handleChange(newScopes)}
									disabled={form.state.isSubmitting}
								/>
								{field.state.meta.isTouched && field.state.meta.errors[0] ? (
									<p className="mt-1.5 text-xs text-red-400">
										{String(field.state.meta.errors[0])}
									</p>
								) : null}
							</div>
						)}
					</form.Field>

					<div className="flex justify-end gap-3 pt-3">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={form.state.isSubmitting}
						>
							Cancel
						</Button>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									loading={Boolean(isSubmitting)}
									disabled={!canSubmit}
								>
									{editing ? "Save changes" : "Create client"}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>
			)}
		</Modal>
	);
}
