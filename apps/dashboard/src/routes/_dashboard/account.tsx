import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/account")({
	staticData: {
		navigation: {
			label: "Account",
			order: 20,
		},
	},
	component: AccountLayout,
});

function AccountLayout() {
	return <Outlet />;
}
