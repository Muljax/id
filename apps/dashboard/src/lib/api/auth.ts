import type {
	AuthResponse,
	AuthUser,
	ElevateOptionsResponse,
	ElevateRequest,
	ElevateResponse,
	PublicAuthSettings,
} from "@muljax/id-api";
import { api } from "./client";

export type {
	AuthResponse,
	AuthUser,
	ElevateOptionsResponse,
	ElevateRequest,
	ElevateResponse,
	PublicAuthSettings,
};

export function login(
	email: string,
	password: string,
	rememberMe: boolean,
	prompt?: string,
	adminKey?: string,
) {
	return api<AuthResponse>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password, rememberMe, prompt, adminKey }),
	});
}

export function register(
	email: string,
	password: string,
	inviteToken?: string,
) {
	return api<AuthResponse>("/api/auth/register", {
		method: "POST",
		body: JSON.stringify({ email, password, inviteToken }),
	});
}

export function getPublicAuthSettings() {
	return api<PublicAuthSettings>("/api/auth/settings");
}

export function logout() {
	return api<{ success: boolean }>("/api/auth/logout", {
		method: "POST",
	});
}

export function getCurrentUser() {
	return api<AuthResponse>("/api/auth/me");
}

export function requestPasswordReset(email: string) {
	return api<{ message: string }>("/api/auth/password-reset/request", {
		method: "POST",
		body: JSON.stringify({ email }),
	});
}

export function verifyPasswordResetToken(token: string) {
	return api<{
		valid: boolean;
		email?: string;
		expiresAt?: number;
		error?: string;
	}>(`/api/auth/password-reset/verify?token=${encodeURIComponent(token)}`);
}

export function confirmPasswordReset(token: string, newPassword: string) {
	return api<{ message: string }>("/api/auth/password-reset/confirm", {
		method: "POST",
		body: JSON.stringify({ token, newPassword }),
	});
}

export function getElevateOptions() {
	return api<ElevateOptionsResponse>("/api/auth/elevate/options", {
		method: "POST",
	});
}

export function verifyElevate(payload: ElevateRequest) {
	return api<ElevateResponse>("/api/auth/elevate/verify", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}
