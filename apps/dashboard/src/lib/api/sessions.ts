import type { SessionItem, SessionsResponse } from "@muljax/id-api";
import { api } from "./client";

export type Session = SessionItem;
export type { SessionsResponse };

export function getSessions() {
	return api<SessionsResponse>("/api/auth/sessions");
}

export function revokeSession(id: string) {
	return api<{ success: boolean }>(`/api/auth/sessions/${id}/revoke`, {
		method: "POST",
	});
}

export function revokeAllOtherSessions() {
	return api<{ success: boolean }>("/api/auth/sessions/revoke-all", {
		method: "POST",
	});
}
