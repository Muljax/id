import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/")({
	staticData: {
		navigation: {
			label: "Overview",
			order: -100,
		},
	},
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div>
			<h1 className="text-2xl font-semibold">Dashboard</h1>
			<p className="mt-2 text-sm text-zinc-400">Welcome to Muljax ID.</p>
		</div>
	);
}
