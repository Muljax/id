import type {
	AuthResponse,
	PasskeyItem,
	PasskeysResponse,
} from "@muljax/id-api";
import { api } from "./client";

import type {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export type Passkey = PasskeyItem;
export type { PasskeysResponse };
export type PasskeyLoginOptions = PublicKeyCredentialRequestOptionsJSON & {
	challengeId: string;
};

export function getPasskeyRegistrationOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
	return api<PublicKeyCredentialCreationOptionsJSON>(
		"/api/passkeys/register/options",
		{
			method: "POST",
		},
	);
}

export function verifyPasskeyRegistration(response: unknown, name: string) {
	return api<{ success: boolean; passkey?: PasskeyItem }>(
		"/api/passkeys/register/verify",
		{
			method: "POST",
			body: JSON.stringify({ response, name }),
		},
	);
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
