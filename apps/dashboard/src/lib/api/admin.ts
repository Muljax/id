import type {
	AdminUser,
	AdminUserSessionsResponse,
	LifecycleAction,
	PasswordResetLinkResponse,
	UserLifecycleOptions,
	UserLifecycleResponse,
	UsersResponse,
} from "@muljax/id-api";
import { API_URL, api } from "./client";

export type {
	AdminUser,
	AdminUserSessionsResponse,
	LifecycleAction,
	PasswordResetLinkResponse,
	UserLifecycleOptions,
	UserLifecycleResponse,
	UsersResponse,
};

export function bootstrapAdmin(secret: string) {
	return api<{ success: boolean; message: string }>("/api/admin/bootstrap", {
		method: "POST",
		body: JSON.stringify({ secret }),
	});
}

export function getUsers(): Promise<UsersResponse> {
	return api<UsersResponse>("/api/admin/users");
}

export function getUserAvatarUrl(userId: string): string {
	return `${API_URL}/api/users/${userId}/avatar`;
}

export function generatePasswordResetLink(userId: string) {
	return api<PasswordResetLinkResponse>(
		`/api/admin/users/${userId}/password-reset-link`,
		{
			method: "POST",
		},
	);
}

export function executeUserLifecycle(
	userId: string,
	options: UserLifecycleOptions,
) {
	return api<UserLifecycleResponse>(`/api/admin/users/${userId}/lifecycle`, {
		method: "POST",
		body: JSON.stringify(options),
	});
}

export function deleteUser(userId: string) {
	return api<{ success: boolean; userId: string }>(
		`/api/admin/users/${userId}`,
		{
			method: "DELETE",
		},
	);
}

export function getUserAdminSessions(userId: string) {
	return api<AdminUserSessionsResponse>(`/api/admin/users/${userId}/sessions`);
}

export function revokeUserAdminSession(userId: string, sessionId: string) {
	return api<{ success: boolean }>(
		`/api/admin/users/${userId}/sessions/${sessionId}/revoke`,
		{
			method: "POST",
		},
	);
}

export function revokeAllUserAdminSessions(userId: string) {
	return api<{ success: boolean }>(
		`/api/admin/users/${userId}/sessions/revoke-all`,
		{
			method: "POST",
		},
	);
}
