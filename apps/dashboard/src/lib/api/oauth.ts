import type {
	CreateOAuthClientRequest,
	CreateOAuthClientResponse,
	OAuthClient,
	OAuthClientsResponse,
	OAuthDetailsResponse,
	OAuthDeviceApproveResponse,
	OAuthDeviceDetailsResponse,
	UpdateOAuthClientResponse,
} from "@muljax/id-api";
import { api } from "./client";

export type {
	CreateOAuthClientRequest,
	CreateOAuthClientResponse,
	OAuthClient,
	OAuthClientsResponse,
	OAuthDeviceApproveResponse,
	OAuthDeviceDetailsResponse,
	UpdateOAuthClientResponse,
};
export type OAuthClientResponse = CreateOAuthClientResponse;
export type OAuthClientDetails = OAuthDetailsResponse;

export function getOAuthClients() {
	return api<OAuthClientsResponse>("/oauth/clients");
}

export function createOAuthClient(input: CreateOAuthClientRequest) {
	return api<CreateOAuthClientResponse>("/oauth/clients", {
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
	return api<UpdateOAuthClientResponse>(`/oauth/clients/${clientId}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteOAuthClient(clientId: string) {
	return api<{ success: boolean }>(`/oauth/clients/${clientId}`, {
		method: "DELETE",
	});
}

export function getOAuthClientDetails(clientId: string, redirectUri?: string) {
	const params = new URLSearchParams({ client_id: clientId });
	if (redirectUri) {
		params.set("redirect_uri", redirectUri);
	}
	return api<OAuthDetailsResponse>(`/oauth/details?${params.toString()}`);
}

export function getOAuthDeviceDetails(userCode: string) {
	const params = new URLSearchParams({ user_code: userCode });
	return api<OAuthDeviceDetailsResponse>(
		`/oauth/device/details?${params.toString()}`,
	);
}

export function approveOAuthDevice(userCode: string) {
	return api<OAuthDeviceApproveResponse>("/oauth/device/approve", {
		method: "POST",
		body: JSON.stringify({ user_code: userCode }),
	});
}

export function denyOAuthDevice(userCode: string) {
	return api<OAuthDeviceApproveResponse>("/oauth/device/deny", {
		method: "POST",
		body: JSON.stringify({ user_code: userCode }),
	});
}
