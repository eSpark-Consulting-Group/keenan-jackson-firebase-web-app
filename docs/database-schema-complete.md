# Database Schema Documentation

This module defines all Firestore collections, security rules, and indexes for the Square Trivia system.

## Firebase Functions
*This module contains no Firebase Functions - it's a schema definition module*

## Simple Functions

### `migrateToSkillBasedSystem(db)`
**Description:** Migrates existing data to skill-based system format
**Parameters:**
- `db` (Firestore) - Database instance
**Returns:** Promise

### `initializeSystem(db)`
**Description:** Initializes system with seed data and migrations
**Parameters:**
- `db` (Firestore) - Database instance
**Returns:** Promise

## Database Schemas

### `UserSchema`
**Description:** User collection document structure
**Required Fields:**
- `email` (string) - Validated email address
- `createdAt` (Timestamp) - Account creation time

**Optional Fields:**
- `telegramUsername` (string) - Telegram username with @ prefix
- `phone` (string) - Phone number in +1XXXXXXXXXX format
- `hasTelegram` (boolean) - Whether user has added Telegram
- `totalDonations` (number) - Lifetime donation total
- `currentTiers` (Array) - Active tier IDs
- `payoutMethod` (Object) - Payout preferences
- `triviaCorrect/triviaIncorrect` (number) - Skill-based stats
- `notifications` (Object) - Notification preferences

### `DonationSchema`
**Description:** Donation/payment collection document structure
**Required Fields:**
- `userId` (string) - Firebase Auth UID
- `amount` (number) - Donation amount
- `tierId` (string) - Tier identifier
- `status` (string) - Payment status

**Optional Fields:**
- `stripePaymentIntentId` (string) - Stripe payment ID
- `telegramUsername` (string) - For group access
- `payoutPercentage` (number) - Tier-specific payout rate
- `accessExpiresAt` (Timestamp) - Access expiration

### `GameSchema`
**Description:** Game collection document structure
**Required Fields:**
- `sport` (string) - Sport type
- `apiSportsId` (string) - External API game ID
- `teams` (Object) - Home and away team names
- `status` (string) - Game status

**Optional Fields:**
- `gameType` (string) - regular/playoff/championship
- `startTime` (Timestamp) - Scheduled start time
- `scores` (Object) - Quarter-by-quarter scores
- `processedQuarters` (Object) - Processing status per quarter

### `BoardSchema`
**Description:** Game board collection document structure (Skill-based)
**Required Fields:**
- `gameId` (string) - Reference to game
- `tierId` (string) - Tier identifier
- `squares` (Object) - Square position mapping

**Skill-based Fields:**
- `maxPlayersPerSquare` (number) - Always 2 for skill-based
- `consolationSquaresAwarded` (number) - Track consolation prizes
- `gameInfo` (Object) - Cached game information

### `SquareClaimSchema`
**Description:** Square claims collection document structure (Skill-based)
**Required Fields:**
- `userId` (string) - Claiming user
- `boardId` (string) - Board reference
- `position` (number) - Square position 0-49

**Skill-based Fields:**
- `triviaAnswerTimeMs` (number) - Answer time in milliseconds
- `triviaAnswerTimeSeconds` (number) - Answer time in seconds
- `isConsolationSquare` (boolean) - Earned via consolation
- `canEarnConsolation` (boolean) - Eligible for consolation if loses

### `TriviaSessionSchema`
**Description:** Trivia session tracking (Skill-based)
**Required Fields:**
- `sessionId` (string) - Unique session identifier
- `userId` (string) - Player's user ID
- `questionId` (string) - Trivia question ID

**Timing Fields:**
- `questionDisplayedAt` (Timestamp) - When question shown
- `answerSubmittedAt` (Timestamp) - When answer submitted
- `answerTimeMs` (number) - Calculated answer time
- `answered` (boolean) - Whether user answered
- `isCorrect` (boolean) - Answer correctness

### `WinnerSchema`
**Description:** Winners collection document structure (Skill-based)
**Required Fields:**
- `userId` (string) - Winner's user ID
- `gameId` (string) - Game reference
- `position` (number) - Winning square position
- `quarter` (string) - Winning quarter
- `prizeAmount` (number) - Prize amount

**Skill-based Fields:**
- `winnerAnswerTimeMs` (number) - Winner's answer time
- `loserAnswerTimeMs` (number) - Loser's answer time (if applicable)
- `consolationSquareGranted` (boolean) - Whether consolation given
- `status` (string) - Payout status

### `TriviaSchema`
**Description:** Trivia questions collection
**Required Fields:**
- `question` (string) - Question text
- `answers` (Array) - 4 answer options
- `correctAnswerIndex` (number) - Correct answer (0-3)
- `sport` (string) - Sport category

**Optional Fields:**
- `category` (string) - Question category
- `difficulty` (string) - easy/medium/hard
- `timesUsed` (number) - Usage tracking
- `successRate` (number) - Success percentage

### `AccessTokenSchema`
**Description:** Access tokens for square claiming (Skill-based)
**Required Fields:**
- `userId` (string) - Token owner
- `tierId` (string) - Tier the token is for

**Skill-based Fields:**
- `isConsolationToken` (boolean) - Consolation prize token
- `answerTimeMs` (number) - Answer time from trivia
- `canEarnConsolation` (boolean) - Consolation eligibility
- `expiresAt` (Timestamp) - Token expiration

## Security Rules

### Firestore Rules
**Description:** Complete security rules for all collections
**Key Rules:**
- Users can only read/write their own data
- Games and boards are publicly readable
- Winners collection is publicly readable
- Admin-only collections require admin token
- Trivia questions require authentication to read

## Indexes

### Firestore Indexes
**Description:** Optimized indexes for common queries
**Key Indexes:**
- User queries by tier and creation date
- Donation queries by user, status, and date
- Game queries by status and start time
- Board queries by game and tier
- Winner queries by user, status, and date
- Skill-based trivia session queries

## Migration Functions

### `migrateToSkillBasedSystem(db)`
**Description:** Migrates existing data to skill-based format
**Updates:**
- Board square structure to support multiple claims
- Claim records with timing data
- Winner records with speed competition fields
- Token records with consolation tracking

## Seed Data

### `seedTriviaQuestions`
**Description:** Initial trivia questions for system setup
**Categories:**
- NFL questions (history, records, current)
- NBA questions (records, history)
- Expandable for other sports

### `initializeSystem(db)`
**Description:** Complete system initialization
**Actions:**
- Runs skill-based migration
- Seeds trivia questions if empty
- Sets up initial system state

## Constants Used
- All schema definitions serve as templates
- No external dependencies for schemas