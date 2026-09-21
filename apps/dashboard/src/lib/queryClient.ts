import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minute stale time
			gcTime: 1000 * 60 * 10, // 10 minutes cache garbage collection time
			refetchOnWindowFocus: true,
			retry: 1,
		},
	},
});
