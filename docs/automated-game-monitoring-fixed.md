# Automated Game Monitoring System Documentation

This module handles live score updates, API integration, and fallback mechanisms for Square Trivia games.

## Firebase Functions

### `monitorLiveGames`
**Type:** Scheduled Function (runs every 1 minute)
**Description:** Monitors all active games and updates scores from external APIs
**Trigger:** `functions.pubsub.schedule("every 1 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Requires API-Sports API key in environment
- Accesses Firestore collections: `games`, `systemLogs`

### `manualScoreUpdate`
**Type:** Callable Function
**Description:** Allows admin to manually update game scores
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.gameId` (string) - Game document ID
- `data.quarter` (string) - Quarter identifier (q1, q2, q3, q4)
- `data.homeScore` (number) - Home team score
- `data.awayScore` (number) - Away team score
- `data.markAsComplete` (boolean, optional) - Mark game as completed

### `activateUpcomingGames`
**Type:** Scheduled Function (runs every 5 minutes)
**Description:** Auto-activates games at their start time
**Trigger:** `functions.pubsub.schedule("every 5 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Accesses Firestore collections: `games`, `systemLogs`

### `activateNext7DaysGames`
**Type:** Scheduled Function (runs every 5 minutes)
**Description:** Activates games that start within the next 7 days
**Trigger:** `functions.pubsub.schedule("every 5 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Accesses Firestore collections: `games`, `systemLogs`

### `checkStuckGames`
**Type:** Scheduled Function (runs every 30 minutes)
**Description:** Identifies games that have been active too long and sends alerts
**Trigger:** `functions.pubsub.schedule("every 30 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Accesses Firestore collections: `games`, `adminAlerts`

### `monitorApiHealth`
**Type:** Scheduled Function (runs every 15 minutes)
**Description:** Monitors API-Sports service health
**Trigger:** `functions.pubsub.schedule("every 15 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Requires API-Sports API key
- Accesses Firestore collections: `systemHealth`, `adminAlerts`

### `testApiConnection`
**Type:** Callable Function
**Description:** Tests API connection for debugging (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.apiSportsId` (string) - External game ID
- `data.sport` (string) - Sport type (NFL, CFB, etc.)

### `forceMonitorGame`
**Type:** Callable Function
**Description:** Forces monitoring of a specific game (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.gameId` (string) - Game document ID

## Simple Functions

### `monitorSingleGame(db, gameDoc)`
**Description:** Monitors a single game and updates its scores
**Parameters:**
- `db` (Firestore) - Database instance
- `gameDoc` (DocumentSnapshot) - Game document snapshot
**Returns:** Object with success status and game details

### `notifyWinners(db, winners)`
**Description:** Queues notifications for game winners
**Parameters:**
- `db` (Firestore) - Database instance
- `winners` (Array) - Array of winner objects
**Returns:** Promise

### `sendAdminAlert(alert)`
**Description:** Sends alert to administrators
**Parameters:**
- `alert` (Object) - Alert object with type, message, and optional data
**Returns:** Promise

### `validateTelegramUsername(username)`
**Description:** Validates Telegram username format
**Parameters:**
- `username` (string) - Telegram username to validate
**Returns:** Object with validation result and cleaned value

## Classes

### `ApiSportsService`
**Description:** Service class for interacting with API-Sports API

#### Methods:
- `getHeaders(sport)` - Get API headers for specific sport
- `makeRequest(url, headers, retries)` - Make API request with retry logic
- `fetchGameScore(gameId, sport, week)` - Fetch game score from API
- `parseGameData(apiGame, sport)` - Parse API response into standard format
- `getMockGameData(apiSportsId, sport)` - Get mock data for testing
- `checkHealth()` - Check API service health

## Constants Used
- `SPORTS_CONFIG` - Configuration for different sports APIs
- `GAME_CONFIG` - Game-related configuration
- `API_CONFIG` - API configuration and limits
- `ERROR_MESSAGES` - Standardized error messages
- `FEATURE_FLAGS` - Feature toggle flags