export type NotificationTarget = "user" | "admins" | "all";

export type NotificationCategory =
	| "general"
	| "security"
	| "auth"
	| "admin"
	| "system";

export type NotificationSeverity = "info" | "success" | "warning" | "danger";

export interface NotificationPayload {
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

export interface EmitNotificationOptions {
	target?: NotificationTarget;
	userId?: string | null;
	type: string;
	category?: NotificationCategory;
	severity?: NotificationSeverity;
	title: string;
	message: string;
	actionUrl?: string | null;
	data?: Record<string, unknown> | null;
}
