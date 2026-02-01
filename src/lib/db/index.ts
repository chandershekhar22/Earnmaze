import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
export const db = drizzle(process.env.DATABASE_URL!);

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
	addPendingPoints,
	confirmPendingPoints,
	rejectPendingPoints,
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
	getRecentTransactions,
} from './repositories/panelist-points-aggregations.repository.server';

// Panelist Transactions repository
export {
	getPanelistSurveyTransactions,
	getOrCreateStartedSurveyTransaction,
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

// Re-export schema
export * from './schema';
