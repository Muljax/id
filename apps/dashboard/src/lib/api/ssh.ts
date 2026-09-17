import { api } from "./client";

export interface SshKey {
	id: string;
	name: string;
	publicKey: string;
	fingerprint: string;
	createdAt: number;
	lastUsedAt: number | null;
}

export interface SshCertificate {
	id: string;
	userId: string;
	serial: string;
	keyId: string;
	principals: string[];
	validAfter: number;
	validBefore: number;
	fingerprint: string;
	caFingerprint: string;
	clientIp: string | null;
	userAgent: string | null;
	revokedAt?: number | null;
	revokedBy?: string | null;
	revokedReason?: string | null;
	createdAt: number;
}

export interface CaPublicKeyResponse {
	algorithm: string;
	publicKey: string;
	fingerprint: string;
}

export interface SshPrincipalsResponse {
	principals: string[];
	defaultPrincipal: string;
}

export interface IssueCertificateInput {
	publicKey?: string;
	savedKeyId?: string;
	principals?: string[];
	ttl?: number;
	comment?: string;
}

export interface IssueCertificateResponse {
	certificate: string;
	serial: string;
	keyId: string;
	principals: string[];
	validAfter: number;
	validBefore: number;
	fingerprint: string;
	caFingerprint: string;
}

export function getCaPublicKey() {
	return api<CaPublicKeyResponse>("/api/ssh/ca/public-key");
}

export function getSshPrincipals() {
	return api<SshPrincipalsResponse>("/api/ssh/principals");
}

export function getSshKeys() {
	return api<{ keys: SshKey[] }>("/api/ssh/keys");
}

export function addSshKey(input: { name: string; publicKey: string }) {
	return api<{ key: SshKey }>("/api/ssh/keys", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function deleteSshKey(id: string) {
	return api<void>(`/api/ssh/keys/${id}`, {
		method: "DELETE",
	});
}

export function getSshCertificates(showAll = false) {
	return api<{ certificates: SshCertificate[] }>(
		`/api/ssh/certs${showAll ? "?all=true" : ""}`,
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
