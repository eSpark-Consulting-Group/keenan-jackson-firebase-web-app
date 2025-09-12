# Backend Game Functions Documentation

This module contains core backend game functions for Square Trivia including game creation, square claiming, winner determination, and payment processing.

## Firebase Functions

### `createGame`
**Type:** Callable Function
**Description:** Creates a new game with associated boards for each tier
**Requirements:**
- `data.teams` (Object) - Home and away team names
- `data.gameDate` (string) - Game date in ISO format
- `data.gameType` (string) - Game type: 'regular', 'playoff', 'championship'
- `data.sport` (string) - Sport type: 'nfl', 'ncaa-football'
- `data.externalGameId` (string) - External API game ID
- `data.enabledTiers` (Array) - Array of tier IDs to enable
- `data.week` (number, optional) - Week number

### `claimSquare`
**Type:** Callable Function
**Description:** Claims a square on a board using a trivia token (skill-based)
**Requirements:**
- `context.auth` - User authentication required
- `data.boardId` (string) - Board document ID
- `data.squarePosition` (number) - Square position (0-49)
- `data.tokenId` (string) - Access token from trivia answer
- `data.answerTime` (number) - Answer time in milliseconds

### `determineWinners`
**Type:** Scheduled Function (runs every 2 minutes)
**Description:** Determines winners for completed quarters based on game scores
**Trigger:** `functions.pubsub.schedule("every 2 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Accesses Firestore collections: `games`, `boards`, `winners`, `users`

### `cleanupClaims`
**Type:** Scheduled Function (runs every 2 minutes)
**Description:** Cleans up old claims and awards fastest player bonuses
**Trigger:** `functions.pubsub.schedule("every 2 minutes")`
**Requirements:**
- No parameters (scheduled function)
- Accesses Firestore collections: `boards`, `games`, `winners`

### `createCheckoutSession`
**Type:** Callable Function
**Description:** Creates Stripe checkout session for tier purchase
**Requirements:**
- `context.auth` - User authentication required
- `data.tierId` (string) - Tier ID to purchase
- `data.gameId` (string, optional) - Associated game ID

### `verifyCheckoutSession`
**Type:** Callable Function
**Description:** Verifies and processes completed Stripe checkout session
**Requirements:**
- `context.auth` - User authentication required
- `data.sessionId` (string) - Stripe session ID

### `handleStripeWebhook`
**Type:** HTTP Function
**Description:** Handles Stripe webhook events
**Requirements:**
- `req.headers["stripe-signature"]` - Stripe signature header
- `process.env.STRIPE_WEBHOOK_SECRET` - Webhook secret

### `processPayout`
**Type:** Callable Function
**Description:** Processes payout for winners (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.winnerId` (string) - Winner document ID
- `data.method` (string) - Payout method: 'instant' or 'batch'

### `validateAnswer`
**Type:** Callable Function
**Description:** Validates trivia answer and generates access token
**Requirements:**
- `context.auth` - User authentication required
- `data.sessionId` (string) - Trivia session ID
- `data.questionId` (string) - Question document ID
- `data.answer` (string) - User's answer
- `data.answerTime` (number) - Time taken to answer

## Simple Functions

### `createBoardForTier(gameId, tierId)`
**Description:** Creates a board for a specific tier and game
**Parameters:**
- `gameId` (string) - Game document ID
- `tierId` (string) - Tier ID
**Returns:** Promise resolving to board ID

### `processWinner(winnerData)`
**Description:** Processes a winner and creates winner record
**Parameters:**
- `winnerData` (Object) - Winner information including userId, gameId, position, etc.
**Returns:** Promise resolving to winner record ID

### `processLoser(loserData)`
**Description:** Processes a loser and grants consolation prizes
**Parameters:**
- `loserData` (Object) - Loser information including userId, boardId, position, etc.
**Returns:** Promise

### `grantTierAccess(userId, tierId, gameId)`
**Description:** Grants tier access to user after successful payment
**Parameters:**
- `userId` (string) - User document ID
- `tierId` (string) - Tier ID
- `gameId` (string) - Game ID
**Returns:** Promise

### `sendWinnerNotification(userId, amount, quarter)`
**Description:** Sends notification to winner
**Parameters:**
- `userId` (string) - User document ID
- `amount` (number) - Prize amount
- `quarter` (string) - Winning quarter
**Returns:** Promise

### `sendLoserNotification(userId, position, winnerTime, consolationCount)`
**Description:** Sends consolation notification to loser
**Parameters:**
- `userId` (string) - User document ID
- `position` (number) - Square position
- `winnerTime` (number) - Winner's answer time
- `consolationCount` (number) - Number of consolation chances
**Returns:** Promise

### `cleanupOldClaims(boardId, board, currentQuarter, game)`
**Description:** Cleans up processed claims and awards fastest bonuses
**Parameters:**
- `boardId` (string) - Board document ID
- `board` (Object) - Board data
- `currentQuarter` (number) - Current game quarter
- `game` (Object) - Game data
**Returns:** Promise

### `sendTelegramNotification(chatId, message)`
**Description:** Sends Telegram notification to user
**Parameters:**
- `chatId` (string) - Telegram chat ID
- `message` (string) - Message to send
**Returns:** Promise

## Helper Functions

### `createTriviaSession(userId, tierId)`
**Description:** Creates a trivia session for user
**Parameters:**
- `userId` (string) - User document ID
- `tierId` (string) - Tier ID
**Returns:** Promise

### `processPaymentProvider(userId, amount, method)`
**Description:** Processes payment through external provider
**Parameters:**
- `userId` (string) - User document ID
- `amount` (number) - Payment amount
- `method` (string) - Payment method
**Returns:** Promise with transaction details

### `sendTelegramMessage(chatId, message)`
**Description:** Sends message via Telegram Bot API
**Parameters:**
- `chatId` (string) - Telegram chat ID
- `message` (string) - Message content
**Returns:** Promise

## Constants Used
- `TIERS` - Tier configuration and pricing
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- Tier amounts mapping for prize calculations