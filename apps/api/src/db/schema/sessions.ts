import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Active web and API user authentication sessions with device and geolocation telemetry.
 */
export const sessions = sqliteTable("sessions", {
	/**
	 * Unique session identifier.
	 */
	id: text("id").primaryKey(),

	/**
	 * User who owns this session.
	 */
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),

	/**
	 * SHA-256 hash of the bearer session cookie or token.
	 */
	tokenHash: text("token_hash").notNull().unique(),

	/**
	 * Client IP address recorded at session creation.
	 */
	ipAddress: text("ip_address"),

	/**
	 * Geolocation ISO 3166-1 alpha-2 country code (e.g. 'US', 'DE').
	 */
	country: text("country"),

	/**
	 * Geolocation city name (e.g. 'San Francisco', 'London').
	 */
	city: text("city"),

	/**
	 * Geolocation region or state code (e.g. 'CA', 'TX').
	 */
	region: text("region"),

	/**
	 * Approximate latitude coordinate from GeoIP lookup.
	 */
	latitude: real("latitude"),

	/**
	 * Approximate longitude coordinate from GeoIP lookup.
	 */
	longitude: real("longitude"),

	/**
	 * Raw User-Agent string from the client HTTP request header.
	 */
	userAgent: text("user_agent"),

	/**
	 * Parsed client browser name and version (e.g. 'Chrome 128').
	 */
	browser: text("browser"),

	/**
	 * Parsed client operating system name and version (e.g. 'macOS 14.5').
	 */
	os: text("os"),

	/**
	 * Epoch timestamp (ms) when this session token expires.
	 */
	expiresAt: integer("expires_at").notNull(),

	/**
	 * Epoch timestamp (ms) when this session was initialized.
	 */
	createdAt: integer("created_at").notNull(),

	/**
	 * Epoch timestamp (ms) when this session was last used to authenticate a request.
	 */
	lastUsedAt: integer("last_used_at"),

	/**
	 * Epoch timestamp (ms) until which this session is elevated for sensitive operations.
	 */
	elevatedUntil: integer("elevated_until"),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
