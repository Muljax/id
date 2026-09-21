import type {
	AdminInvite,
	AuthUser,
	CreateInviteResponse,
} from "@muljax/id-api";
import { api } from "./client";

export type { AdminInvite, CreateInviteResponse };

export interface CreateInviteRequest {
	email?: string;
	roleId?: string;
	ttlHours?: number;
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
	return api<{ success: boolean }>(`/api/admin/invites/${id}`, {
		method: "DELETE",
	});
}

export interface CreateDirectUserRequest {
	email: string;
	password?: string;
	roleId?: string;
}

export type CreateDirectUserResponse = {
	user: AuthUser;
	passwordResetLink?: string | null;
	temporaryPassword?: string | null;
};

export function createDirectUser(
	data: CreateDirectUserRequest,
): Promise<CreateDirectUserResponse> {
	return api<CreateDirectUserResponse>("/api/admin/users", {
		method: "POST",
		body: JSON.stringify(data),
	});
}
