import type {
	Permission,
	PermissionsResponse,
	Role,
	RoleResponse,
	RolesResponse,
	UserPermissionsResponse,
	UserRoleItem,
	UserRolesResponse,
} from "@muljax/id-api";
import { api } from "./client";

export type {
	Permission,
	PermissionsResponse,
	Role,
	RoleResponse,
	RolesResponse,
	UserPermissionsResponse,
	UserRoleItem,
	UserRolesResponse,
};

export function getRoles(): Promise<RolesResponse> {
	return api<RolesResponse>("/api/admin/roles");
}

export function getRole(roleId: string): Promise<RoleResponse> {
	return api<RoleResponse>(`/api/admin/roles/${roleId}`);
}

export function createRole(input: {
	name: string;
	description?: string;
	permissions?: string[];
}): Promise<RoleResponse> {
	return api<RoleResponse>("/api/admin/roles", {
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
): Promise<RoleResponse> {
	return api<RoleResponse>(`/api/admin/roles/${roleId}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteRole(roleId: string): Promise<void> {
	return api<void>(`/api/admin/roles/${roleId}`, {
		method: "DELETE",
	});
}

export function getPermissions(): Promise<PermissionsResponse> {
	return api<PermissionsResponse>("/api/admin/permissions");
}

export function getUserRoles(userId: string): Promise<UserRolesResponse> {
	return api<UserRolesResponse>(`/api/admin/users/${userId}/roles`);
}

export function setUserRoles(
	userId: string,
	roleIds: string[],
): Promise<UserRolesResponse> {
	return api<UserRolesResponse>(`/api/admin/users/${userId}/roles`, {
		method: "PUT",
		body: JSON.stringify({ roleIds }),
	});
}

export function assignUserRole(
	userId: string,
	roleId: string,
): Promise<UserRolesResponse> {
	return api<UserRolesResponse>(`/api/admin/users/${userId}/roles`, {
		method: "POST",
		body: JSON.stringify({ roleId }),
	});
}

export function revokeUserRole(userId: string, roleId: string): Promise<void> {
	return api<void>(`/api/admin/users/${userId}/roles/${roleId}`, {
		method: "DELETE",
	});
}

export function getUserPermissions(
	userId: string,
): Promise<UserPermissionsResponse> {
	return api<UserPermissionsResponse>(`/api/admin/users/${userId}/permissions`);
}
