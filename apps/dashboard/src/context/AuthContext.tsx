import { useNavigate } from "@tanstack/react-router";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import Spinner from "@/components/ui/Spinner";
import { type AuthUser, getCurrentUser, logout as apiLogout } from "@/lib/api";

export interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		try {
			const response = await getCurrentUser();
			setUser(response.user);
		} catch {
			setUser(null);
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiLogout();
		} finally {
			setUser(null);
		}
	}, []);

	useEffect(() => {
		refresh().finally(() => {
			setLoading(false);
		});
	}, [refresh]);

	const value = useMemo(
		() => ({
			user,
			loading,
			refresh,
			logout,
		}),
		[user, loading, refresh, logout],
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
