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
	getNotificationStreamUrl,
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

	const eventSourceRef = useRef<EventSource | null>(null);

	const loadNotifications = useCallback(async () => {
		if (!user) {
			setNotifications([]);
			setUnreadCount(0);
			setLoading(false);
			return;
		}

		try {
			const res = await getNotifications();
			setNotifications(res.notifications);
			setUnreadCount(res.unreadCount);
		} catch (error) {
			console.error("[Notifications] Failed to load:", error);
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		void loadNotifications();
	}, [loadNotifications]);

	// Connect to Server-Sent Events stream for real-time live notifications
	useEffect(() => {
		if (!user) {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
			return;
		}

		let active = true;
		const streamUrl = getNotificationStreamUrl();

		const es = new EventSource(streamUrl, {
			withCredentials: true,
		});

		eventSourceRef.current = es;

		es.addEventListener("notification", (event) => {
			if (!active) return;
			try {
				const notification = JSON.parse(event.data) as Notification;

				setNotifications((prev) => [notification, ...prev]);
				setUnreadCount((prev) => prev + 1);

				// Show real-time notification toast
				if (notification.severity === "danger") {
					toast.error(`${notification.title}: ${notification.message}`);
				} else if (notification.severity === "warning") {
					toast.warning(`${notification.title}: ${notification.message}`);
				} else if (notification.severity === "success") {
					toast.success(`${notification.title}: ${notification.message}`);
				} else {
					toast.info(`${notification.title}: ${notification.message}`);
				}
			} catch (e) {
				console.error(
					"[Notifications] Error parsing SSE notification event:",
					e,
				);
			}
		});

		es.onerror = () => {
			// Browser automatically attempts reconnect for EventSource
		};

		return () => {
			active = false;
			es.close();
			if (eventSourceRef.current === es) {
				eventSourceRef.current = null;
			}
		};
	}, [user, toast]);

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
