import { z } from "@hono/zod-openapi";

export const NotificationItemSchema = z
	.object({
		id: z.string().openapi({ example: "notif_uuid_1234" }),
		userId: z.string().nullable().openapi({ example: "user_uuid_1234" }),
		target: z.enum(["user", "admins", "all"]).openapi({ example: "user" }),
		type: z.string().openapi({ example: "auth.welcome" }),
		category: z
			.enum(["general", "security", "auth", "admin"])
			.openapi({ example: "general" }),
		severity: z
			.enum(["info", "success", "warning", "error"])
			.openapi({ example: "info" }),
		title: z.string().openapi({ example: "Welcome to Muljax ID" }),
		message: z
			.string()
			.openapi({ example: "Your account has been created successfully." }),
		actionUrl: z.string().nullable().openapi({ example: "/account/profile" }),
		data: z.string().nullable().openapi({ example: null }),
		readAt: z.number().nullable().openapi({ example: null }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("NotificationItem");

export const NotificationsListResponseSchema = z
	.object({
		notifications: z.array(NotificationItemSchema),
		unreadCount: z.number().openapi({ example: 3 }),
	})
	.openapi("NotificationsListResponse");

export type NotificationItem = z.infer<typeof NotificationItemSchema>;
export type Notification = NotificationItem;
export type NotificationsResponse = z.infer<
	typeof NotificationsListResponseSchema
>;
