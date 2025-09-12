# User Data & Monetization System Documentation

This module handles user data collection, segmentation, and monetization opportunities for Square Trivia.

## Firebase Functions

### `trackUserEvent`
**Type:** Callable Function
**Description:** Tracks user actions and updates profile data
**Requirements:**
- `context.auth` - User authentication required
- `data.eventType` (string) - Type of event being tracked
- `data.eventData` (Object) - Event-specific data

### `addTelegramToAccount`
**Type:** Callable Function
**Description:** Adds Telegram username to user account and grants tier access
**Requirements:**
- `context.auth` - User authentication required
- `data.userId` (string) - User document ID (must match authenticated user)
- `data.telegramUsername` (string) - Telegram username to add

### `telegramWebhook`
**Type:** HTTP Function
**Description:** Handles Telegram bot webhook for user interactions
**Requirements:**
- `req.body.message` - Telegram message object
- Processes commands: /start, /games, /wins, /status, /squares, /refer, /help, /payout

### `sendTriviaAttemptNotifications`
**Type:** Scheduled Function (runs every 3 hours)
**Description:** Sends trivia attempt reminders to users with Telegram
**Trigger:** `functions.pubsub.schedule("every 3 hours")`
**Requirements:**
- No parameters (scheduled function)
- Sends to users with telegramChatId and telegram notifications enabled

### `sendGameReminders`
**Type:** Scheduled Function (runs every 3 hours)
**Description:** Sends game start reminders for today and tomorrow's games
**Trigger:** `functions.pubsub.schedule("every 3 hours")`
**Requirements:**
- No parameters (scheduled function)
- Sends to all users with Telegram notifications enabled

### `sendPayoutMessages`
**Type:** Scheduled Function (runs every 5 minutes)
**Description:** Sends payout completion messages to winners
**Trigger:** `functions.pubsub.schedule("every 5 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Processes winners with completed status and unsent Telegram messages

### `checkCancelledGames`
**Type:** Scheduled Function (runs every 5 minutes)
**Description:** Checks for cancelled games and processes refunds
**Trigger:** `functions.pubsub.schedule("every 5 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Checks API for game cancellations and refunds tiers

### `setAdminClaim`
**Type:** Callable Function
**Description:** Sets admin claim for a user (temporary function for first admin)
**Requirements:**
- `data.uid` (string) - User UID to make admin
- ⚠️ Should be removed after first admin is created

### `sendTelegramMessage`
**Type:** HTTP Function
**Description:** Sends Telegram invite messages for tier access
**Requirements:**
- `req.body.telegramUsername` (string) - Telegram username
- `req.body.tier` (string) - Tier ID for group access

### `runTargetedCampaign`
**Type:** Callable Function
**Description:** Runs targeted marketing campaigns (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.campaignType` (string) - Campaign type
- `data.filters` (Object) - User targeting filters
- `data.message` (string) - Campaign message template

### `getBusinessAnalytics`
**Type:** Callable Function
**Description:** Gets comprehensive business analytics (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- Returns user metrics, revenue metrics, engagement metrics, monetization metrics

### `exportAnonymizedData`
**Type:** Callable Function
**Description:** Exports anonymized data for analysis (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.dataType` (string) - Type of data: 'market_research', 'behavioral_insights', 'revenue_analysis'

### `trackReferral`
**Type:** Callable Function
**Description:** Tracks referral relationships and credits
**Requirements:**
- `context.auth` - User authentication required
- `data.referralCode` (string) - Referral code used

### `generatePartnerDataFeed`
**Type:** Callable Function
**Description:** Generates data feed for partners (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.partner` (string) - Partner name (draftkings, fanduel, youtubetv, fanatics)
- `data.dataScope` (string) - Scope of data to share

### `savePayoutDetails`
**Type:** Callable Function
**Description:** Saves user payout method details
**Requirements:**
- `context.auth` - User authentication required
- `data.method` (string) - Payout method type
- Additional method-specific details in data object

## Simple Functions

### `updateUserProfile(userId, eventType, eventData)`
**Description:** Updates user profile based on tracked events
**Parameters:**
- `userId` (string) - User document ID
- `eventType` (string) - Type of event
- `eventData` (Object) - Event data
**Returns:** Promise

### `updateUserSegments(userId)`
**Description:** Updates user segmentation based on behavior and spending
**Parameters:**
- `userId` (string) - User document ID
**Returns:** Promise

### `checkMonetizationOpportunities(userId, segments)`
**Description:** Identifies monetization opportunities for user
**Parameters:**
- `userId` (string) - User document ID
- `segments` (Array) - User segments
**Returns:** Promise

### `personalizeMessage(template, user)`
**Description:** Personalizes message template with user data
**Parameters:**
- `template` (string) - Message template with placeholders
- `user` (Object) - User data object
**Returns:** Personalized message string

### `getUserMetrics()`
**Description:** Gets comprehensive user metrics for analytics
**Parameters:** None
**Returns:** Promise resolving to user metrics object

### `getRevenueMetrics()`
**Description:** Gets revenue metrics for analytics
**Parameters:** None
**Returns:** Promise resolving to revenue metrics object

### `getEngagementMetrics()`
**Description:** Gets user engagement metrics
**Parameters:** None
**Returns:** Promise resolving to engagement metrics object

### `getMonetizationMetrics()`
**Description:** Gets monetization performance metrics
**Parameters:** None
**Returns:** Promise resolving to monetization metrics object

### `calculateAvgLTV()`
**Description:** Calculates average lifetime value of users
**Parameters:** None
**Returns:** Promise resolving to average LTV number

### `exportMarketResearchData()`
**Description:** Exports anonymized market research data
**Parameters:** None
**Returns:** Promise resolving to market insights object

### `exportBehavioralData()`
**Description:** Exports behavioral insights data
**Parameters:** None
**Returns:** Promise resolving to behavioral data object

### `exportRevenueData()`
**Description:** Exports revenue analysis data
**Parameters:** None
**Returns:** Promise resolving to revenue data object

### `generateDataFeed(partner, scope)`
**Description:** Generates anonymized data feed for partners
**Parameters:**
- `partner` (string) - Partner identifier
- `scope` (string) - Data scope
**Returns:** Promise resolving to data feed array

### `calculateValueScore(user)`
**Description:** Calculates value score for user based on engagement and spending
**Parameters:**
- `user` (Object) - User data object
**Returns:** Numeric value score

## Telegram Command Handlers

### `handleGameCommand(chatId)`
**Description:** Handles /games command - shows available games
**Parameters:**
- `chatId` (string) - Telegram chat ID
**Returns:** Promise

### `handleWinCommand(chatId)`
**Description:** Handles /wins command - shows user's wins
**Parameters:**
- `chatId` (string) - Telegram chat ID
**Returns:** Promise

### `handleStatusCommand(chatId)`
**Description:** Handles /status command - shows user's tier status
**Parameters:**
- `chatId` (string) - Telegram chat ID
**Returns:** Promise

### `handleSquaresCommand(chatId)`
**Description:** Handles /squares command - shows user's claimed squares
**Parameters:**
- `chatId` (string) - Telegram chat ID
**Returns:** Promise

### `handleReferCommand(chatId)`
**Description:** Handles /refer command - shows user's referral code
**Parameters:**
- `chatId` (string) - Telegram chat ID
**Returns:** Promise

### `handleHelpCommand(chatId)`
**Description:** Handles /help command - shows support information
**Parameters:**
- `chatId` (string) - Telegram chat ID
**Returns:** Promise

### `handlePayoutCommand(chatId)`
**Description:** Handles /payout command - shows payout information
**Parameters:**
- `chatId` (string) - Telegram chat ID
**Returns:** Promise

## Helper Functions

### `sendTelegramNotification(chatId, message)`
**Description:** Sends Telegram message to user
**Parameters:**
- `chatId` (string) - Telegram chat ID
- `message` (string) - Message to send
**Returns:** Promise

### `handleGrantTelegramAccess(userId, telegramUsername, tier)`
**Description:** Internal helper to safely grant Telegram access
**Parameters:**
- `userId` (string) - User document ID
- `telegramUsername` (string) - Telegram username
- `tier` (string) - Tier ID
**Returns:** Promise with success/failure result

## Constants Used
- `TIER_CONFIG` - Tier configuration with Telegram group IDs
- `API_SPORTS_CONFIG` - Sports API configuration
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `GAME_CONFIG` - Game configuration constants
- User segmentation rules and thresholds
- Partner configuration for data sharing
- Email templates and notification settings