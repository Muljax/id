import { useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	Bell,
	CheckCheck,
	CheckCircle2,
	ExternalLink,
	Info,
	ShieldAlert,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useNotifications } from "@/context/NotificationContext";
import type { Notification, NotificationSeverity } from "@/lib/api";

function formatRelativeTime(timestamp: number) {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "Just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(timestamp).toLocaleDateString();
}

function getSeverityIcon(severity: string | NotificationSeverity) {
	switch (severity) {
		case "danger":
			return <ShieldAlert size={16} className="text-red-400 shrink-0" />;
		case "warning":
			return <AlertTriangle size={16} className="text-amber-400 shrink-0" />;
		case "success":
			return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />;
		default:
			return <Info size={16} className="text-violet-400 shrink-0" />;
	}
}

export default function NotificationBell() {
	const {
		notifications,
		unreadCount,
		loading,
		markAsRead,
		markAllAsRead,
		dismiss,
	} = useNotifications();
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close when clicking outside
	useEffect(() => {
		if (!open) return;

		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open]);

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
				aria-label="Notifications"
				aria-expanded={open}
			>
				<Bell size={17} />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-950 animate-pulse">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/10 bg-zinc-950/95 p-0 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between border-b border-white/8 px-4 py-3 bg-white/[0.02]">
						<div className="flex items-center gap-2">
							<span className="text-sm font-semibold text-white">
								Notifications
							</span>
							{unreadCount > 0 && (
								<Badge variant="violet" size="sm">
									{unreadCount} unread
								</Badge>
							)}
						</div>

						{unreadCount > 0 && (
							<button
								type="button"
								onClick={() => void markAllAsRead()}
								className="flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
							>
								<CheckCheck size={14} />
								Mark all read
							</button>
						)}
					</div>

					{/* Notification List */}
					<div className="max-h-[380px] overflow-y-auto divide-y divide-white/6">
						{loading ? (
							<div className="flex justify-center py-8">
								<Spinner size="sm" />
							</div>
						) : notifications.length === 0 ? (
							<div className="py-10 px-4 text-center">
								<div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-500">
									<Bell size={18} />
								</div>
								<p className="text-xs font-medium text-zinc-300">
									No notifications
								</p>
								<p className="mt-0.5 text-[11px] text-zinc-500">
									You're all caught up with security and activity alerts.
								</p>
							</div>
						) : (
							notifications.map((n) => (
								<NotificationItem
									key={n.id}
									notification={n}
									onMarkRead={() => void markAsRead(n.id)}
									onDismiss={() => void dismiss(n.id)}
									onCloseMenu={() => setOpen(false)}
								/>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function NotificationItem({
	notification,
	onMarkRead,
	onDismiss,
	onCloseMenu,
}: {
	notification: Notification;
	onMarkRead: () => void;
	onDismiss: () => void;
	onCloseMenu: () => void;
}) {
	const navigate = useNavigate();
	const isUnread = !notification.readAt;

	function handleActionClick(event: React.MouseEvent<HTMLAnchorElement>) {
		if (!notification.actionUrl) return;
		event.preventDefault();
		onCloseMenu();

		const [pathname, searchStr] = notification.actionUrl.split("?");
		const search: Record<string, string> = {};
		if (searchStr) {
			const params = new URLSearchParams(searchStr);
			params.forEach((value, key) => {
				search[key] = value;
			});
		}

		void navigate({
			to: pathname,
			search: Object.keys(search).length > 0 ? search : undefined,
		});
	}

	return (
		<div
			className={`group relative flex items-start gap-3 p-3.5 transition-colors ${
				isUnread
					? "bg-violet-500/[0.04] hover:bg-violet-500/[0.08]"
					: "hover:bg-white/[0.02]"
			}`}
		>
			<div className="mt-0.5">{getSeverityIcon(notification.severity)}</div>

			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-center justify-between gap-2">
					<h4
						className={`truncate text-xs font-medium ${
							isUnread ? "text-white" : "text-zinc-300"
						}`}
					>
						{notification.title}
					</h4>

					<span className="text-[10px] text-zinc-500 shrink-0 font-mono">
						{formatRelativeTime(notification.createdAt)}
					</span>
				</div>

				<p className="text-xs text-zinc-400 break-words leading-relaxed">
					{notification.message}
				</p>

				{notification.actionUrl && (
					<div className="pt-1">
						<a
							href={notification.actionUrl}
							onClick={handleActionClick}
							className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
						>
							View details <ExternalLink size={12} />
						</a>
					</div>
				)}
			</div>

			<div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				{isUnread && (
					<button
						type="button"
						onClick={onMarkRead}
						title="Mark as read"
						className="rounded p-1 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
					>
						<CheckCheck size={13} />
					</button>
				)}
				<button
					type="button"
					onClick={onDismiss}
					title="Dismiss"
					className="rounded p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
				>
					<Trash2 size={13} />
				</button>
			</div>
		</div>
	);
}
