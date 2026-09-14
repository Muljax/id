import { api, API_URL } from "./client";

export type NotificationTarget = "user" | "admins" | "all";

export type NotificationCategory =
	| "general"
	| "security"
	| "auth"
	| "admin"
	| "system";

export type NotificationSeverity = "info" | "success" | "warning" | "danger";

export interface Notification {
	id: string;
	target: NotificationTarget;
	userId?: string | null;
	type: string;
	category: NotificationCategory;
	severity: NotificationSeverity;
	title: string;
	message: string;
	actionUrl?: string | null;
	data?: string | null;
	readAt?: number | null;
	createdAt: number;
}

export interface NotificationsResponse {
	notifications: Notification[];
	unreadCount: number;
}

export function getNotifications() {
	return api<NotificationsResponse>("/api/notifications");
}

export function markNotificationRead(id: string) {
	return api<{ success: boolean }>(`/api/notifications/${id}/read`, {
		method: "POST",
	});
}

export function markAllNotificationsRead() {
	return api<{ success: boolean }>("/api/notifications/read-all", {
		method: "POST",
	});
}

export function deleteNotification(id: string) {
	return api<{ success: boolean }>(`/api/notifications/${id}`, {
		method: "DELETE",
	});
}

export function getNotificationStreamUrl() {
	return `${API_URL}/api/notifications/stream`;
}
