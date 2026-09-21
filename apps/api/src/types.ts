import type {
	instanceSettings,
	inviteTokens,
	notifications,
	oauthClients,
	passkeys,
	permissions,
	roles,
	sessions,
	signinKeys,
	sshCertificates,
	userSshKeys,
	users,
} from "./db/schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DbRole = typeof roles.$inferSelect;
export type DbPermission = typeof permissions.$inferSelect;
export type DbOAuthClient = typeof oauthClients.$inferSelect;
export type DbSession = typeof sessions.$inferSelect;
export type DbUserSshKey = typeof userSshKeys.$inferSelect;
export type DbSshCertificate = typeof sshCertificates.$inferSelect;
export type DbSigninKey = typeof signinKeys.$inferSelect;
export type DbInstanceSettings = typeof instanceSettings.$inferSelect;
export type DbInviteToken = typeof inviteTokens.$inferSelect;
export type DbNotification = typeof notifications.$inferSelect;
export type DbPasskey = typeof passkeys.$inferSelect;

export type SignupMode = "enabled" | "invite" | "disabled";
export type SigninMode = "enabled" | "admin_key" | "disabled";

export type NotificationTarget = "user" | "admins" | "all";
export type NotificationCategory =
	| "general"
	| "security"
	| "auth"
	| "admin"
	| "system";
export type NotificationSeverity = "info" | "success" | "warning" | "danger";

export type { AppType } from "./index";
export * from "./schemas/common";
export * from "./schemas/auth";
export * from "./schemas/admin";
export * from "./schemas/ssh";
export * from "./schemas/account";
export * from "./schemas/passkeys";
export * from "./schemas/notifications";
export * from "./schemas/oauth";
