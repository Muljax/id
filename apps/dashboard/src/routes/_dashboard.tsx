import { createFileRoute } from "@tanstack/react-router";

import DashboardLayout from "@/components/Navigation";
import { AuthGuard } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export const Route = createFileRoute("/_dashboard")({
	component: ProtectedDashboard,
});

function ProtectedDashboard() {
	return (
		<AuthGuard>
			<NotificationProvider>
				<DashboardLayout />
			</NotificationProvider>
		</AuthGuard>
	);
}
