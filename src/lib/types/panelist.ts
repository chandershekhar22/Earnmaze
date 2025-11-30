export interface PanelistDashboardData {
  panelist: {
    id: string;
    userId: string;
    status: string;
    tier: string;
    referralCode: string | null;
    createdAt: Date;
  } | null;
  points: {
    currentPoints: number;
    lifetimePoints: number;
    pendingPoints: number;
    redeemedPoints: number;
    tierProgress: number;
  } | null;
  engagement: {
    streakDays: number;
    lastActiveAt: Date | null;
    totalSurveys: number;
    completedSurveys: number;
    completionRate: number;
  } | null;
  quality: {
    qualityScore: number;
    qualityFlags: number;
    averageRating: number;
    consistencyScore: number;
  } | null;
  verification: {
    status: string;
    identityVerified: boolean;
    phoneVerified: boolean;
    emailVerified: boolean;
    verifiedAt: Date | null;
  } | null;
  demographics: {
    dateOfBirth: Date | null;
    gender: string | null;
    maritalStatus: string | null;
    ethnicity: string | null;
    hasChildren: boolean;
    householdSize: number | null;
  } | null;
  geography: {
    country: string | null;
    state: string | null;
    city: string | null;
    zipCode: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  professional: {
    education: string | null;
    employment: string | null;
    occupation: string | null;
    industry: string | null;
    income: string | null;
    workExperience: number | null;
  } | null;
  tags: Array<{
    tagName: string;
    tagType: string;
    tagValue: string | null;
    isActive: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: Date;
    category: string;
  }>;
  availableSurveys: number;
}
