import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./users";

export const sshCertificates = sqliteTable(
	"ssh_certificates",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		serial: text("serial").notNull(),
		keyId: text("key_id").notNull(),
		principals: text("principals").notNull(),
		validAfter: integer("valid_after").notNull(),
		validBefore: integer("valid_before").notNull(),
		fingerprint: text("fingerprint").notNull(),
		caFingerprint: text("ca_fingerprint").notNull(),
		clientIp: text("client_ip"),
		userAgent: text("user_agent"),
		revokedAt: integer("revoked_at"),
		revokedBy: text("revoked_by"),
		revokedReason: text("revoked_reason"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("ssh_certificates_user_idx").on(table.userId),
		index("ssh_certificates_serial_idx").on(table.serial),
		index("ssh_certificates_fingerprint_idx").on(table.fingerprint),
	],
);

export const userSshKeys = sqliteTable(
	"user_ssh_keys",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		publicKey: text("public_key").notNull(),
		fingerprint: text("fingerprint").notNull(),
		createdAt: integer("created_at").notNull(),
		lastUsedAt: integer("last_used_at"),
	},
	(table) => [
		index("user_ssh_keys_user_idx").on(table.userId),
		index("user_ssh_keys_fingerprint_idx").on(table.fingerprint),
	],
);
