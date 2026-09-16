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
	},
	account: {
		passkeys: ["account", "passkeys"] as const,
		grants: ["account", "grants"] as const,
	},
	oauth: {
		clientDetails: (clientId?: string, redirectUri?: string) =>
			["oauth", "clientDetails", clientId, redirectUri] as const,
		grant: (clientId?: string, scope?: string) =>
			["oauth", "grant", clientId, scope] as const,
	},
};
