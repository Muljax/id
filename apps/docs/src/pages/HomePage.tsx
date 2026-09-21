import {
	ArrowRight,
	Cloud,
	Globe,
	KeyRound,
	RefreshCw,
	ShieldCheck,
	Terminal,
	Users,
} from "lucide-react";
import { Link } from "react-router-dom";

export function HomePage() {
	return (
		<div className="py-6 space-y-16">
			{/* Hero Section */}
			<section className="relative flex flex-col items-start pt-6 pb-4">
				<div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 mb-6 backdrop-blur-sm shadow-sm select-none">
					<span className="flex size-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
					Edge-Native Security & Identity
				</div>

				<h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
					Modern Identity &{" "}
					<span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
						OpenSSH CA
					</span>
				</h1>

				<p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
					Production-ready OpenID Connect provider and short-lived OpenSSH
					Certificate Authority powered by Cloudflare Workers, D1 distributed
					SQLite, and React.
				</p>

				{/* CTA Buttons */}
				<div className="mt-8 flex flex-wrap items-center gap-3">
					<Link
						to="/getting-started/installation"
						className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300 shadow-sm transition-all duration-150 cursor-pointer select-none"
					>
						<span>Get Started</span>
						<ArrowRight size={15} />
					</Link>

					<Link
						to="/reference/api"
						className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:bg-white/[0.1] transition-all duration-150 cursor-pointer select-none"
					>
						<span>API Reference</span>
					</Link>

					<a
						href="https://github.com/muljax/id"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium rounded-xl border border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-200 transition-all duration-150 cursor-pointer select-none"
					>
						<svg
							width={15}
							height={15}
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
						</svg>
						<span>GitHub</span>
					</a>
				</div>
			</section>

			{/* Terminal Preview Card */}
			<section className="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20">
				<div className="flex items-center justify-between pb-4 mb-4 border-b border-white/6">
					<div className="flex items-center gap-2">
						<Terminal size={14} className="text-violet-400" />
						<span className="font-mono text-xs text-zinc-400 font-medium">
							curl — discovery & public key
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="size-2 rounded-full bg-white/10" />
						<span className="size-2 rounded-full bg-white/10" />
						<span className="size-2 rounded-full bg-white/10" />
					</div>
				</div>
				<pre className="font-mono text-xs leading-relaxed text-zinc-300 overflow-x-auto p-1 bg-transparent !border-0 !shadow-none !m-0 !p-0">
					<span className="text-zinc-500"># Fetch CA public key</span>
					{"\n"}
					<span className="text-violet-400">curl</span> -fsSL
					https://id.example.com/api/ssh/ca/public-key{"\n"}
					{"\n"}
					<span className="text-zinc-500"># Discover OpenID configuration</span>
					{"\n"}
					<span className="text-violet-400">curl</span> -fsSL
					https://id.example.com/.well-known/openid-configuration
				</pre>
			</section>

			{/* Feature Cards Grid */}
			<section className="space-y-6">
				<div>
					<h2 className="text-xl font-semibold tracking-tight text-white m-0">
						Key Capabilities
					</h2>
					<p className="mt-1 text-sm text-zinc-400">
						Explore core architecture, protocols, and security policies.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<Link
						to="/user-guides/passkeys"
						className="group rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40 flex flex-col justify-between"
					>
						<div>
							<div className="flex size-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-4 group-hover:bg-violet-500/20 transition-colors">
								<KeyRound size={18} />
							</div>
							<h3 className="text-base font-medium text-white group-hover:text-violet-300 transition-colors m-0">
								FIDO2 / WebAuthn
							</h3>
							<p className="mt-2 text-xs text-zinc-400 leading-relaxed">
								Hardware keys, Touch ID, Face ID, and biometric passkeys for
								phishing-resistant passwordless sign-in.
							</p>
						</div>
						<div className="mt-5 flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:translate-x-0.5 transition-transform">
							Read guide →
						</div>
					</Link>

					<Link
						to="/admin-guides/ssh-ca"
						className="group rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40 flex flex-col justify-between"
					>
						<div>
							<div className="flex size-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-4 group-hover:bg-violet-500/20 transition-colors">
								<ShieldCheck size={18} />
							</div>
							<h3 className="text-base font-medium text-white group-hover:text-violet-300 transition-colors m-0">
								OpenSSH CA
							</h3>
							<p className="mt-2 text-xs text-zinc-400 leading-relaxed">
								Issue short-lived, Ed25519-backed user certificates adhering to
								RFC 4251 & OpenSSH CERT01 wire standards.
							</p>
						</div>
						<div className="mt-5 flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:translate-x-0.5 transition-transform">
							Read guide →
						</div>
					</Link>

					<Link
						to="/protocols/oidc-oauth2"
						className="group rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40 flex flex-col justify-between"
					>
						<div>
							<div className="flex size-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-4 group-hover:bg-violet-500/20 transition-colors">
								<Globe size={18} />
							</div>
							<h3 className="text-base font-medium text-white group-hover:text-violet-300 transition-colors m-0">
								OIDC & OAuth 2.0
							</h3>
							<p className="mt-2 text-xs text-zinc-400 leading-relaxed">
								RFC 6749 compliant OIDC provider with PKCE S256, JSON Web Key
								Sets (JWKS), and rotating access tokens.
							</p>
						</div>
						<div className="mt-5 flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:translate-x-0.5 transition-transform">
							Read guide →
						</div>
					</Link>

					<Link
						to="/admin-guides/host-krl-sync"
						className="group rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40 flex flex-col justify-between"
					>
						<div>
							<div className="flex size-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-4 group-hover:bg-violet-500/20 transition-colors">
								<RefreshCw size={18} />
							</div>
							<h3 className="text-base font-medium text-white group-hover:text-violet-300 transition-colors m-0">
								KRL Key Revocation
							</h3>
							<p className="mt-2 text-xs text-zinc-400 leading-relaxed">
								Sync revoked serial numbers directly to `/etc/ssh/revoked_keys`
								using automated systemd timers.
							</p>
						</div>
						<div className="mt-5 flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:translate-x-0.5 transition-transform">
							Read guide →
						</div>
					</Link>

					<Link
						to="/overview/architecture"
						className="group rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40 flex flex-col justify-between"
					>
						<div>
							<div className="flex size-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-4 group-hover:bg-violet-500/20 transition-colors">
								<Cloud size={18} />
							</div>
							<h3 className="text-base font-medium text-white group-hover:text-violet-300 transition-colors m-0">
								Edge-Native Primaries
							</h3>
							<p className="mt-2 text-xs text-zinc-400 leading-relaxed">
								Sub-millisecond global execution via Cloudflare Workers and D1
								distributed SQLite cluster.
							</p>
						</div>
						<div className="mt-5 flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:translate-x-0.5 transition-transform">
							Read guide →
						</div>
					</Link>

					<Link
						to="/admin-guides/rbac"
						className="group rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40 flex flex-col justify-between"
					>
						<div>
							<div className="flex size-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-4 group-hover:bg-violet-500/20 transition-colors">
								<Users size={18} />
							</div>
							<h3 className="text-base font-medium text-white group-hover:text-violet-300 transition-colors m-0">
								Granular RBAC
							</h3>
							<p className="mt-2 text-xs text-zinc-400 leading-relaxed">
								Pre-seeded and custom roles, fine-grained permission flags, and
								durable user lifecycle state machines.
							</p>
						</div>
						<div className="mt-5 flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:translate-x-0.5 transition-transform">
							Read guide →
						</div>
					</Link>
				</div>
			</section>
		</div>
	);
}
