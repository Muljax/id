import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, Copy, KeyRound, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import {
	generatePasswordResetLink,
	getUserAvatarUrl,
	getUsers,
	type AdminUser,
} from "@/lib/api/admin";

export interface UsersSearch {
	userId?: string;
}

export const Route = createFileRoute("/_dashboard/admin/users")({
	validateSearch: (search: Record<string, unknown>): UsersSearch => ({
		userId: typeof search.userId === "string" ? search.userId : undefined,
	}),
	staticData: {
		navigation: {
			label: "Users",
			order: 30,
		},
	},
	component: UsersPage,
});

function UsersPage() {
	const { userId } = Route.useSearch();
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [expandedUserId, setExpandedUserId] = useState<string | null>(
		userId ?? null,
	);
	const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);

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

	useEffect(() => {
		if (userId) {
			setExpandedUserId(userId);
		}
	}, [userId]);

	useEffect(() => {
		if (userId && !loading && users.length > 0) {
			const element = document.getElementById(`user-row-${userId}`);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}, [userId, loading, users]);

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
								isTarget={userId === user.id}
								onToggle={() =>
									setExpandedUserId((current) =>
										current === user.id ? null : user.id,
									)
								}
								onResetPassword={(target) => setResetTargetUser(target)}
							/>
						))}
					</div>
				</Card>
			)}

			{resetTargetUser && (
				<ResetPasswordModal
					user={resetTargetUser}
					onClose={() => setResetTargetUser(null)}
				/>
			)}
		</div>
	);
}

function UserRow({
	user,
	expanded,
	isTarget,
	onToggle,
	onResetPassword,
}: {
	user: AdminUser;
	expanded: boolean;
	isTarget: boolean;
	onToggle: () => void;
	onResetPassword: (user: AdminUser) => void;
}) {
	const name = user.displayName || user.email;

	return (
		<div
			id={`user-row-${user.id}`}
			className={`transition-colors ${
				isTarget ? "bg-violet-500/[0.05] ring-1 ring-violet-500/30" : ""
			}`}
		>
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

			{expanded && (
				<UserDetails user={user} onResetPassword={onResetPassword} />
			)}
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

function UserDetails({
	user,
	onResetPassword,
}: {
	user: AdminUser;
	onResetPassword: (user: AdminUser) => void;
}) {
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

			<div className="mt-6 flex items-center justify-end border-t border-white/6 pt-4">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					icon={<KeyRound size={14} />}
					onClick={() => onResetPassword(user)}
				>
					Generate Password Reset Link
				</Button>
			</div>
		</div>
	);
}

function ResetPasswordModal({
	user,
	onClose,
}: {
	user: AdminUser;
	onClose: () => void;
}) {
	const toast = useToast();
	const [generating, setGenerating] = useState(false);
	const [resetData, setResetData] = useState<{
		resetUrl: string;
		expiresAt: number;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	async function handleGenerate() {
		setGenerating(true);
		try {
			const res = await generatePasswordResetLink(user.id);
			setResetData({
				resetUrl: res.resetUrl,
				expiresAt: res.expiresAt,
			});
			toast.success("Password reset link generated");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to generate password reset link";
			toast.error(message);
		} finally {
			setGenerating(false);
		}
	}

	async function handleCopy() {
		if (!resetData?.resetUrl) return;
		try {
			await navigator.clipboard.writeText(resetData.resetUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success("Link copied to clipboard");
		} catch {
			toast.error("Failed to copy link");
		}
	}

	return (
		<Modal
			open={true}
			title="Generate Password Reset Link"
			description={`Create a single-use reset link for ${user.displayName || user.email}.`}
			onClose={onClose}
		>
			<div className="space-y-5">
				{!resetData ? (
					<>
						<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 leading-relaxed">
							Generating a new link will automatically invalidate any previous reset
							tokens issued for this account. The link expires in 24 hours.
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<Button type="button" variant="secondary" onClick={onClose}>
								Cancel
							</Button>
							<Button
								type="button"
								loading={generating}
								onClick={() => void handleGenerate()}
								icon={<KeyRound size={14} />}
							>
								Generate Reset Link
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="space-y-2">
							<label className="text-xs font-medium text-zinc-300">
								One-time reset URL
							</label>
							<div className="flex items-center gap-2">
								<input
									type="text"
									readOnly
									value={resetData.resetUrl}
									className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none select-all"
									onClick={(e) => (e.target as HTMLInputElement).select()}
								/>
								<Button
									type="button"
									variant={copied ? "primary" : "secondary"}
									size="sm"
									onClick={() => void handleCopy()}
									icon={copied ? <Check size={14} /> : <Copy size={14} />}
								>
									{copied ? "Copied" : "Copy"}
								</Button>
							</div>
						</div>

						<p className="text-[11px] text-zinc-500">
							This link is single-use and will expire on{" "}
							<span className="font-mono text-zinc-300">
								{new Date(resetData.expiresAt).toLocaleString()}
							</span>
							. Send this link directly to the user through a verified channel.
						</p>

						<div className="flex justify-end pt-2">
							<Button type="button" variant="secondary" onClick={onClose}>
								Done
							</Button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}
