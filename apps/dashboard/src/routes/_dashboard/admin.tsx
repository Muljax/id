import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/admin")({
	staticData: {
		navigation: {
			label: "Admin",
			order: 30,
		},
	},
	component: AdminLayout,
});

function AdminLayout() {
	return <Outlet />;
}
