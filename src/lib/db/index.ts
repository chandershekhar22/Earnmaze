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
	createUser,
	getPanelistIdFromUserId
} from './repositories/auth.repository.server';

// Panelist repository
export {
	updatePanelistTier,
	calculateProfileCompletion,
	updateEngagementMetrics,
	updateQualityMetrics,
	addPanelistTag,
	getPanelistsByTags,
	autoTagPanelist,
	getPanelistDashboard,
	getHighValuePanelists,
	updatePanelistPoints,
	trackPanelistDevice,
	recordPanelistStatusChange,
	getPanelistPoints,
	getPanelistPointsTransactions,
	getPanelistSurveyTransactions,
	getPanelistRecentActivity,
	getAvailableSurveysCount
} from './repositories/panelist.repository.server';

// Survey repository
export {
	syncSurveyFromExternal,
	getAvailableSurveysForPanelist,
	checkPanelistQualification,
	createSurveyInvitation,
	bulkInvitePanelists,
	getSurveyDashboard
} from './repositories/survey.repository.server';

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

// Re-export schema
export * from './schema';
