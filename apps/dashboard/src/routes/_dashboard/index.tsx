import { Link, createFileRoute } from "@tanstack/react-router";
import {
	AppWindow,
	ArrowRight,
	KeyRound,
	Lock,
	Shield,
	SlidersHorizontal,
	User,
	Users,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { getProfileAvatarUrl } from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";

export const Route = createFileRoute("/_dashboard/")({
	staticData: {
		navigation: {
			label: "Overview",
			order: -100,
		},
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { user, hasPermission } = useAuth();

	if (!user) {
		return null;
	}

	const displayName = user.displayName || user.email.split("@")[0];
	const isAdministrator =
		hasPermission("*") ||
		user.roles?.some(
			(r) => r.toLowerCase() === "admin" || r.toLowerCase() === "administrator",
		);

	const canAccessClients = hasPermission("oauth_clients:read");
	const canAccessUsers = hasPermission("users:read");
	const canAccessRoles = hasPermission("roles:read");
	const hasAnyAdminAccess =
		canAccessClients || canAccessUsers || canAccessRoles;

	return (
		<div className="space-y-8">
			<PageHeader
				title={`Welcome, ${displayName}`}
				description="Manage your personal identity, security credentials, and connected applications."
				badge={
					isAdministrator ? (
						<Badge variant="violet">Administrator</Badge>
					) : (
						<Badge variant="success">Account Active</Badge>
					)
				}
			/>

			{/* Overview Grid */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{/* Profile Card */}
				<Card variant="interactive" className="flex flex-col justify-between">
					<div>
						<CardHeader className="flex items-center justify-between border-b-0 pb-0">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
								<User size={20} />
							</div>
							<Badge variant="default">Profile</Badge>
						</CardHeader>
						<CardContent className="pt-4">
							<div className="flex items-center gap-3">
								{user.profileImageKey ? (
									<img
										src={`${getProfileAvatarUrl()}?v=${encodeURIComponent(
											user.profileImageKey,
										)}`}
										alt=""
										className="h-12 w-12 rounded-full object-cover border border-white/10"
									/>
								) : (
									<div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-sm font-semibold text-zinc-200">
										{displayName.slice(0, 2).toUpperCase()}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<h3 className="truncate text-sm font-medium text-white">
										{user.displayName || "No display name set"}
									</h3>
									<p className="truncate text-xs text-zinc-400">{user.email}</p>
								</div>
							</div>
						</CardContent>
					</div>
					<div className="p-6 pt-0">
						<Link to="/account/profile">
							<Button
								variant="secondary"
								size="sm"
								className="w-full justify-between"
							>
								<span>Edit profile</span>
								<ArrowRight size={14} />
							</Button>
						</Link>
					</div>
				</Card>

				{/* Passkeys Card */}
				<Card variant="interactive" className="flex flex-col justify-between">
					<div>
						<CardHeader className="flex items-center justify-between border-b-0 pb-0">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
								<KeyRound size={20} />
							</div>
							<Badge variant="success">Passwordless</Badge>
						</CardHeader>
						<CardContent className="pt-4">
							<CardTitle className="text-base">Passkeys</CardTitle>
							<p className="mt-1 text-xs text-zinc-400">
								Sign in instantly using biometrics like Touch ID, Face ID, or
								your device PIN.
							</p>
						</CardContent>
					</div>
					<div className="p-6 pt-0">
						<Link to="/account/passkeys">
							<Button
								variant="secondary"
								size="sm"
								className="w-full justify-between"
							>
								<span>Manage passkeys</span>
								<ArrowRight size={14} />
							</Button>
						</Link>
					</div>
				</Card>

				{/* Security / Password Card */}
				<Card variant="interactive" className="flex flex-col justify-between">
					<div>
						<CardHeader className="flex items-center justify-between border-b-0 pb-0">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
								<Lock size={20} />
							</div>
							<Badge variant="default">Security</Badge>
						</CardHeader>
						<CardContent className="pt-4">
							<CardTitle className="text-base">Password & Sessions</CardTitle>
							<p className="mt-1 text-xs text-zinc-400">
								Update your password and terminate unauthorized active sign-in
								sessions.
							</p>
						</CardContent>
					</div>
					<div className="p-6 pt-0">
						<Link to="/account/password">
							<Button
								variant="secondary"
								size="sm"
								className="w-full justify-between"
							>
								<span>Change password</span>
								<ArrowRight size={14} />
							</Button>
						</Link>
					</div>
				</Card>
			</div>

			{/* Secondary Row: Connected Apps & Admin Shortcuts */}
			<div className="grid gap-6 sm:grid-cols-2">
				{/* Connected Apps Card */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
									<AppWindow size={16} />
								</div>
								<div>
									<CardTitle className="text-sm font-semibold">
										Connected Applications
									</CardTitle>
									<p className="text-xs text-zinc-400">
										OAuth apps authorized to access your account
									</p>
								</div>
							</div>
							<Link to="/account/authorized-apps">
								<Button variant="ghost" size="sm">
									View all
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-zinc-400 leading-relaxed">
							Manage third-party applications and services granted permissions
							to authenticate with your{" "}
							<span className="text-violet-400 font-medium">
								{INSTANCE_NAME}
							</span>{" "}
							account. Revoke access at any time.
						</p>
					</CardContent>
				</Card>

				{/* Admin Console Shortcut */}
				{hasAnyAdminAccess && (
					<Card className="border-violet-500/20 bg-violet-950/10">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300">
										<SlidersHorizontal size={16} />
									</div>
									<div>
										<CardTitle className="text-sm font-semibold text-violet-200">
											Administration
										</CardTitle>
										<p className="text-xs text-violet-300/70">
											System configuration & client management
										</p>
									</div>
								</div>
								<Badge variant="violet">Admin Console</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2.5">
								{canAccessClients && (
									<Link to="/admin/clients">
										<Button
											variant="secondary"
											size="sm"
											icon={<AppWindow size={14} />}
										>
											OAuth Clients
										</Button>
									</Link>
								)}
								{canAccessUsers && (
									<Link to="/admin/users">
										<Button
											variant="secondary"
											size="sm"
											icon={<Users size={14} />}
										>
											User Directory
										</Button>
									</Link>
								)}
								{canAccessRoles && (
									<Link to="/admin/roles">
										<Button
											variant="secondary"
											size="sm"
											icon={<Shield size={14} />}
										>
											Roles & Permissions
										</Button>
									</Link>
								)}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
