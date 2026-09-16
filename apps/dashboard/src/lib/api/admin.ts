import { api, API_URL } from "./client";

export function bootstrapAdmin(secret: string) {
	return api<{ success: boolean }>("/api/admin/bootstrap", {
		method: "POST",
		body: JSON.stringify({ secret }),
	});
}

export interface AdminUser {
	id: string;
	email: string;

	displayName: string | null;
	givenName: string | null;
	familyName: string | null;
	middleName: string | null;
	nickname: string | null;
	preferredUsername: string | null;

	profileUrl: string | null;
	profileImageKey: string | null;
	website: string | null;

	gender: string | null;
	birthdate: string | null;
	zoneinfo: string | null;
	locale: string | null;

	emailVerifiedAt: number | null;
	isAdmin: boolean;
	roles?: string[];
	roleIds?: string[];
	disabledAt: number | null;

	createdAt: number;
	updatedAt: number;
}

export interface UsersResponse {
	users: AdminUser[];
}

export function getUsers(): Promise<UsersResponse> {
	return api<UsersResponse>("/api/admin/users");
}

export function getUserAvatarUrl(userId: string): string {
	return `${API_URL}/api/users/${userId}/avatar`;
}

export interface PasswordResetLinkResponse {
	token: string;
	resetUrl: string;
	expiresAt: number;
}

export function generatePasswordResetLink(userId: string) {
	return api<PasswordResetLinkResponse>(
		`/api/admin/users/${encodeURIComponent(userId)}/password-reset-link`,
		{
			method: "POST",
		},
	);
}

export type LifecycleAction = "enable" | "disable";

export interface UserLifecycleOptions {
	action: LifecycleAction;
	executeAt?: number | null;
}

export interface UserLifecycleResponse {
	success?: boolean;
	id?: string;
	userId: string;
	action: LifecycleAction;
	status: string;
	scheduled: boolean;
	executeAt?: number;
	executedAt?: number;
}

export function executeUserLifecycle(
	userId: string,
	options: UserLifecycleOptions,
) {
	return api<UserLifecycleResponse>(
		`/api/admin/users/${encodeURIComponent(userId)}/lifecycle`,
		{
			method: "POST",
			body: JSON.stringify(options),
		},
	);
}
