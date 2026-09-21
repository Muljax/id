import type {
	AuthResponse,
	OAuthGrant,
	OAuthGrantsResponse,
	UpdateProfileInput,
} from "@muljax/id-api";
import { API_URL, api } from "./client";

export type { OAuthGrant, OAuthGrantsResponse, UpdateProfileInput };

export function changePassword(currentPassword: string, newPassword: string) {
	return api<{ success: boolean }>("/api/account/password", {
		method: "POST",
		body: JSON.stringify({ currentPassword, newPassword }),
	});
}

export function updateProfile(profile: UpdateProfileInput) {
	return api<AuthResponse>("/api/account/profile", {
		method: "PATCH",
		body: JSON.stringify(profile),
	});
}

export function uploadProfileAvatar(file: File) {
	const form = new FormData();
	form.append("file", file);
	return api<{ success: boolean; profileImageKey: string }>(
		"/api/account/avatar",
		{
			method: "PUT",
			body: form,
		},
	);
}

export function deleteProfileAvatar() {
	return api<{ success: boolean }>("/api/account/avatar", {
		method: "DELETE",
	});
}

export function getProfileAvatarUrl() {
	return `${API_URL}/api/account/avatar`;
}

export function getOAuthGrants() {
	return api<OAuthGrantsResponse>("/api/account/oauth/grants");
}

export function revokeOAuthGrant(clientId: string) {
	return api<{ success: boolean }>(`/api/account/oauth/grants/${clientId}`, {
		method: "DELETE",
	});
}

export function deleteAccount(password?: string) {
	return api<{ success: boolean }>("/api/account", {
		method: "DELETE",
		body: JSON.stringify({ password }),
	});
}
