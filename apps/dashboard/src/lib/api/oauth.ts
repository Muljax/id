import { api } from "./client";

export interface OAuthClient {
	id: string;
	name: string;
	clientType: "public" | "confidential";
	redirectUris: string[];
	scopes: string[];
	createdAt: number;
	updatedAt: number;
}

export interface OAuthClientsResponse {
	clients: OAuthClient[];
}

export interface OAuthClientResponse {
	client_id: string;
	client_secret?: string;
	name: string;
	client_type: "public" | "confidential";
	redirect_uris: string[];
	scopes: string[];
	created_at?: number;
	updated_at?: number;
}

export function getOAuthClients() {
	return api<OAuthClientsResponse>("/oauth/clients");
}

export function createOAuthClient(input: {
	name: string;
	clientType: "public" | "confidential";
	redirectUris: string[];
	scopes: string[];
}) {
	return api<OAuthClientResponse>("/oauth/clients", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function updateOAuthClient(
	clientId: string,
	input: {
		name: string;
		redirectUris: string[];
		scopes: string[];
	},
) {
	return api<OAuthClientResponse>(`/oauth/clients/${clientId}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteOAuthClient(clientId: string) {
	return api<{ success: boolean }>(`/oauth/clients/${clientId}`, {
		method: "DELETE",
	});
}

export interface OAuthClientDetails {
	client_id: string;
	name: string;
	redirect_uri_valid?: boolean;
}

export function getOAuthClientDetails(clientId: string, redirectUri?: string) {
	const params = new URLSearchParams({ client_id: clientId });
	if (redirectUri) {
		params.set("redirect_uri", redirectUri);
	}

	return api<OAuthClientDetails>(`/oauth/details?${params.toString()}`);
}
