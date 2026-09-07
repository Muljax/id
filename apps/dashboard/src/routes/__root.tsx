import {
	createRootRoute,
	type ErrorComponentProps,
	Outlet,
} from "@tanstack/react-router";

import NotFound from "@/components/ui/NotFound";

export const Route = createRootRoute({
	component: RootLayout,
	errorComponent: RootError,
	notFoundComponent: NotFound,
});

function RootLayout() {
	return <Outlet />;
}

function RootError({ error }: ErrorComponentProps) {
	const message =
		error instanceof Error ? error.message : "An unexpected error occurred.";

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
			<div className="max-w-lg text-center">
				<h1 className="text-xl font-semibold text-white">
					Something went wrong
				</h1>

				<p className="mt-2 text-sm text-zinc-400">{message}</p>

				<button
					type="button"
					className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
					onClick={() => window.location.reload()}
				>
					Reload
				</button>
			</div>
		</div>
	);
}
