import { pgTable, uuid, varchar, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

/**
 * Landing page visits tracking
 */
export const pageVisits = pgTable('page_visits', {
	id: uuid('id').defaultRandom().primaryKey(),
	sessionId: varchar('session_id', { length: 255 }).notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(), // Persistent user identifier
	fingerprint: varchar('fingerprint', { length: 255 }), // Browser fingerprint hash
	
	// Traffic Source Data
	utmSource: varchar('utm_source', { length: 255 }),
	utmMedium: varchar('utm_medium', { length: 255 }),
	utmCampaign: varchar('utm_campaign', { length: 255 }),
	utmTerm: varchar('utm_term', { length: 255 }),
	utmContent: varchar('utm_content', { length: 255 }),
	
	referrer: varchar('referrer', { length: 500 }),
	landingPage: varchar('landing_page', { length: 500 }).notNull(),
	
	// Device & Browser Info
	userAgent: varchar('user_agent', { length: 500 }),
	deviceType: varchar('device_type', { length: 50 }), // mobile, tablet, desktop
	browserName: varchar('browser_name', { length: 100 }),
	osName: varchar('os_name', { length: 100 }),
	screenResolution: varchar('screen_resolution', { length: 50 }), // e.g., "1920x1080"
	timezone: varchar('timezone', { length: 100 }), // e.g., "America/New_York"
	language: varchar('language', { length: 50 }), // e.g., "en-US"
	
	// Location Data (from IP)
	ipAddress: varchar('ip_address', { length: 45 }),
	country: varchar('country', { length: 100 }),
	city: varchar('city', { length: 100 }),
	
	// Timestamps
	visitedAt: timestamp('visited_at', { withTimezone: true }).defaultNow().notNull(),
	
	// Additional Data
	metadata: jsonb('metadata'),
});

/**
 * Email conversions tracking
 */
export const emailConversions = pgTable('email_conversions', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: varchar('email', { length: 255 }).notNull(),
	sessionId: varchar('session_id', { length: 255 }).notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(), // Persistent user identifier
	
	// Link to original visit
	visitId: uuid('visit_id').references(() => pageVisits.id),
	
	// Traffic Source (denormalized for easy querying)
	utmSource: varchar('utm_source', { length: 255 }),
	utmMedium: varchar('utm_medium', { length: 255 }),
	utmCampaign: varchar('utm_campaign', { length: 255 }),
	
	// Time to convert (calculated on backend)
	timeToConvertSeconds: integer('time_to_convert_seconds'),
	
	// Conversion Status
	isConverted: boolean('is_converted').default(true).notNull(),
	convertedAt: timestamp('converted_at', { withTimezone: true }).defaultNow().notNull(),
	
	// Additional Data
	metadata: jsonb('metadata'),
});

/**
 * CTA button clicks tracking
 */
export const ctaClicks = pgTable('cta_clicks', {
	id: uuid('id').defaultRandom().primaryKey(),
	sessionId: varchar('session_id', { length: 255 }).notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(), // Persistent user identifier
	visitId: uuid('visit_id').references(() => pageVisits.id),
	
	buttonLocation: varchar('button_location', { length: 100 }).notNull(), // hero, final-cta, etc
	clickedAt: timestamp('clicked_at', { withTimezone: true }).defaultNow().notNull(),
	
	metadata: jsonb('metadata'),
});
