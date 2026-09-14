import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const notifications = sqliteTable("notifications", {
	id: text("id").primaryKey(),

	target: text("target").notNull().default("user"),

	userId: text("user_id").references(() => users.id, {
		onDelete: "cascade",
	}),

	type: text("type").notNull(),

	category: text("category").notNull().default("general"),

	severity: text("severity").notNull().default("info"),

	title: text("title").notNull(),

	message: text("message").notNull(),

	actionUrl: text("action_url"),

	data: text("data"),

	readAt: integer("read_at"),

	createdAt: integer("created_at").notNull(),
});
