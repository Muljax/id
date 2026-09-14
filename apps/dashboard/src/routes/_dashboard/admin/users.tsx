import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getUserAvatarUrl, getUsers, type AdminUser } from "@/lib/api/admin";

export const Route = createFileRoute("/_dashboard/admin/users")({
	staticData: {
		navigation: {
			label: "Users",
			order: 30,
		},
	},
	component: UsersPage,
});

function UsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

	const loadUsers = useCallback(() => {
		return getUsers()
			.then(({ users }) => setUsers(users))
			.finally(() => {
				setLoading(false);
				setRefreshing(false);
			});
	}, []);

	useEffect(() => {
		void loadUsers();
	}, [loadUsers]);

	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="User directory"
				description="Browse and inspect all registered accounts within your Muljax ID identity tenant."
				actions={
					<Button
						type="button"
						variant="secondary"
						size="sm"
						loading={refreshing}
						onClick={() => {
							setRefreshing(true);
							void loadUsers();
						}}
						icon={<RefreshCw size={14} />}
					>
						Refresh
					</Button>
				}
			/>

			{users.length === 0 ? (
				<EmptyState
					icon={<Users size={24} />}
					title="No users found"
					description="No user accounts currently exist in this database."
				/>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold">
								Registered users
							</CardTitle>
							<Badge variant="default">{users.length} Total</Badge>
						</div>
					</CardHeader>

					<div className="divide-y divide-white/6">
						{users.map((user) => (
							<UserRow
								key={user.id}
								user={user}
								expanded={expandedUserId === user.id}
								onToggle={() =>
									setExpandedUserId((current) =>
										current === user.id ? null : user.id,
									)
								}
							/>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}

function UserRow({
	user,
	expanded,
	onToggle,
}: {
	user: AdminUser;
	expanded: boolean;
	onToggle: () => void;
}) {
	const name = user.displayName || user.email;

	return (
		<div>
			<button
				type="button"
				onClick={onToggle}
				className="w-full p-5 sm:p-6 text-left transition-colors hover:bg-white/[0.02] cursor-pointer"
			>
				<div className="flex items-center gap-4">
					<UserAvatar user={user} />

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<span className="truncate text-sm font-medium text-white">
								{name}
							</span>
							{user.isAdmin && (
								<Badge variant="violet" size="sm">
									Admin
								</Badge>
							)}
						</div>
						<div className="mt-0.5 truncate text-xs text-zinc-400">
							{user.email}
						</div>
					</div>

					<div className="hidden sm:flex items-center gap-2">
						<Badge variant={user.disabledAt ? "danger" : "success"} size="sm">
							{user.disabledAt ? "Disabled" : "Active"}
						</Badge>

						<Badge
							variant={user.emailVerifiedAt ? "info" : "default"}
							size="sm"
						>
							{user.emailVerifiedAt ? "Verified" : "Unverified"}
						</Badge>
					</div>

					<ChevronDown
						size={16}
						className={`text-zinc-500 transition-transform duration-200 ${
							expanded ? "rotate-180" : ""
						}`}
					/>
				</div>
			</button>

			{expanded && <UserDetails user={user} />}
		</div>
	);
}

function UserAvatar({ user }: { user: AdminUser }) {
	const [failed, setFailed] = useState(false);
	const name = user.displayName || user.email;

	if (!user.profileImageKey || failed) {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-sm font-semibold text-zinc-300 shadow-sm">
				{name.charAt(0).toUpperCase()}
			</div>
		);
	}

	return (
		<img
			src={`${getUserAvatarUrl(user.id)}?v=${encodeURIComponent(user.profileImageKey)}`}
			alt=""
			className="h-10 w-10 shrink-0 rounded-full object-cover border border-white/10"
			onError={() => setFailed(true)}
		/>
	);
}

function UserDetails({ user }: { user: AdminUser }) {
	const fields = [
		["User ID", user.id],
		["Email", user.email],
		["Display name", user.displayName],
		["Given name", user.givenName],
		["Family name", user.familyName],
		["Middle name", user.middleName],
		["Nickname", user.nickname],
		["Preferred username", user.preferredUsername],
		["Profile URL", user.profileUrl],
		["Website", user.website],
		["Gender", user.gender],
		["Birthdate", user.birthdate],
		["Time zone", user.zoneinfo],
		["Locale", user.locale],
		["Role", user.isAdmin ? "Administrator" : "Standard User"],
		["Account status", user.disabledAt ? "Disabled" : "Active"],
		[
			"Email verified",
			user.emailVerifiedAt
				? new Date(user.emailVerifiedAt).toLocaleString()
				: "Unverified",
		],
		["Registered at", new Date(user.createdAt).toLocaleString()],
		["Updated at", new Date(user.updatedAt).toLocaleString()],
	] as const;

	return (
		<div className="border-t border-white/6 bg-white/[0.015] px-6 py-5">
			<div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
				{fields.map(([label, value]) => (
					<div key={label} className="min-w-0">
						<span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
							{label}
						</span>
						<p className="mt-1 truncate font-mono text-xs text-zinc-200">
							{value || "—"}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
