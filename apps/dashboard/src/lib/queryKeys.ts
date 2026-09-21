export const queryKeys = {
	auth: {
		me: ["auth", "me"] as const,
	},
	notifications: {
		all: ["notifications"] as const,
	},
	admin: {
		clients: ["admin", "clients"] as const,
		users: ["admin", "users"] as const,
		roles: ["admin", "roles"] as const,
		role: (id?: string) => ["admin", "roles", id] as const,
		permissions: ["admin", "permissions"] as const,
		userRoles: (userId?: string) =>
			["admin", "users", userId, "roles"] as const,
		userPermissions: (userId?: string) =>
			["admin", "users", userId, "permissions"] as const,
		userSessions: (userId?: string) =>
			["admin", "users", userId, "sessions"] as const,
		settings: ["admin", "settings"] as const,
		invites: ["admin", "invites"] as const,
		signinKeys: ["admin", "signinKeys"] as const,
	},
	account: {
		sessions: ["account", "sessions"] as const,
		passkeys: ["account", "passkeys"] as const,
		grants: ["account", "grants"] as const,
	},
	ssh: {
		principals: ["ssh", "principals"] as const,
		keys: ["ssh", "keys"] as const,
		ca: ["ssh", "ca"] as const,
		certs: (all = false) => ["ssh", "certs", { all }] as const,
	},
	oauth: {
		clientDetails: (clientId?: string, redirectUri?: string) =>
			["oauth", "clientDetails", clientId, redirectUri] as const,
		grant: (clientId?: string, scope?: string) =>
			["oauth", "grant", clientId, scope] as const,
		deviceDetails: (userCode?: string) =>
			["oauth", "deviceDetails", userCode] as const,
	},
};
