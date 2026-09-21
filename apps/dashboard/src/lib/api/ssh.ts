import type {
	CaPublicKeyResponse,
	IssueCertificateInput,
	IssueCertificateResponse,
	SshCertificate,
	SshCertificatesResponse,
	SshKey,
	SshKeysResponse,
	SshPrincipalsResponse,
} from "@muljax/id-api";
import { api } from "./client";

export type {
	CaPublicKeyResponse,
	IssueCertificateInput,
	IssueCertificateResponse,
	SshCertificate,
	SshCertificatesResponse,
	SshKey,
	SshKeysResponse,
	SshPrincipalsResponse,
};

export function getCaPublicKey() {
	return api<CaPublicKeyResponse>("/api/ssh/ca/public-key");
}

export function getSshPrincipals() {
	return api<SshPrincipalsResponse>("/api/ssh/principals");
}

export function getSshKeys() {
	return api<SshKeysResponse>("/api/ssh/keys");
}

export function addSshKey(input: { name: string; publicKey: string }) {
	return api<{ key: SshKey }>("/api/ssh/keys", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function deleteSshKey(id: string) {
	return api<{ success: boolean }>(`/api/ssh/keys/${id}`, {
		method: "DELETE",
	});
}

export function getSshCertificates(showAll = false) {
	return api<SshCertificatesResponse>(
		showAll ? "/api/ssh/certs?all=true" : "/api/ssh/certs",
	);
}

export function issueSshCertificate(input: IssueCertificateInput) {
	return api<IssueCertificateResponse>("/api/ssh/certs/issue", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function revokeSshCertificate(id: string, reason?: string) {
	return api<{ success: boolean }>(`/api/ssh/certs/${id}/revoke`, {
		method: "POST",
		body: JSON.stringify({ reason }),
	});
}
