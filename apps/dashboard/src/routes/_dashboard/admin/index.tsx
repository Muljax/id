import { createFileRoute, Navigate } from "@tanstack/react-router";

import { PermissionGuard, useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_dashboard/admin/")({
	component: AdminIndexPage,
});

function AdminIndexPage() {
	const { hasPermission } = useAuth();

	if (hasPermission("oauth_clients:read")) {
		return <Navigate to="/admin/clients" replace />;
	}
	if (hasPermission("users:read")) {
		return <Navigate to="/admin/users" replace />;
	}
	if (hasPermission("roles:read")) {
		return <Navigate to="/admin/roles" replace />;
	}

	return (
		<PermissionGuard permission="oauth_clients:read">
			<div />
		</PermissionGuard>
	);
}
