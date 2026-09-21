import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Issued OpenSSH user certificates tracked for auditing, expiration, and KRL (Key Revocation List) distribution.
 */
export const sshCertificates = sqliteTable(
	"ssh_certificates",
	{
		/**
		 * Unique record identifier for the issued SSH certificate.
		 */
		id: text("id").primaryKey(),

		/**
		 * User account to whom the certificate was issued.
		 */
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		/**
		 * Monotonically increasing 64-bit certificate serial number string.
		 */
		serial: text("serial").notNull(),

		/**
		 * OpenSSH certificate Key ID identifier (typically user email or identity string).
		 */
		keyId: text("key_id").notNull(),

		/**
		 * Comma-separated list of authorized Unix login principals (e.g. 'root,ubuntu,dev').
		 */
		principals: text("principals").notNull(),

		/**
		 * Unix timestamp (seconds) after which the certificate is valid.
		 */
		validAfter: integer("valid_after").notNull(),

		/**
		 * Unix timestamp (seconds) before which the certificate is valid (expiration).
		 */
		validBefore: integer("valid_before").notNull(),

		/**
		 * SHA-256 fingerprint of the user's signed public key.
		 */
		fingerprint: text("fingerprint").notNull(),

		/**
		 * SHA-256 fingerprint of the OpenSSH Certificate Authority key that signed the certificate.
		 */
		caFingerprint: text("ca_fingerprint").notNull(),

		/**
		 * IP address of the client requesting certificate issuance.
		 */
		clientIp: text("client_ip"),

		/**
		 * Client user agent or CLI version initiating the request.
		 */
		userAgent: text("user_agent"),

		/**
		 * Timestamp when the certificate was manually revoked, or null if valid.
		 */
		revokedAt: integer("revoked_at"),

		/**
		 * Identifier of the administrator or automated system that revoked the certificate.
		 */
		revokedBy: text("revoked_by"),

		/**
		 * Administrative reason provided for certificate revocation.
		 */
		revokedReason: text("revoked_reason"),

		/**
		 * Timestamp when the certificate record was stored.
		 */
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("ssh_certificates_user_idx").on(table.userId),
		index("ssh_certificates_serial_idx").on(table.serial),
		index("ssh_certificates_fingerprint_idx").on(table.fingerprint),
	],
);

/**
 * Public SSH keys uploaded by users for certificate issuance or direct server authentication.
 */
export const userSshKeys = sqliteTable(
	"user_ssh_keys",
	{
		/**
		 * Unique identifier for the SSH key record.
		 */
		id: text("id").primaryKey(),

		/**
		 * User account that owns this SSH public key.
		 */
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		/**
		 * Human-readable name or label (e.g. 'Work Laptop Ed25519').
		 */
		name: text("name").notNull(),

		/**
		 * Raw OpenSSH authorized_keys formatted public key string.
		 */
		publicKey: text("public_key").notNull(),

		/**
		 * SHA-256 fingerprint of the public key (e.g. 'SHA256:...').
		 */
		fingerprint: text("fingerprint").notNull(),

		/**
		 * Epoch timestamp (ms) when the key was registered.
		 */
		createdAt: integer("created_at").notNull(),

		/**
		 * Epoch timestamp (ms) when this key was last presented for certificate signing.
		 */
		lastUsedAt: integer("last_used_at"),
	},
	(table) => [
		index("user_ssh_keys_user_idx").on(table.userId),
		index("user_ssh_keys_fingerprint_idx").on(table.fingerprint),
	],
);

export type SshCertificate = typeof sshCertificates.$inferSelect;
export type NewSshCertificate = typeof sshCertificates.$inferInsert;
export type UserSshKey = typeof userSshKeys.$inferSelect;
export type NewUserSshKey = typeof userSshKeys.$inferInsert;
