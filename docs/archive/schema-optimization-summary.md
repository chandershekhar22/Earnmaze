# Schema Optimization Summary for Respondent Panel Portal

## Overview
This document summarizes the comprehensive database schema optimization performed for the QSurvey respondent panel portal. The optimization focused on separating concerns, eliminating data duplication, and optimizing for external survey portal integration.

## Key Changes

### 1. Schema Separation
- **Auth Schema**: Handles authentication, users, sessions, accounts, and verification
- **Respondent Schema**: Manages survey-specific respondent data and segmentation
- **Survey Schema**: Caches external survey data and manages respondent interactions
- **Transaction Schema**: Handles payments, rewards, and financial transactions

### 2. Respondent Schema Optimization (`src/lib/db/schema/respondents.ts`)

#### Core Changes:
- **Eliminated Duplicate Fields**: Removed firstName, lastName, email, and other auth-related fields
- **Added userId Reference**: Foreign key to auth.users table for proper relationship
- **Survey-Specific Focus**: Retained only survey panel relevant data

#### Key Tables:
```sql
-- Main respondent table (survey panel specific data)
respondents (
  id, userId, tier, status, qualityScore, completedSurveys,
  totalEarnings, joinedAt, lastActiveAt, preferences, notes
)

-- Statistical tracking for analytics
respondentStats (
  respondentId, totalSurveys, completedSurveys, averageRating,
  totalEarnings, currentMonth*, lastMonth*, lifetime*
)

-- Segmentation for targeting
respondentSegments (
  respondentId, segmentType, segmentValue, confidence, 
  sourceType, isActive, detectedAt, expiresAt
)

-- Survey completion tracking
surveyCompletions (
  respondentId, surveyId, startedAt, completedAt, status,
  timeSpent, responses, rating, feedback, earnings
)
```

#### Benefits:
- **Performance**: Separate stats table for heavy analytical queries
- **Targeting**: Advanced segmentation for survey matching
- **Analytics**: Comprehensive tracking with monthly/lifetime metrics
- **Data Integrity**: Proper foreign key relationships

### 3. Survey Schema Redesign (`src/lib/db/schema/surveys.ts`)

#### Transformation:
- **From**: Survey creation portal (survey authoring focus)
- **To**: Respondent panel portal (survey consumption focus)

#### Key Tables:
```sql
-- Main survey cache table
surveys (
  id, externalId, sourcePortal, title, category, points,
  estimatedMinutes, status, isActive, isPublic,
  availableFrom, availableUntil, maxCompletions,
  panelQuota, autoAssign, priority, targetAudience,
  excludedRespondents, lastSyncAt, syncStatus, externalUrl
)

-- Cached screening questions
surveyQuestions (
  surveyId, questionId, questionType, questionText,
  options, isRequired, orderIndex, targetingLogic
)

-- Respondent invitations and targeting
surveyInvitations (
  surveyId, respondentId, invitationType, status,
  qualificationStatus, sentAt, expiresAt, targetingReason
)

-- Survey logic and screening
surveyLogic (
  surveyId, ruleType, conditions, actions, isActive,
  priority, description
)

-- Segment-based availability
surveyAvailability (
  surveyId, segmentType, segmentValues, maxInvitations,
  currentInvitations, isActive, availableFrom, availableUntil
)
```

#### Benefits:
- **External Integration**: Proper caching of external survey data
- **Sync Capabilities**: Track sync status with external portals
- **Respondent Focus**: Invitation and qualification tracking
- **Targeting**: Advanced segment-based availability

### 4. Utility Functions

#### Respondent Utils (`src/lib/db/respondent-utils.ts`)
- Tier management and progression
- Quality score calculations
- Segmentation analytics
- Performance tracking

#### Survey Utils (`src/lib/db/survey-utils.ts`)
- External portal synchronization
- Respondent qualification checking
- Bulk invitation management
- Survey dashboard analytics

## Performance Optimizations

### Indexing Strategy:
```sql
-- Respondent performance indexes
idx_respondents_user_id (userId)
idx_respondents_tier_status (tier, status)
idx_respondents_quality_active (qualityScore, lastActiveAt)

-- Survey targeting indexes
idx_surveys_status_active (status, isActive, isPublic)
idx_surveys_availability (availableFrom, availableUntil)
idx_surveys_category_points (category, points)

-- Invitation tracking indexes
idx_invitations_respondent_status (respondentId, status)
idx_invitations_survey_qualification (surveyId, qualificationStatus)

-- Segmentation indexes
idx_segments_type_value (segmentType, segmentValue, isActive)
idx_segments_respondent_active (respondentId, isActive)
```

### Query Optimization:
- Separated heavy analytical queries to stats tables
- Composite indexes for common query patterns
- Proper foreign key relationships for joins

## External Portal Integration

### Sync Capabilities:
- **Survey Caching**: Cache external survey metadata locally
- **Status Tracking**: Track sync status and handle errors
- **Qualification Logic**: Cache screening questions and logic
- **Availability Windows**: Manage survey availability by segments

### Integration Points:
```typescript
// Sync survey from external portal
syncSurveyFromExternal(externalSurveyData)

// Check respondent qualification
checkRespondentQualification(surveyId, respondentId)

// Bulk invite qualified respondents
bulkInviteRespondents(surveyId, targetingCriteria)
```

## Data Flow Architecture

### 1. Survey Discovery:
```
External Portal → Sync Service → Local Cache → Respondent Matching
```

### 2. Respondent Targeting:
```
Segmentation → Qualification Check → Invitation Creation → Delivery
```

### 3. Completion Tracking:
```
External Survey → Completion Webhook → Local Tracking → Analytics Update
```

## Migration Path

### Phase 1: Schema Implementation
```bash
npm run db:generate
npm run db:migrate
```

### Phase 2: Data Migration
- Migrate existing respondent data to new structure
- Separate auth data from survey panel data
- Create initial segmentation based on historical data

### Phase 3: External Integration
- Implement sync service for external portals
- Set up webhook handlers for completion tracking
- Configure targeting algorithms

## Security Considerations

### Data Separation:
- Auth data isolated in separate schema
- Survey responses stored externally
- Local cache contains only metadata

### Access Control:
- userId foreign key enforces proper relationships
- Segmentation data protected by respondent access
- External sync requires proper authentication

## Monitoring and Analytics

### Key Metrics:
- Survey sync success rates
- Respondent qualification rates
- Invitation conversion rates
- Quality score distributions
- Segment performance analytics

### Dashboard Components:
- Real-time sync status
- Respondent tier distributions
- Survey availability calendar
- Performance trending

## Future Enhancements

### Planned Improvements:
1. **Machine Learning Integration**: Advanced respondent-survey matching
2. **Real-time Segmentation**: Dynamic segment updates based on behavior
3. **Multi-portal Support**: Support for multiple external survey portals
4. **Advanced Analytics**: Predictive modeling for survey success
5. **A/B Testing**: Invitation timing and messaging optimization

This optimization provides a solid foundation for a scalable, high-performance respondent panel portal with proper separation of concerns and external integration capabilities.
