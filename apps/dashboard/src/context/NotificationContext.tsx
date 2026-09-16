import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	type ReactNode,
} from "react";

import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import {
	deleteNotification,
	getNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	type Notification,
} from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

interface NotificationContextValue {
	notifications: Notification[];
	unreadCount: number;
	loading: boolean;
	markAsRead: (id: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	dismiss: (id: string) => Promise<void>;
	refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(
	null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const toast = useToast();
	const queryClient = useQueryClient();

	const knownNotificationIds = useRef<Set<string>>(new Set());
	const initialLoadDone = useRef(false);

	const {
		data = { notifications: [], unreadCount: 0 },
		isLoading,
		refetch,
	} = useQuery({
		queryKey: queryKeys.notifications.all,
		queryFn: getNotifications,
		enabled: Boolean(user),
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	const notifications = data.notifications;
	const unreadCount = data.unreadCount;

	useEffect(() => {
		if (!user) {
			knownNotificationIds.current.clear();
			initialLoadDone.current = false;
			return;
		}

		if (initialLoadDone.current && notifications.length > 0) {
			const newItems = notifications.filter(
				(n) => !knownNotificationIds.current.has(n.id) && !n.readAt,
			);

			for (const notification of newItems) {
				if (notification.severity === "danger") {
					toast.error(`${notification.title}: ${notification.message}`);
				} else if (notification.severity === "warning") {
					toast.warning(`${notification.title}: ${notification.message}`);
				} else if (notification.severity === "success") {
					toast.success(`${notification.title}: ${notification.message}`);
				} else {
					toast.info(`${notification.title}: ${notification.message}`);
				}
			}
		}

		for (const n of notifications) {
			knownNotificationIds.current.add(n.id);
		}

		if (notifications.length > 0 || !isLoading) {
			initialLoadDone.current = true;
		}
	}, [user, notifications, isLoading, toast]);

	const markReadMutation = useMutation({
		mutationFn: markNotificationRead,
		onMutate: async (id: string) => {
			await queryClient.cancelQueries({
				queryKey: queryKeys.notifications.all,
			});
			const previous = queryClient.getQueryData<{
				notifications: Notification[];
				unreadCount: number;
			}>(queryKeys.notifications.all);

			if (previous) {
				queryClient.setQueryData(queryKeys.notifications.all, {
					...previous,
					notifications: previous.notifications.map((n) =>
						n.id === id ? { ...n, readAt: Date.now() } : n,
					),
					unreadCount: Math.max(0, previous.unreadCount - 1),
				});
			}

			return { previous };
		},
		onError: (_err, _id, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKeys.notifications.all, context.previous);
			}
		},
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all,
			});
		},
	});

	const markAllReadMutation = useMutation({
		mutationFn: markAllNotificationsRead,
		onMutate: async () => {
			await queryClient.cancelQueries({
				queryKey: queryKeys.notifications.all,
			});
			const previous = queryClient.getQueryData<{
				notifications: Notification[];
				unreadCount: number;
			}>(queryKeys.notifications.all);

			if (previous) {
				const now = Date.now();
				queryClient.setQueryData(queryKeys.notifications.all, {
					...previous,
					notifications: previous.notifications.map((n) =>
						n.readAt ? n : { ...n, readAt: now },
					),
					unreadCount: 0,
				});
			}

			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKeys.notifications.all, context.previous);
			}
		},
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all,
			});
		},
	});

	const dismissMutation = useMutation({
		mutationFn: deleteNotification,
		onMutate: async (id: string) => {
			await queryClient.cancelQueries({
				queryKey: queryKeys.notifications.all,
			});
			const previous = queryClient.getQueryData<{
				notifications: Notification[];
				unreadCount: number;
			}>(queryKeys.notifications.all);

			if (previous) {
				const item = previous.notifications.find((n) => n.id === id);
				queryClient.setQueryData(queryKeys.notifications.all, {
					...previous,
					notifications: previous.notifications.filter((n) => n.id !== id),
					unreadCount:
						item && !item.readAt
							? Math.max(0, previous.unreadCount - 1)
							: previous.unreadCount,
				});
			}

			return { previous };
		},
		onError: (_err, _id, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKeys.notifications.all, context.previous);
			}
		},
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all,
			});
		},
	});

	const markAsRead = useCallback(
		async (id: string) => {
			await markReadMutation.mutateAsync(id);
		},
		[markReadMutation],
	);

	const markAllAsRead = useCallback(async () => {
		await markAllReadMutation.mutateAsync();
	}, [markAllReadMutation]);

	const dismiss = useCallback(
		async (id: string) => {
			await dismissMutation.mutateAsync(id);
		},
		[dismissMutation],
	);

	const refresh = useCallback(async () => {
		await refetch();
	}, [refetch]);

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				loading: isLoading,
				markAsRead,
				markAllAsRead,
				dismiss,
				refresh,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error(
			"useNotifications must be used within a NotificationProvider",
		);
	}
	return context;
}
