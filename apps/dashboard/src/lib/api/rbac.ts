import { api } from "./client";

export interface Role {
	id: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	createdAt: number;
	updatedAt: number;
	permissions: string[];
}

export interface Permission {
	id: string;
	name: string;
	description: string | null;
	resource: string;
	isSystem: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface UserRoleItem {
	roleId: string;
	roleName: string;
	description: string | null;
	isSystem: boolean;
	assignedAt: number;
	assignedBy: string | null;
}

export interface RolesResponse {
	roles: Role[];
}

export interface PermissionsResponse {
	permissions: Permission[];
	categories: Record<string, Permission[]>;
}

export interface UserRolesResponse {
	userId: string;
	email: string;
	roles: UserRoleItem[];
}

export interface UserPermissionsResponse {
	userId: string;
	email: string;
	roles: string[];
	permissions: string[];
}

export function getRoles(): Promise<RolesResponse> {
	return api<RolesResponse>("/api/admin/roles");
}

export function getRole(roleId: string): Promise<{ role: Role }> {
	return api<{ role: Role }>(`/api/admin/roles/${encodeURIComponent(roleId)}`);
}

export function createRole(input: {
	name: string;
	description?: string;
	permissions?: string[];
}): Promise<{ role: Role }> {
	return api<{ role: Role }>("/api/admin/roles", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function updateRole(
	roleId: string,
	input: {
		name?: string;
		description?: string;
		permissions?: string[];
	},
): Promise<{ role: Role }> {
	return api<{ role: Role }>(`/api/admin/roles/${encodeURIComponent(roleId)}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteRole(roleId: string): Promise<void> {
	return api<void>(`/api/admin/roles/${encodeURIComponent(roleId)}`, {
		method: "DELETE",
	});
}

export function getPermissions(): Promise<PermissionsResponse> {
	return api<PermissionsResponse>("/api/admin/permissions");
}

export function getUserRoles(userId: string): Promise<UserRolesResponse> {
	return api<UserRolesResponse>(
		`/api/admin/users/${encodeURIComponent(userId)}/roles`,
	);
}

export function setUserRoles(
	userId: string,
	roleIds: string[],
): Promise<UserRolesResponse> {
	return api<UserRolesResponse>(
		`/api/admin/users/${encodeURIComponent(userId)}/roles`,
		{
			method: "PUT",
			body: JSON.stringify({ roleIds }),
		},
	);
}

export function assignUserRole(
	userId: string,
	roleId: string,
): Promise<UserRolesResponse> {
	return api<UserRolesResponse>(
		`/api/admin/users/${encodeURIComponent(userId)}/roles`,
		{
			method: "POST",
			body: JSON.stringify({ roleId }),
		},
	);
}

export function revokeUserRole(userId: string, roleId: string): Promise<void> {
	return api<void>(
		`/api/admin/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
		{
			method: "DELETE",
		},
	);
}

export function getUserPermissions(
	userId: string,
): Promise<UserPermissionsResponse> {
	return api<UserPermissionsResponse>(
		`/api/admin/users/${encodeURIComponent(userId)}/permissions`,
	);
}
