import 'dotenv/config';
// @ts-expect-error - pg has no declaration file
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL!,
	max: 20,
	min: 2, // Maintain minimum connections to avoid cold starts
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 10_000, // Increased from 5s to 10s for better reliability
	keepAlive: true,
	keepAliveInitialDelayMillis: 10_000,
	application_name: 'em-panel', // Helpful for debugging
	// Opt-in SSL: only when DATABASE_SSL=true (e.g. a managed/external DB).
	// The internal postgres container has SSL disabled, so default to off.
	ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Handle pool errors to prevent unhandled rejection crashes
pool.on('error', (err: Error) => {
	console.error('[db] Pool connection error:', err.message);
});

// Log when connections are acquired/released (only in dev)
if (process.env.NODE_ENV === 'development') {
	pool.on('connect', () => {
		console.log('[db] New pool connection established');
	});
}

export const db = drizzle(pool);

// Barrel exports for database repositories
// Auth repository
export {
	hashPassword,
	verifyPassword,
	generateSessionId,
	createSession,
	validateSession,
	invalidateSession,
	getUserByEmail,
	createUser
} from './repositories/auth.repository.server';

// Panelist Points repository
export {
	resetPanelistPoints,
	addPoints,
	addBonusPoints,
	redeemPoints,
	getPanelistPoints,
	initializePanelistPoints
} from './repositories/panelist-points.repository.server';

// Panelist Points Aggregations repository (derived metrics)
export {
	getLifetimePoints,
	getTotalBonusPoints,
	getTotalRedeemedPoints,
	getTotalRejectedPoints,
	getPointsSummary,
	getPointsSummaryByBucket,
	getRecentTransactions,
	getRecentExplorationTransactions,
} from './repositories/panelist-points-aggregations.repository.server';

// Panelist Transactions repository
export {
	getPanelistSurveyTransactions,
	createSurveyTransaction,
} from './repositories/panelist-transactions.repository.server';

// Panelist Tier repository
export {
	calculateProfileCompletion
} from './repositories/panelist-tier.repository.server';

// Survey repository
export {
	getSurveyDashboard,
	getAllAvailableSurveys,
	getSurveyById
} from './repositories/survey.repository.server';

// Guest session repository
export {
	generateGuestToken,
	createGuestSession,
	createGuestSessionForUser,
	findActiveGuestSessionByEmail,
	validateGuestSession,
	getGuestSessionById,
	invalidateGuestSession,
	linkSurveyTransactionToSession,
	getGuestSessionTransactions,
	updateGuestSessionStats,
	upgradeGuestSession,
	hasRecentGuestSession
} from './repositories/guest-session.repository.server';

// Guest upgrade OTP verification repository
export {
	createGuestUpgradeOtp,
	verifyGuestUpgradeOtp,
	consumeGuestUpgradeToken,
} from './repositories/guest-upgrade-verification.repository.server';

// Analytics repository
export {
	createPageVisit,
	createEmailConversion,
	createCtaClick,
	getTotalVisits,
	getTotalConversions,
	getTotalCtaClicks,
	getUniqueVisitors,
	getConversionRate,
	getAverageTimeToConvert,
	getTrafficSources,
	getRecentConversions,
	getVisitsByDateRange,
	getConversionsByDateRange,
	hasEmailConverted,
	getVisitorJourney
} from './repositories/analytics.repository.server';

// Settings repository
export {
	getAppSetting,
	getAppSettings,
	getAllAppSettings,
	setAppSetting,
	setAppSettings,
	deleteAppSetting,
	getAppSettingAsInt,
	getAppSettingAsBoolean,
	getAppSettingAsJson
} from './repositories/settings.repository.server';

// Support Tickets repository
export {
	createTicket,
	getTicketsByPanelist,
	getTicketById,
	getAllTickets,
	replyToTicket,
	updateTicketStatus
} from './repositories/support-tickets.repository.server';

// Re-export schema
export * from './schema';
