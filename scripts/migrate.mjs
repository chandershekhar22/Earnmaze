// Standalone migration runner — applies pending drizzle migrations.
//
// Uses drizzle-orm's programmatic migrator (a prod dependency) so it runs in the
// production runtime image, which does NOT contain drizzle-kit (a devDependency).
// It only replays the SQL files in ./drizzle and records them in the drizzle
// migrations tracking table, so it is idempotent — pending migrations only.
import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('[migrate] DATABASE_URL is not set');
	process.exit(1);
}

// Mirror src/lib/db/index.ts so we connect exactly like the app does.
const pool = new pg.Pool({
	connectionString,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

try {
	const db = drizzle(pool);
	console.log('[migrate] applying pending migrations from ./drizzle ...');
	await migrate(db, { migrationsFolder: './drizzle' });
	console.log('[migrate] migrations up to date');
} catch (err) {
	console.error('[migrate] migration failed:', err);
	process.exitCode = 1;
} finally {
	await pool.end();
}
