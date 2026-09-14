import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/admin/")({
	beforeLoad: () => {
		throw redirect({
			to: "/admin/clients",
			replace: true,
		});
	},
});
