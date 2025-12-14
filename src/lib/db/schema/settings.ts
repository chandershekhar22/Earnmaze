import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Application settings table
 * Stores key-value configuration settings
 */
export const appSettings = pgTable('app_settings', {
	key: varchar('key', { length: 255 }).primaryKey(),
	value: text('value').notNull(),
	description: text('description'),
	updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
