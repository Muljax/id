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
	getNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	type Notification,
} from "@/lib/api";

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

	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);

	const knownNotificationIds = useRef<Set<string>>(new Set());
	const initialLoadDone = useRef(false);
	const lastFetchTime = useRef(0);

	const loadNotifications = useCallback(
		async (isBackground = false) => {
			if (!user) {
				setNotifications([]);
				setUnreadCount(0);
				setLoading(false);
				knownNotificationIds.current.clear();
				initialLoadDone.current = false;
				return;
			}

			if (!isBackground) {
				setLoading(true);
			}

			try {
				const res = await getNotifications();
				lastFetchTime.current = Date.now();

				if (initialLoadDone.current) {
					const newItems = res.notifications.filter(
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

				for (const n of res.notifications) {
					knownNotificationIds.current.add(n.id);
				}

				setNotifications(res.notifications);
				setUnreadCount(res.unreadCount);
				initialLoadDone.current = true;
			} catch (error) {
				console.error("[Notifications] Failed to load:", error);
			} finally {
				if (!isBackground) {
					setLoading(false);
				}
			}
		},
		[user, toast],
	);

	useEffect(() => {
		void loadNotifications(false);
	}, [loadNotifications]);

	useEffect(() => {
		if (!user) return;

		const POLL_INTERVAL = 10000; // 10 seconds

		const interval = setInterval(() => {
			if (
				typeof document !== "undefined" &&
				document.visibilityState === "visible"
			) {
				void loadNotifications(true);
			}
		}, POLL_INTERVAL);

		function handleVisibilityOrFocus() {
			if (
				typeof document !== "undefined" &&
				document.visibilityState === "visible" &&
				Date.now() - lastFetchTime.current > 3000
			) {
				void loadNotifications(true);
			}
		}

		window.addEventListener("focus", handleVisibilityOrFocus);
		document.addEventListener("visibilitychange", handleVisibilityOrFocus);

		return () => {
			clearInterval(interval);
			window.removeEventListener("focus", handleVisibilityOrFocus);
			document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
		};
	}, [user, loadNotifications]);

	const markAsRead = useCallback(async (id: string) => {
		try {
			await markNotificationRead(id);
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, readAt: Date.now() } : n)),
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch (e) {
			console.error("[Notifications] Failed to mark as read:", e);
		}
	}, []);

	const markAllAsRead = useCallback(async () => {
		try {
			await markAllNotificationsRead();
			const now = Date.now();
			setNotifications((prev) =>
				prev.map((n) => (n.readAt ? n : { ...n, readAt: now })),
			);
			setUnreadCount(0);
		} catch (e) {
			console.error("[Notifications] Failed to mark all as read:", e);
		}
	}, []);

	const dismiss = useCallback(async (id: string) => {
		try {
			await deleteNotification(id);
			setNotifications((prev) => {
				const item = prev.find((n) => n.id === id);
				if (item && !item.readAt) {
					setUnreadCount((count) => Math.max(0, count - 1));
				}
				return prev.filter((n) => n.id !== id);
			});
		} catch (e) {
			console.error("[Notifications] Failed to dismiss notification:", e);
		}
	}, []);

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				loading,
				markAsRead,
				markAllAsRead,
				dismiss,
				refresh: loadNotifications,
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
