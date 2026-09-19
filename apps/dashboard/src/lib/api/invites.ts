import type { AdminUser } from "./admin";
import { api } from "./client";

export interface AdminInvite {
	id: string;
	email: string | null;
	tokenHash: string;
	roleId: string;
	createdByUserId: string | null;
	usedByUserId: string | null;
	expiresAt: number;
	usedAt: number | null;
	createdAt: number;
	creatorEmail?: string | null;
	usedByUserEmail?: string | null;
}

export interface CreateInviteRequest {
	email?: string;
	roleId?: string;
	ttlHours?: number;
}

export interface CreateInviteResponse {
	invite: AdminInvite & {
		token: string;
		inviteUrl: string;
	};
}

export function createInvite(
	data: CreateInviteRequest,
): Promise<CreateInviteResponse> {
	return api<CreateInviteResponse>("/api/admin/invites", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function getInvites(): Promise<{ invites: AdminInvite[] }> {
	return api<{ invites: AdminInvite[] }>("/api/admin/invites");
}

export function revokeInvite(id: string): Promise<{ success: boolean }> {
	return api<{ success: boolean }>(
		`/api/admin/invites/${encodeURIComponent(id)}`,
		{
			method: "DELETE",
		},
	);
}

export interface CreateDirectUserRequest {
	email: string;
	password?: string;
	roleId?: string;
}

export interface CreateDirectUserResponse {
	user: AdminUser;
	temporaryPassword: string | null;
}

export function createDirectUser(
	data: CreateDirectUserRequest,
): Promise<CreateDirectUserResponse> {
	return api<CreateDirectUserResponse>("/api/admin/users", {
		method: "POST",
		body: JSON.stringify(data),
	});
}
