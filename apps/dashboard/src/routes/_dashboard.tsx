import { createFileRoute } from "@tanstack/react-router";

import DashboardLayout from "@/components/Navigation";
import { AuthGuard } from "@/context/AuthContext";

export const Route = createFileRoute("/_dashboard")({
	component: ProtectedDashboard,
});

function ProtectedDashboard() {
	return (
		<AuthGuard>
			<DashboardLayout />
		</AuthGuard>
	);
}
