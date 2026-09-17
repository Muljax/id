// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";

// https://astro.build/config
export default defineConfig({
	integrations: [
		mermaid({
			theme: "dark",
			autoTheme: false,
		}),
		starlight({
			title: "Muljax ID",
			description:
				"Edge-native Identity, OIDC Provider, and OpenSSH Certificate Authority",
			customCss: ["./src/styles/custom.css"],
			components: {
				ThemeProvider: "./src/components/ForceDarkTheme.astro",
				ThemeSelect: "./src/components/EmptyComponent.astro",
			},
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/muljax/id",
				},
			],
			sidebar: [
				{
					label: "Overview",
					items: [
						{ label: "Introduction", link: "/overview/introduction/" },
						{ label: "Architecture", link: "/overview/architecture/" },
						{ label: "Security Model", link: "/overview/security-model/" },
					],
				},
				{
					label: "Getting Started",
					items: [
						{
							label: "Installation & Prerequisites",
							link: "/getting-started/installation/",
						},
						{
							label: "Configuration & Secrets",
							link: "/getting-started/configuration/",
						},
						{ label: "Deployment", link: "/getting-started/deployment/" },
						{
							label: "Superadmin Bootstrap",
							link: "/getting-started/initial-setup/",
						},
					],
				},
				{
					label: "User Guides",
					items: [
						{ label: "WebAuthn & Passkeys", link: "/user-guides/passkeys/" },
						{ label: "Managing SSH Keys", link: "/user-guides/ssh-keys/" },
						{
							label: "Requesting Certificates",
							link: "/user-guides/ssh-certificates/",
						},
						{
							label: "SSH Client Configuration",
							link: "/user-guides/client-configuration/",
						},
						{
							label: "Profile, Password & Apps",
							link: "/user-guides/sessions/",
						},
					],
				},
				{
					label: "Administrator Guides",
					items: [
						{
							label: "SSH Certificate Authority",
							link: "/admin-guides/ssh-ca/",
						},
						{
							label: "Host Revocation (KRL) Sync",
							link: "/admin-guides/host-krl-sync/",
						},
						{
							label: "User Lifecycle & Workflows",
							link: "/admin-guides/user-lifecycle/",
						},
						{ label: "Role-Based Access Control", link: "/admin-guides/rbac/" },
						{
							label: "OAuth2 / OIDC Clients",
							link: "/admin-guides/oauth-clients/",
						},
						{
							label: "Notifications & Audit",
							link: "/admin-guides/audit-logging/",
						},
					],
				},
				{
					label: "Protocols & Deep Dives",
					items: [
						{
							label: "OpenSSH CA Wire Specification",
							link: "/protocols/openssh-ca-wire/",
						},
						{
							label: "OAuth2 & OpenID Connect",
							link: "/protocols/oidc-oauth2/",
						},
						{
							label: "WebAuthn & FIDO2 Ceremony",
							link: "/protocols/webauthn-fido2/",
						},
					],
				},
				{
					label: "Developer Reference",
					items: [
						{ label: "REST API Reference", link: "/reference/api/" },
						{ label: "Database Schema", link: "/reference/database-schema/" },
						{ label: "SSH Wire Library", link: "/reference/wire-library/" },
					],
				},
			],
		}),
	],
});
