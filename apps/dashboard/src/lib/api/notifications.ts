import type {
	Notification,
	NotificationCategory,
	NotificationSeverity,
	NotificationTarget,
	NotificationsResponse,
} from "@muljax/id-api";
import { API_URL, api } from "./client";

export type {
	Notification,
	NotificationCategory,
	NotificationSeverity,
	NotificationTarget,
	NotificationsResponse,
};

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
