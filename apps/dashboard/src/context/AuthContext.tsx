import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from "react";

import Spinner from "@/components/ui/Spinner";
import { type AuthUser, getCurrentUser, logout as apiLogout } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	setUser: (user: AuthUser | null) => void;
	refresh: () => Promise<AuthUser | null>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const queryClient = useQueryClient();

	const {
		data: user = null,
		isLoading,
		isFetching,
		refetch,
	} = useQuery<AuthUser | null>({
		queryKey: queryKeys.auth.me,
		queryFn: async () => {
			try {
				const response = await getCurrentUser();
				return response.user;
			} catch {
				return null;
			}
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		retry: false,
	});

	const setUser = useCallback(
		(newUser: AuthUser | null) => {
			queryClient.setQueryData(queryKeys.auth.me, newUser);
		},
		[queryClient],
	);

	const refresh = useCallback(async () => {
		const result = await refetch();
		return result.data ?? null;
	}, [refetch]);

	const logout = useCallback(async () => {
		try {
			await apiLogout();
		} finally {
			queryClient.setQueryData(queryKeys.auth.me, null);
			queryClient.clear();
		}
	}, [queryClient]);

	const value = useMemo(
		() => ({
			user,
			loading: isLoading || (isFetching && !user),
			setUser,
			refresh,
			logout,
		}),
		[user, isLoading, isFetching, setUser, refresh, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}

interface GuardProps {
	children: ReactNode;
}

export function AuthGuard({ children }: GuardProps) {
	const { user, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && !user) {
			navigate({
				to: "/login",
				replace: true,
			});
		}
	}, [loading, user, navigate]);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return <>{children}</>;
}

export function AdminGuard({ children }: GuardProps) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!user?.isAdmin) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
				<div className="rounded-2xl border border-white/8 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
					<h1 className="text-xl font-semibold text-white">Access denied</h1>
					<p className="mt-2 text-sm text-zinc-400">
						You do not have administrative privileges to access this area.
					</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}

export default AuthProvider;
