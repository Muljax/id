import type {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

import type { AuthResponse } from "./auth";
import { api } from "./client";

export function getPasskeyRegistrationOptions() {
	return api<PublicKeyCredentialCreationOptionsJSON>(
		"/api/passkeys/register/options",
		{
			method: "POST",
		},
	);
}

export function verifyPasskeyRegistration(response: unknown, name: string) {
	return api<{ success: boolean }>("/api/passkeys/register/verify", {
		method: "POST",
		body: JSON.stringify({ response, name }),
	});
}

export interface PasskeyLoginOptions
	extends PublicKeyCredentialRequestOptionsJSON {
	challengeId: string;
}

export function getPasskeyLoginOptions() {
	return api<PasskeyLoginOptions>("/api/passkeys/login/options", {
		method: "POST",
	});
}

export function verifyPasskeyLogin(
	response: unknown,
	challengeId: string,
	adminKey?: string,
) {
	return api<AuthResponse>("/api/passkeys/login/verify", {
		method: "POST",
		body: JSON.stringify({ response, challengeId, adminKey }),
	});
}

export interface Passkey {
	id: string;
	name: string | null;
	createdAt: number;
	lastUsedAt: number | null;
}

export interface PasskeysResponse {
	passkeys: Passkey[];
}

export function getPasskeys() {
	return api<PasskeysResponse>("/api/passkeys");
}

export function deletePasskey(id: string) {
	return api<{ success: boolean }>(`/api/passkeys/${id}`, {
		method: "DELETE",
	});
}

export function renamePasskey(id: string, name: string) {
	return api<{ success: boolean }>(`/api/passkeys/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ name }),
	});
}
