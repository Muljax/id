import type {
	AdminSigninKey,
	CreateSigninKeyResponse,
	InstanceSettings,
	SettingsResponse,
	SigninMode,
	SignupMode,
} from "@muljax/id-api";
import { api } from "./client";

export type {
	AdminSigninKey,
	CreateSigninKeyResponse,
	InstanceSettings,
	SettingsResponse,
	SigninMode,
	SignupMode,
};

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

export interface CreateSigninKeyRequest {
	name: string;
	ttlHours?: number;
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
	return api<{ success: boolean }>(`/api/admin/signin-keys/${id}`, {
		method: "DELETE",
	});
}
