#!/usr/bin/env node
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { appSettings } from '../src/lib/db/schema/settings.js';

const { Pool } = pg;

async function initSettings() {
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL
	});

	const db = drizzle(pool, { logger: false });

	try {
		console.log('Initializing default settings...');

		// Insert default redirect URL setting
		await db
			.insert(appSettings)
			.values({
				key: 'earn_money_redirect_url',
				value: '/register',
				description: 'Redirect URL after email submission on earn-money page. Use {email} as placeholder for the submitted email.',
			})
			.onConflictDoNothing();

		console.log('✓ Default settings initialized successfully');
	} catch (error) {
		console.error('Error initializing settings:', error);
		process.exit(1);
	} finally {
		// @ts-ignore - pool.end() exists at runtime
		await pool.end();
		process.exit(0);
	}
}

initSettings();
