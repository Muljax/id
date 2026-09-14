import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminGuard } from "@/context/AuthContext";

export const Route = createFileRoute("/_dashboard/admin")({
	staticData: {
		navigation: {
			label: "Admin",
			order: 30,
			adminOnly: true,
		},
	},
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<AdminGuard>
			<Outlet />
		</AdminGuard>
	);
}
