import type { NotificationPayload } from "./types";

type Listener = (notification: NotificationPayload) => void;

class NotificationBus {
	private listeners: Set<Listener> = new Set();

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	broadcast(notification: NotificationPayload) {
		for (const listener of this.listeners) {
			try {
				listener(notification);
			} catch (e) {
				console.error("[NotificationBus] Error broadcasting event:", e);
			}
		}
	}
}

export const notificationBus = new NotificationBus();
