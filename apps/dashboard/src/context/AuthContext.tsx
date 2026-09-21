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
import { checkPermission } from "@/lib/permissions";
import { queryKeys } from "@/lib/queryKeys";

export interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	setUser: (user: AuthUser | null) => void;
	refresh: () => Promise<AuthUser | null>;
	logout: () => Promise<void>;
	hasPermission: (permission: string) => boolean;
	hasAnyPermission: (permissions: string[]) => boolean;
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

	const permissionsSet = useMemo(
		() => (user?.permissions ? new Set(user.permissions) : null),
		[user?.permissions],
	);

	const hasPermissionFn = useCallback(
		(permission: string) => {
			if (!user) return false;
			return checkPermission(permissionsSet ?? user.permissions, permission);
		},
		[user, permissionsSet],
	);

	const hasAnyPermissionFn = useCallback(
		(perms: string[]) => perms.some((p) => hasPermissionFn(p)),
		[hasPermissionFn],
	);

	const value = useMemo(
		() => ({
			user,
			loading: isLoading || (isFetching && !user),
			setUser,
			refresh,
			logout,
			hasPermission: hasPermissionFn,
			hasAnyPermission: hasAnyPermissionFn,
		}),
		[
			user,
			isLoading,
			isFetching,
			setUser,
			refresh,
			logout,
			hasPermissionFn,
			hasAnyPermissionFn,
		],
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

export function PermissionGuard({
	permission,
	children,
}: {
	permission: string;
	children: ReactNode;
}) {
	const { loading, hasPermission } = useAuth();

	if (loading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!hasPermission(permission)) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center px-4">
				<div className="rounded-2xl border border-white/8 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
					<h1 className="text-xl font-semibold text-white">Access denied</h1>
					<p className="mt-2 text-sm text-zinc-400">
						You do not have the required permission (
						<code className="text-violet-400 font-mono">{permission}</code>) to
						access this section.
					</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}

export default AuthProvider;
