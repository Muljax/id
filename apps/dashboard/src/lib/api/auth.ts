import { api } from "./client";

export interface AuthUser {
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

	createdAt: number;
	isAdmin: boolean;
}

export interface AuthResponse {
	user: AuthUser;
}

export function login(
	email: string,
	password: string,
	rememberMe: boolean,
	prompt?: string,
) {
	return api<AuthResponse>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify({
			email,
			password,
			rememberMe,
			prompt,
		}),
	});
}

export function register(email: string, password: string) {
	return api<AuthResponse>("/api/auth/register", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
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
	return api<{ valid: boolean; email?: string; expiresAt?: number }>(
		`/api/auth/password-reset/verify?token=${encodeURIComponent(token)}`,
	);
}

export function confirmPasswordReset(token: string, newPassword: string) {
	return api<{ success: boolean; message: string }>(
		"/api/auth/password-reset/confirm",
		{
			method: "POST",
			body: JSON.stringify({ token, newPassword }),
		},
	);
}
