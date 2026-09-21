import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";

import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import {
	deleteNotification,
	getNotificationStreamUrl,
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
	const initialLoadTimestamp = useRef(Date.now());
	const currentUserIdRef = useRef<string | null>(null);
	const eventSourceRef = useRef<EventSource | null>(null);
	const [sseConnected, setSseConnected] = useState(false);

	if (user?.id !== currentUserIdRef.current) {
		currentUserIdRef.current = user?.id ?? null;
		knownNotificationIds.current.clear();
		initialLoadDone.current = false;
		initialLoadTimestamp.current = Date.now();
	}

	const {
		data = { notifications: [], unreadCount: 0 },
		isLoading,
		refetch,
	} = useQuery({
		queryKey: queryKeys.notifications.all,
		queryFn: getNotifications,
		enabled: Boolean(user),
		refetchInterval: sseConnected ? 60000 : 10000,
		refetchOnWindowFocus: true,
	});

	const notifications = data.notifications;
	const unreadCount = data.unreadCount;

	const showToastForNotification = useCallback(
		(notification: Notification) => {
			if (
				notification.severity === "error" ||
				(notification.severity as string) === "danger"
			) {
				toast.error(`${notification.title}: ${notification.message}`);
			} else if (notification.severity === "warning") {
				toast.warning(`${notification.title}: ${notification.message}`);
			} else if (notification.severity === "success") {
				toast.success(`${notification.title}: ${notification.message}`);
			} else {
				toast.info(`${notification.title}: ${notification.message}`);
			}
		},
		[toast],
	);

	useEffect(() => {
		if (!user) {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
			setSseConnected(false);
			return;
		}

		const streamUrl = getNotificationStreamUrl();
		let es: EventSource | null = null;

		try {
			es = new EventSource(streamUrl, { withCredentials: true });
			eventSourceRef.current = es;

			es.addEventListener("connected", () => {
				setSseConnected(true);
			});

			es.addEventListener("notification", (event) => {
				try {
					const payload: Notification = JSON.parse(event.data);

					if (!knownNotificationIds.current.has(payload.id)) {
						knownNotificationIds.current.add(payload.id);

						showToastForNotification(payload);

						queryClient.setQueryData<{
							notifications: Notification[];
							unreadCount: number;
						}>(queryKeys.notifications.all, (prev) => {
							if (!prev) {
								return {
									notifications: [payload],
									unreadCount: payload.readAt ? 0 : 1,
								};
							}
							const exists = prev.notifications.some(
								(n) => n.id === payload.id,
							);
							if (exists) return prev;
							return {
								notifications: [payload, ...prev.notifications],
								unreadCount: payload.readAt
									? prev.unreadCount
									: prev.unreadCount + 1,
							};
						});
					}
				} catch (e) {
					console.error(
						"[Notifications] Failed to parse SSE event payload:",
						e,
					);
				}
			});

			es.onerror = () => {
				setSseConnected(false);
			};
		} catch (err) {
			console.error("[Notifications] Failed to initialize EventSource:", err);
			setSseConnected(false);
		}

		return () => {
			if (es) {
				es.close();
			}
			eventSourceRef.current = null;
			setSseConnected(false);
		};
	}, [user, queryClient, showToastForNotification]);

	useEffect(() => {
		if (!user) return;

		if (!initialLoadDone.current && !isLoading) {
			for (const n of notifications) {
				knownNotificationIds.current.add(n.id);
			}
			initialLoadDone.current = true;
			return;
		}

		if (initialLoadDone.current && notifications.length > 0) {
			const newItems = notifications.filter(
				(n) =>
					!knownNotificationIds.current.has(n.id) &&
					!n.readAt &&
					n.createdAt >= initialLoadTimestamp.current,
			);

			for (const notification of newItems) {
				knownNotificationIds.current.add(notification.id);
				showToastForNotification(notification);
			}

			for (const n of notifications) {
				knownNotificationIds.current.add(n.id);
			}
		}
	}, [user, notifications, isLoading, showToastForNotification]);

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
