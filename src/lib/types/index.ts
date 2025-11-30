// Comprehensive type definitions for the EarnMaze survey panel

// Re-export existing types
export * from './auth';
export * from './panelist';
export * from './survey';
export * from './api-responses';

// Database schema types
export type { user, session } from '../db/schema/auth';
export type { survey, surveyInvitation, surveyQuestion, surveyTransaction } from '../db/schema/surveys';
export type { panelist, panelistDemographics, panelistGeography, panelistProfessional } from '../db/schema/panelists';
export type { pointsTransactions } from '../db/schema/transactions';

// API Request/Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Survey Types
export interface SurveyFilters {
  category?: string;
  minPoints?: number;
  maxPoints?: number;
  estimatedMinutes?: number;
  status?: 'available' | 'completed' | 'expired';
}

export interface SurveyInvitationData {
  surveyId: string;
  panelistId: string;
  invitationType: 'targeted' | 'bulk' | 'manual';
  targetingReason?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface SurveyCompletionData {
  surveyId: string;
  panelistId: string;
  timeSpentSeconds: number;
  qualityRating?: number;
  bonusPoints?: number;
  responses: SurveyResponseData[];
}

export interface SurveyResponseData {
  questionId: string;
  answer: string | number | boolean | string[];
  metadata?: Record<string, unknown>;
}

// Points and Rewards Types
export interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'penalty';
  amount: number;
  balance: number;
  description: string;
  referenceId?: string;
  referenceType?: 'survey' | 'reward' | 'referral' | 'bonus';
  createdAt: Date;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  stock?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  panelistId: string;
  pointsSpent: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  fulfilledAt?: Date;
  trackingNumber?: string;
  createdAt: Date;
}

// Panelist Profile Types
export interface PanelistProfileUpdate {
  name?: string;
  demographics?: {
    age?: string;
    gender?: string;
    education?: string;
    employment?: string;
    income?: string;
  };
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    surveyCategories?: string[];
  };
}

export interface PanelistDeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  operatingSystem: string;
  browser: string;
  screenResolution?: string;
  userAgent?: string;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

export interface ProfileValidationData {
  name?: string;
  email?: string;
  demographics?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}

// Utility Types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

// Form Types
export interface FormField<T = unknown> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';
  value: T;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: T) => string | null;
  };
  error?: string;
}

// Component Props Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  retry?: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPages?: number;
}

// Event Types
export interface SurveyEvent {
  type: 'started' | 'completed' | 'abandoned' | 'timeout';
  surveyId: string;
  panelistId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface UserActionEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ApiError extends AppError {
  statusCode: number;
  endpoint: string;
}

// Configuration Types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    surveys: boolean;
    rewards: boolean;
    referrals: boolean;
    notifications: boolean;
  };
  limits: {
    maxSurveysPerDay: number;
    maxRedemptionsPerMonth: number;
    sessionTimeout: number;
  };
}

// Environment Types
export interface Environment {
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  version: string;
  buildTime: string;
}