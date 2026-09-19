import { api } from "./client";

export type SignupMode = "enabled" | "invite" | "disabled";
export type SigninMode = "enabled" | "admin_key" | "disabled";

export interface InstanceSettings {
	id: number;
	signupMode: SignupMode;
	signinMode: SigninMode;
	createdAt: number;
	updatedAt: number;
}

export interface SettingsResponse {
	settings: InstanceSettings;
}

export interface UpdateSettingsRequest {
	signupMode?: SignupMode;
	signinMode?: SigninMode;
}

export function getInstanceSettings(): Promise<SettingsResponse> {
	return api<SettingsResponse>("/api/admin/settings");
}

export function updateInstanceSettings(
	updates: UpdateSettingsRequest,
): Promise<SettingsResponse> {
	return api<SettingsResponse>("/api/admin/settings", {
		method: "PATCH",
		body: JSON.stringify(updates),
	});
}

export interface AdminSigninKey {
	id: string;
	name: string;
	keyHash: string;
	keyPrefix: string;
	createdByUserId: string | null;
	expiresAt: number | null;
	lastUsedAt: number | null;
	createdAt: number;
	creatorEmail?: string | null;
}

export interface CreateSigninKeyRequest {
	name: string;
	ttlHours?: number;
}

export interface CreateSigninKeyResponse {
	key: AdminSigninKey & {
		key: string;
	};
}

export function getSigninKeys(): Promise<{ keys: AdminSigninKey[] }> {
	return api<{ keys: AdminSigninKey[] }>("/api/admin/signin-keys");
}

export function createSigninKey(
	data: CreateSigninKeyRequest,
): Promise<CreateSigninKeyResponse> {
	return api<CreateSigninKeyResponse>("/api/admin/signin-keys", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function revokeSigninKey(id: string): Promise<{ success: boolean }> {
	return api<{ success: boolean }>(
		`/api/admin/signin-keys/${encodeURIComponent(id)}`,
		{
			method: "DELETE",
		},
	);
}
