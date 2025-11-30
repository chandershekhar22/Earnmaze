/**
 * API Response Type Definitions
 * 
 * This file defines strict types for all API responses to ensure:
 * 1. Type safety across the application
 * 2. Consistent response structures
 * 3. Prevention of sensitive data leakage
 * 4. Clear API contracts between client and server
 */

// Base response types
export interface ApiSuccessResponse<T = unknown> {
	success: true;
	data: T;
	message?: string;
}

export interface ApiErrorResponse {
	success: false;
	error: string;
	message?: string;
	details?: Record<string, unknown>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Auth API Response Types
// ============================================================================

/**
 * User object returned by auth APIs
 * Only includes safe fields (no password, no sensitive data)
 */
export interface AuthUserResponse {
	id: string;
	email: string;
	name: string | null;
	userType: 'admin' | 'panelist' | 'client' | 'moderator';
	createdAt: Date | string;
	emailVerified?: boolean;
	image?: string | null;
}

/**
 * Login API response
 * POST /api/auth/login
 */
export interface LoginResponse {
	user: AuthUserResponse;
}

/**
 * Register API response
 * POST /api/auth/register
 */
export interface RegisterResponse {
	user: AuthUserResponse;
}

/**
 * Get current user response
 * GET /api/auth/me
 */
export interface MeResponse {
	user: AuthUserResponse | null;
}

/**
 * Login error response types
 */
export interface LoginErrorResponse extends ApiErrorResponse {
	error: 'Email and password are required' 
		| 'Invalid email or password' 
		| 'Account is not active'
		| 'Internal server error';
}

/**
 * Register error response types
 */
export interface RegisterErrorResponse extends ApiErrorResponse {
	error: 'Email and password are required'
		| 'User with this email already exists'
		| 'Failed to create user'
		| 'Internal server error';
}

// ============================================================================
// Panelist API Response Types
// ============================================================================

/**
 * Panelist dashboard data
 * GET /api/panelist/dashboard
 */
export interface PanelistDashboardResponse {
	totalPoints: number;
	lifetimeEarnings: number;
	surveysCompleted: number;
	averageRating: number;
	currentTier: string;
	completionRate: number;
	recentActivity: Array<{
		id: string;
		type: 'survey_completed' | 'points_earned' | 'reward_redeemed';
		description: string;
		amount?: number;
		timestamp: Date | string;
	}>;
	availableSurveys: number;
}

/**
 * Panelist points data
 * GET /api/panelist/points
 */
export interface PanelistPointsResponse {
	currentBalance: number;
	lifetimeEarned: number;
	lifetimeRedeemed: number;
	pendingPoints: number;
	tier: string;
	nextTierPoints?: number;
}

/**
 * Points transactions list
 * GET /api/panelist/transactions
 */
export interface PointsTransactionItem {
	id: string;
	type: 'earned' | 'redeemed' | 'bonus' | 'penalty' | 'adjustment';
	amount: number;
	balanceAfter: number;
	description: string;
	referenceType?: 'survey' | 'reward' | 'referral' | 'bonus' | 'manual';
	referenceId?: string;
	createdAt: Date | string;
}

export interface PointsTransactionsResponse {
	transactions: PointsTransactionItem[];
	currentBalance: number;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

/**
 * Survey transactions list
 * GET /api/panelist/survey-transactions
 */
export interface SurveyTransactionItem {
	id: string;
	surveyId: string;
	surveyTitle: string;
	status: 'invited' | 'started' | 'completed' | 'disqualified' | 'expired';
	pointsEarned: number;
	timeSpentMinutes?: number;
	completedAt?: Date | string;
	invitedAt: Date | string;
}

export interface SurveyTransactionsResponse {
	transactions: SurveyTransactionItem[];
	totalCompleted: number;
	totalEarned: number;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// ============================================================================
// Survey API Response Types
// ============================================================================

/**
 * Available survey item
 */
export interface AvailableSurveyItem {
	id: string;
	title: string;
	description: string;
	category: string;
	pointsReward: number;
	estimatedMinutes: number;
	targetResponses: number;
	currentResponses: number;
	expiresAt?: Date | string;
	qualificationCriteria?: Array<{
		field: string;
		operator: string;
		value: unknown;
	}>;
}

/**
 * Available surveys list
 * GET /api/surveys/available
 */
export type AvailableSurveysResponse = AvailableSurveyItem[];

/**
 * Survey detail
 * GET /api/surveys/{id}
 */
export interface SurveyDetailResponse {
	id: string;
	title: string;
	description: string;
	category: string;
	pointsReward: number;
	estimatedMinutes: number;
	instructions?: string;
	questions?: Array<{
		id: string;
		type: 'single_choice' | 'multiple_choice' | 'text' | 'rating' | 'scale';
		text: string;
		required: boolean;
		options?: Array<{
			id: string;
			text: string;
			value: string | number;
		}>;
	}>;
	expiresAt?: Date | string;
	status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
}

// ============================================================================
// Rewards API Response Types
// ============================================================================

/**
 * Reward item
 */
export interface RewardItem {
	id: string;
	title: string;
	description: string;
	pointsCost: number;
	originalPrice?: number;
	category: string;
	emoji?: string;
	imageUrl?: string;
	stock: number | 'unlimited';
	isAvailable: boolean;
	deliveryType: 'digital' | 'physical' | 'virtual';
	estimatedDelivery?: string;
}

/**
 * Available rewards list
 * GET /api/rewards
 */
export type RewardsListResponse = RewardItem[];

/**
 * Reward redemption response
 * POST /api/rewards/redeem
 */
export interface RewardRedemptionResponse {
	redemptionId: string;
	rewardId: string;
	pointsSpent: number;
	newBalance: number;
	status: 'pending' | 'processing' | 'fulfilled';
	estimatedDelivery?: string;
	trackingInfo?: string;
	message: string;
}

/**
 * Redemption history
 * GET /api/rewards/history
 */
export interface RedemptionHistoryItem {
	id: string;
	rewardTitle: string;
	rewardId: string;
	pointsSpent: number;
	status: 'pending' | 'processing' | 'fulfilled' | 'cancelled';
	redeemedAt: Date | string;
	fulfilledAt?: Date | string;
	trackingInfo?: string;
	cancelledReason?: string;
}

export interface RedemptionHistoryResponse {
	redemptions: RedemptionHistoryItem[];
	totalRedeemed: number;
	totalPointsSpent: number;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// ============================================================================
// Analytics API Response Types (Public/Marketing)
// ============================================================================

/**
 * Conversion statistics
 * GET /api/analytics/conversions
 */
export interface ConversionStatsResponse {
	totalVisits: number;
	totalConversions: number;
	conversionRate: number;
	uniqueVisitors: number;
	averageTimeToConvert: number;
	topSources: Array<{
		source: string;
		visits: number;
		conversions: number;
		rate: number;
	}>;
	recentConversions: Array<{
		email: string;
		source?: string;
		timestamp: Date | string;
	}>;
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Standard error codes used across APIs
 */
export type ApiErrorCode = 
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'BAD_REQUEST'
	| 'VALIDATION_ERROR'
	| 'INTERNAL_ERROR'
	| 'RATE_LIMIT_EXCEEDED'
	| 'INSUFFICIENT_POINTS'
	| 'RESOURCE_UNAVAILABLE'
	| 'DUPLICATE_ENTRY'
	| 'SESSION_EXPIRED';

/**
 * Detailed error response with code
 */
export interface DetailedErrorResponse extends ApiErrorResponse {
	code: ApiErrorCode;
	statusCode: number;
	timestamp: string;
	path?: string;
}

// ============================================================================
// Utility Types for API Responses
// ============================================================================

/**
 * Paginated wrapper for list responses
 */
export interface PaginatedApiResponse<T> {
	items: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
	return 'success' in response && response.success === false;
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
	return 'success' in response && response.success === true;
}

/**
 * Extract data type from API response
 */
export type ExtractApiData<T> = T extends ApiSuccessResponse<infer U> ? U : never;

/**
 * Make all response fields safe for JSON serialization
 */
export type JsonSafe<T> = T extends Date
	? string
	: T extends Array<infer U>
	? Array<JsonSafe<U>>
	: T extends object
	? { [K in keyof T]: JsonSafe<T[K]> }
	: T;
