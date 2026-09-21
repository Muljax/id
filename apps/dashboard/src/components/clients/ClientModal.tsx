import { useForm } from "@tanstack/react-form";
import { Globe, type LucideIcon, Server, Shield } from "lucide-react";
import { useEffect } from "react";

import ClientCredentialsView from "@/components/clients/ClientCredentialsView";
import ScopeSelector from "@/components/clients/ScopeSelector";
import { useToast } from "@/components/Toast";
import Input from "@/components/ui/Input";
import Modal, { ModalFooter } from "@/components/ui/Modal";
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
	/** The client to edit, or `null` to create a new one. */
	client: OAuthClient | null;
	onClose: () => void;
	onSaved: () => Promise<void>;
}

const PROFILES: {
	id: ClientProfile;
	label: string;
	description: string;
	icon: LucideIcon;
}[] = [
	{
		id: "m2m_service",
		label: "Machine / M2M",
		description: "Keyzori, Daemons, APIs (Client Credentials)",
		icon: Server,
	},
	{
		id: "web_app",
		label: "Web App",
		description: "Backend server with secret (Auth Code)",
		icon: Shield,
	},
	{
		id: "spa_native",
		label: "SPA / Native",
		description: "React / Mobile apps (PKCE flow)",
		icon: Globe,
	},
];

function clientTypeForProfile(profile: ClientProfile): ClientType {
	return profile === "spa_native" ? "public" : "confidential";
}

/**
 * Derives the closest matching {@link ClientProfile} from an existing client's
 * stored `clientType`, redirect URIs, and scopes.
 */
function inferProfile(client: OAuthClient): ClientProfile {
	if (client.clientType === "public") return "spa_native";
	if (client.redirectUris.length === 0 || !client.scopes.includes("openid"))
		return "m2m_service";
	return "web_app";
}

/**
 * Returns the scopes that should be set when switching to `profile`.
 *
 * Switching to M2M clears the default OIDC trio (`openid profile email`) but
 * keeps any custom scopes the user already added. Switching to a user-facing
 * profile ensures `openid` is present.
 */
function defaultScopesForProfile(
	profile: ClientProfile,
	currentScopes: string[],
): string[] {
	if (profile === "m2m_service") {
		const hasOnlyDefaultOidc =
			currentScopes.length === 3 &&
			currentScopes.includes("openid") &&
			currentScopes.includes("profile") &&
			currentScopes.includes("email");
		return hasOnlyDefaultOidc ? [] : currentScopes;
	}
	return currentScopes.includes("openid")
		? currentScopes
		: ["openid", "profile", "email"];
}

function ProfileCard({
	profile,
	selected,
	disabled,
	onSelect,
}: {
	profile: (typeof PROFILES)[number];
	selected: boolean;
	disabled: boolean;
	onSelect: () => void;
}) {
	const Icon = profile.icon;
	return (
		<button
			type="button"
			onClick={onSelect}
			disabled={disabled}
			className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
				selected
					? "border-violet-500/50 bg-violet-500/10 text-white"
					: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
			}`}
		>
			<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
				<Icon size={13} className="text-violet-400" />
				<span>{profile.label}</span>
			</div>
			<span className="text-[11px] text-zinc-400 mt-1">
				{profile.description}
			</span>
		</button>
	);
}

function FormField({
	label,
	labelSuffix,
	error,
	hint,
	children,
}: {
	label: string;
	labelSuffix?: React.ReactNode;
	/** Validation error — shown in red, takes precedence over `hint`. */
	error?: string | null;
	/** Help text shown below the control when there is no error. */
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<p className="mb-2 block text-sm font-medium text-zinc-300">
				{label}
				{labelSuffix && <> {labelSuffix}</>}
			</p>
			{children}
			{error ? (
				<p className="mt-1.5 text-xs text-red-400">{error}</p>
			) : hint ? (
				<p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
			) : null}
		</div>
	);
}

/**
 * Modal for creating and editing OAuth 2.0 / OIDC clients across
 * Web App, SPA / Native, and Machine-to-Machine profiles.
 *
 * After a successful **create**, the form transitions to a credentials view
 * that shows the one-time client secret before calling `onSaved`.
 */
export default function ClientModal({
	open,
	client,
	onClose,
	onSaved,
}: ClientModalProps) {
	const toast = useToast();
	const isEditing = client !== null;

	const form = useForm({
		defaultValues: {
			name: "",
			profile: "m2m_service" as ClientProfile,
			redirectUris: "",
			scopes: [] as string[],
			createdClientId: null as string | null,
			createdSecret: null as string | null,
		},
		onSubmit: async ({ value }) => {
			const name = value.name.trim();
			const redirectUris = value.redirectUris
				.split("\n")
				.map((u) => u.trim())
				.filter(Boolean);

			try {
				if (isEditing) {
					await updateOAuthClient(client.id, {
						name,
						redirectUris,
						scopes: value.scopes,
					});
					await onSaved();
					return;
				}

				const response = await createOAuthClient({
					name,
					clientType: clientTypeForProfile(value.profile),
					redirectUris,
					scopes: value.scopes,
				});

				form.setFieldValue("createdClientId", response.client_id);
				form.setFieldValue("createdSecret", response.client_secret ?? null);
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

		form.reset(
			client
				? {
						name: client.name,
						profile: inferProfile(client),
						redirectUris: client.redirectUris.join("\n"),
						scopes: client.scopes,
						createdClientId: null,
						createdSecret: null,
					}
				: {
						name: "",
						profile: "m2m_service",
						redirectUris: "",
						scopes: [],
						createdClientId: null,
						createdSecret: null,
					},
		);
	}, [open, client, form]);

	function handleProfileChange(newProfile: ClientProfile) {
		form.setFieldValue("profile", newProfile);
		form.setFieldValue(
			"scopes",
			defaultScopesForProfile(newProfile, form.state.values.scopes),
		);
	}

	return (
		<form.Subscribe
			selector={(state) =>
				[
					state.values.createdClientId,
					state.values.createdSecret,
					state.values.profile as ClientProfile,
				] as const
			}
		>
			{([createdClientId, createdSecret, currentProfile]) => (
				<Modal
					open={open}
					title={
						createdClientId
							? "Client Credentials Generated"
							: isEditing
								? "Edit OAuth Client"
								: "Register New OAuth / M2M Client"
					}
					description={
						createdClientId
							? "Save these credentials securely. The client secret will not be displayed again."
							: isEditing
								? "Update your application's OAuth 2.0 / OIDC & M2M configuration."
								: "Create an OAuth client for web applications, mobile apps, or Machine-to-Machine service accounts."
					}
					onClose={onClose}
					size="xl"
				>
					{createdClientId ? (
						<ClientCredentialsView
							clientId={createdClientId}
							secret={createdSecret}
							isM2M={currentProfile === "m2m_service"}
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
									<FormField
										label="Client Name"
										error={
											field.state.meta.isTouched
												? (field.state.meta.errors[0] as string | undefined)
												: null
										}
									>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g. Keyzori License Server, Billing Sync Worker"
											disabled={form.state.isSubmitting}
											hasError={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											}
											required
										/>
									</FormField>
								)}
							</form.Field>

							{!isEditing && (
								<form.Field name="profile">
									{(field) => (
										<div>
											<p className="mb-2 block text-sm font-medium text-zinc-300">
												Client Type &amp; Use Case
											</p>
											<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
												{PROFILES.map((profile) => (
													<ProfileCard
														key={profile.id}
														profile={profile}
														selected={field.state.value === profile.id}
														disabled={form.state.isSubmitting}
														onSelect={() => {
															field.handleChange(profile.id);
															handleProfileChange(profile.id);
														}}
													/>
												))}
											</div>
										</div>
									)}
								</form.Field>
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
									<FormField
										label="Redirect URIs"
										labelSuffix={
											currentProfile === "m2m_service" ? (
												<span className="text-zinc-500 font-normal">
													(Optional for M2M)
												</span>
											) : undefined
										}
										error={
											field.state.meta.isTouched
												? (field.state.meta.errors[0] as string | undefined)
												: null
										}
										hint={
											currentProfile === "m2m_service"
												? "Machine-to-machine clients do not require redirect URIs unless also using user authorization code flow."
												: "Enter one redirect URI per line."
										}
									>
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={form.state.isSubmitting}
											hasError={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											}
											rows={currentProfile === "m2m_service" ? 2 : 3}
											placeholder={
												currentProfile === "m2m_service"
													? "Not required for Client Credentials grant"
													: "https://app.example.com/oauth/callback"
											}
											required={currentProfile !== "m2m_service"}
										/>
									</FormField>
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
											profile={currentProfile}
											scopes={field.state.value}
											onChange={(newScopes) => field.handleChange(newScopes)}
											disabled={form.state.isSubmitting}
										/>
										{field.state.meta.isTouched &&
										field.state.meta.errors[0] ? (
											<p className="mt-1.5 text-xs text-red-400">
												{String(field.state.meta.errors[0])}
											</p>
										) : null}
									</div>
								)}
							</form.Field>

							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<ModalFooter
										onCancel={onClose}
										cancelLabel="Cancel"
										submitLabel={isEditing ? "Save changes" : "Create client"}
										loading={Boolean(isSubmitting)}
										disabled={!canSubmit}
									/>
								)}
							</form.Subscribe>
						</form>
					)}
				</Modal>
			)}
		</form.Subscribe>
	);
}
