import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Sliders } from "lucide-react";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import SigninKeysCard from "@/components/settings/SigninKeysCard";
import SigninPolicyCard from "@/components/settings/SigninPolicyCard";
import SignupPolicyCard from "@/components/settings/SignupPolicyCard";
import { PermissionGuard, useAuth } from "@/context/AuthContext";
import { getInstanceSettings } from "@/lib/api/settings";
import { INSTANCE_NAME } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";

export const Route = createFileRoute("/_dashboard/admin/settings")({
	staticData: {
		navigation: {
			label: "Settings",
			order: 50,
			requiredPermission: "settings:read",
		},
	},
	component: SettingsPageWrapper,
});

function SettingsPageWrapper() {
	return (
		<PermissionGuard permission="settings:read">
			<SettingsPage />
		</PermissionGuard>
	);
}

function SettingsPage() {
	const { hasPermission } = useAuth();
	const canWriteSettings = hasPermission("settings:write");

	const { data, isLoading, isFetching, refetch } = useQuery({
		queryKey: queryKeys.admin.settings,
		queryFn: getInstanceSettings,
	});

	const settings = data?.settings;

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="Settings & Policies"
				description={
					<>
						Configure tenant registration policies, authentication behavior, and
						access controls for{" "}
						<span className="text-violet-400 font-medium">{INSTANCE_NAME}</span>
						.
					</>
				}
				actions={
					<Button
						type="button"
						variant="secondary"
						size="sm"
						loading={isFetching && !isLoading}
						onClick={() => {
							void refetch();
						}}
						icon={<RefreshCw size={14} />}
					>
						Refresh
					</Button>
				}
			/>

			{!settings ? (
				<EmptyState
					icon={<Sliders size={24} />}
					title="Settings unavailable"
					description="Could not load tenant configuration settings."
				/>
			) : (
				<div className="space-y-6">
					<SignupPolicyCard settings={settings} canEdit={canWriteSettings} />
					<SigninPolicyCard settings={settings} canEdit={canWriteSettings} />
					<SigninKeysCard canEdit={canWriteSettings} />
				</div>
			)}
		</div>
	);
}
