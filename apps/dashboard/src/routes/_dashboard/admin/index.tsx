import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/admin/")({
	staticData: {
		navigation: {
			label: "Overview",
			order: 1,
			adminOnly: false,
		},
	},
	component: AdminOverviewPage,
});

function AdminOverviewPage() {
	return (
		<div>
			<h1 className="text-xl font-semibold text-white">Admin</h1>

			<p className="mt-1 text-sm text-zinc-500">
				Manage Muljax ID and its users.
			</p>
		</div>
	);
}
