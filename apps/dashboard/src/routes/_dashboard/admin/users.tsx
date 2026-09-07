import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
	const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

	useEffect(() => {
		getUsers()
			.then(({ users }) => setUsers(users))
			.finally(() => setLoading(false));
	}, []);

	return (
		<>
			<header className="mb-8 max-w-2xl">
				<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
					Users
				</h1>
				<p className="mt-2 text-sm leading-6 text-zinc-500">
					View users registered with Muljax ID.
				</p>
			</header>

			{loading ? (
				<div className="flex justify-center py-16">
					<Spinner size="lg" />
				</div>
			) : (
				<section className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
					<div className="border-b border-white/8 px-6 py-5">
						<h2 className="text-sm font-medium text-white">All users</h2>
						<p className="mt-1 text-sm text-zinc-500">
							{users.length} {users.length === 1 ? "user" : "users"}
						</p>
					</div>

					{users.length ? (
						<div className="divide-y divide-white/8">
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
					) : (
						<div className="px-6 py-6 text-sm text-zinc-500">
							No users found.
						</div>
					)}
				</section>
			)}
		</>
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
				className="w-full px-6 py-4 text-left transition hover:bg-white/3"
			>
				<div className="flex items-center gap-4">
					<Avatar user={user} />

					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-medium text-white">
							{name}
						</div>
						<div className="mt-0.5 truncate text-sm text-zinc-500">
							{user.email}
						</div>
					</div>

					<div className="hidden items-center gap-2 sm:flex">
						<StatusBadge
							value={user.disabledAt ? "Disabled" : "Active"}
							variant={user.disabledAt ? "danger" : "success"}
						/>

						<StatusBadge
							value={user.emailVerifiedAt ? "Verified" : "Unverified"}
							variant={user.emailVerifiedAt ? "info" : "default"}
						/>

						{user.isAdmin && <StatusBadge value="Admin" variant="admin" />}
					</div>

					<Chevron expanded={expanded} />
				</div>
			</button>

			{expanded && <UserDetails user={user} />}
		</div>
	);
}

function Avatar({ user }: { user: AdminUser }) {
	const [failed, setFailed] = useState(false);
	const name = user.displayName || user.email;

	if (!user.profileImageKey || failed) {
		return (
			<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-zinc-300">
				{name.charAt(0).toUpperCase()}
			</div>
		);
	}

	return (
		<img
			src={`${getUserAvatarUrl(user.id)}?v=${encodeURIComponent(user.profileImageKey)}`}
			alt=""
			className="size-10 shrink-0 rounded-full object-cover"
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
		["Zoneinfo", user.zoneinfo],
		["Locale", user.locale],
		["Role", user.isAdmin ? "Administrator" : "User"],
		["Status", user.disabledAt ? "Disabled" : "Active"],
		[
			"Email verification",
			user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Not verified",
		],
		["Created", formatDate(user.createdAt)],
		["Updated", formatDate(user.updatedAt)],
	] as const;

	return (
		<div className="border-t border-white/6 bg-black/10 px-6 py-5">
			<div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
				{fields.map(([label, value]) => (
					<Field key={label} label={label} value={value} />
				))}
			</div>
		</div>
	);
}

function Field({
	label,
	value,
}: {
	label: string;
	value: string | number | null;
}) {
	return (
		<div className="min-w-0">
			<div className="text-xs font-medium text-zinc-500">{label}</div>
			<div className="mt-1 truncate text-sm text-zinc-200">{value ?? "—"}</div>
		</div>
	);
}

function StatusBadge({
	value,
	variant,
}: {
	value: string;
	variant: "success" | "danger" | "info" | "admin" | "default";
}) {
	const styles = {
		success: "bg-emerald-400/10 text-emerald-400",
		danger: "bg-red-400/10 text-red-400",
		info: "bg-blue-400/10 text-blue-400",
		admin: "bg-violet-400/10 text-violet-400",
		default: "bg-white/6 text-zinc-500",
	};

	return (
		<span className={`rounded-full px-2.5 py-1 text-xs ${styles[variant]}`}>
			{value}
		</span>
	);
}

function Chevron({ expanded }: { expanded: boolean }) {
	return (
		<svg
			className={`size-4 shrink-0 text-zinc-600 transition-transform ${
				expanded ? "rotate-180" : ""
			}`}
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1-1.08-1.06l-4.25-4.5a.75.75 0 0 1 .02 1.06l-4.25-4.5Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

function formatDate(timestamp: number) {
	return new Date(timestamp).toLocaleString();
}
