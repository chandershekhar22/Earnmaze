# Optimized Respondents Schema Documentation

## Schema Separation Overview

The respondent system has been optimized with clear separation of concerns between authentication and survey-specific data:

### 1. Auth Schema (`auth.ts`)
Handles core user authentication and basic user data:
- **users**: Basic user info (id, name, email, emailVerified, image, registration tracking, login data)
- **sessions**: User sessions with token management
- **accounts**: OAuth and external account connections
- **verification**: Email/phone verification tokens

### 2. Respondents Schema (`respondents.ts`)
Handles survey-specific respondent data and relationships:

#### Main Tables:

##### `respondents` (Core respondent data)
- **Relationship**: Links to `users.id` via `userId` field
- **Purpose**: Survey panel-specific data for users who participate in surveys
- **Key Features**:
  - Points system (points, lifetimePoints, pendingPoints, redeemedPoints)
  - Tier management (bronze, silver, gold, platinum, diamond)
  - Quality scoring and verification status
  - Referral system with unique codes
  - Engagement tracking (streaks, activity)
  - Survey-specific preferences

##### `surveyCompletions` (Survey participation tracking)
- **Purpose**: Track individual survey attempts and completions
- **Key Features**:
  - Status tracking (started, completed, abandoned, disqualified)
  - Device and browser information
  - Geographic and referral data
  - Points awarded and quality ratings

##### `surveyResponses` (Individual question responses)
- **Purpose**: Store answers to individual survey questions
- **Key Features**:
  - Response validation and quality flags
  - Time spent tracking
  - Normalized response values for analytics
  - Skip and validity tracking

##### `respondentProfiles` (Detailed demographic data)
- **Purpose**: Comprehensive demographic and preference data
- **Key Features**:
  - Personal information (age, gender, marital status)
  - Geographic data (country, state, city)
  - Professional information (education, occupation, industry)
  - Financial data (income, household size)
  - Technology preferences and usage patterns
  - Survey-specific preferences and interests
  - Privacy and verification settings

##### `respondentStats` (Performance analytics)
- **Purpose**: Aggregated statistics for performance optimization
- **Key Features**:
  - Survey completion rates and timing
  - Points earning and redemption stats
  - Quality metrics and consistency scores
  - Engagement metrics (streaks, activity)
  - Monthly trend data

##### `respondentSegments` (Targeting and analytics)
- **Purpose**: Dynamic segmentation for survey targeting
- **Key Features**:
  - Demographic, behavioral, and quality segments
  - Confidence scoring for ML-based segments
  - Source tracking (profile, behavior, ML prediction)
  - Expiration management for temporary segments

## Key Optimizations Made

### 1. Eliminated Duplicates
- Removed `email`, `name`, `firstName`, `lastName`, `phone` from respondents (handled by auth.users)
- Removed `loginCount`, `lastLoginAt`, `ipAddress`, `userAgent` (handled by auth.users and sessions)
- Removed `registrationSource`, `utmSource`, `utmMedium`, `utmCampaign` (handled by auth.users)

### 2. Improved Relationships
- Added `userId` foreign key to link respondents with auth.users
- Maintained survey-specific data separation
- Proper referential integrity

### 3. Enhanced Indexing
- Composite indexes for common query patterns
- Performance-optimized indexes for analytics
- Targeting-specific indexes for respondent segmentation

### 4. Data Normalization
- Separated frequently-accessed stats into `respondentStats` table
- Created dedicated `respondentSegments` for targeting efficiency
- Optimized field types and constraints

## Usage Patterns

### Creating a Respondent
1. User registers through auth system (creates `users` record)
2. Survey panel registration creates `respondents` record with `userId` reference
3. Profile completion adds `respondentProfiles` record
4. Stats tracking creates `respondentStats` record

### Survey Participation
1. Survey invitation targets via `respondentSegments`
2. Participation creates `surveyCompletions` record
3. Each answer creates `surveyResponses` record
4. Completion updates `respondentStats` automatically

### Data Queries
- **User Info**: Join `respondents` with `users` via `userId`
- **Profile Data**: Join `respondents` with `respondentProfiles` via `respondentId`
- **Performance**: Access `respondentStats` directly (no joins needed)
- **Targeting**: Filter `respondentSegments` for survey invitations

## Benefits of This Structure

1. **Clear Separation**: Auth vs Survey data concerns
2. **Performance**: Optimized indexes and data normalization
3. **Scalability**: Separate stats table for heavy analytics
4. **Flexibility**: Segmentation system for complex targeting
5. **Data Integrity**: Proper foreign keys and constraints
6. **Analytics**: Pre-calculated stats for dashboard performance
7. **Compliance**: Separate profile data for privacy management

## Migration Considerations

When migrating existing data:
1. Map existing respondent email/name to auth.users
2. Create userId references in respondents table
3. Populate respondentStats from historical data
4. Generate initial segments based on profile data
5. Remove duplicate fields from respondents table
