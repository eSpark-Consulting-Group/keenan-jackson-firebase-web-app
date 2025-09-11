## utility-functions-fixed

### Timestamp Utilities

- getTimestamp() → Returns Firestore server timestamp for writes.
- getNow() → Returns current Firestore timestamp.
- timestampToDate(timestamp) → Converts Firestore Timestamp to Date.
- getFutureTimestamp(days, hours, minutes) → Returns future Firestore timestamp.
- isExpired(timestamp) → Checks if timestamp is expired compared to now.
- formatTimestamp(timestamp, format) → Formats timestamp for display (full, date, time).

### Input Validation

- validateEmail(email) → Validates email format + length.
- validateTelegramUsername(username) → Validates Telegram username, returns @cleaned.
- validatePhone(phone) → Validates & normalizes US phone numbers (+1...).
- validateSquarePosition(position) → Validates board square index (0–99).
- validateDonationAmount(amount, tierId) → Validates donation amount & checks tier match.
- sanitizeInput(input) → Escapes HTML characters to prevent XSS.
- validateRequestData(data, requiredFields) → Validates object against required fields + specific rules.

### Error Handling

- asyncHandler(fn) → Wraps async functions with try/catch, converts to Firebase error.
- createError(code, message, details) → Returns standardized Firebase HttpsError.
- logError(error, context) → Logs error with context (extendable for Sentry/etc).
- retryOperation(operation, maxRetries, delay) → Retries async operation with exponential backoff.

### Firestore Transactions

- safeTransaction(db, transactionFn, maxRetries) → Runs Firestore transaction with retry on conflicts.
- safeBatchWrite(db, operations) → Performs batch write (set/update/delete) with chunking (≤500 ops).
- updateDistributedCounter(db, docPath, field, delta) → Updates sharded counter (for high-frequency writes).
- readDistributedCounter(db, docPath, field) → Reads & aggregates sharded counter.

### Rate Limiting

- checkRateLimit(userId, action, customLimits) → Checks + enforces per-user rate limit.
- resetRateLimit(userId, action) → Resets user’s rate limit (single action or all).
- cleanupRateLimits() → Cleans expired rate limits (runs every 5 min).

### Random Generation

- secureRandomInt(min, max) → Crypto-secure random integer (no bias).
- secureRandomElement(array) → Picks random element from array.
- secureShuffleArray(array) → Fisher-Yates shuffle with secure randomness.
- generateRandomId(length) → Generates random alphanumeric string.
- generateReferralCode() → Generates 6-char uppercase referral code.

### Data Helpers

- deepClone(obj) → Deep clones object while preserving Firestore types.
- safeMerge(target, source) → Merges objects safely, preserving Firestore FieldValues.
- removeUndefined(obj) → Removes undefined values recursively.
- batchArray(array, batchSize) → Splits array into chunks.

### Skill-Based System

- getTierById(tierId) → Gets tier configuration by ID.
- calculatePrizes(tierAmount) → Calculates prize pool & per-quarter payout.

### Performance Utilities

- measurePerformance(fn, name) → Wraps function to log execution time & warn on slowness.
- memoize(fn, ttl) → Caches function results in-memory with TTL.

## user-data-monetization-fixed file

- trackUserEvent=functions.https.onCall(async (data, context) => Track every user action
handleGrantTelegramAccess(userId, telegramUsername, tier) >  Internal helper: safely grant Telegram access for a user & tier
handleGameCommand(chatId) > Handles the /games command from Telegram.
handleWinCommand(chatId) > Handles the /satrt :userID command from Telegram.
handleStatusCommand(chatId) > Handles the /status :userID command from Telegram.
handleSquaresCommand(chatId)
handleReferCommand(chatId)
handleHelpCommand()
handlePayoutCommand()

exports.addTelegramToAccount = functions.https.onCall(async (data, context) => 

exports.telegramWebhook = functions.https.onRequest(async (req, res) => 

exports.sendTriviaAttemptNotifications = functions.pubsub
  .schedule("every 3 hours")
  .timeZone("UTC")


exports.sendGameReminders = functions.pubsub
  .schedule("every 3 hours")
  .timeZone("UTC")

  exports.sendPayoutMessages = functions.pubsub
  .schedule("every 5 minutes")


  exports.checkCancelledGames = functions.pubsub
  .schedule("every 5 minutes")
  .timeZone("America/Denver")

  async function sendTelegramNotification(chatId, message) =>

  exports.setAdminClaim = functions.https.onCall(async (data, context) => 

  exports.sendTelegramMessage = functions.https.onRequest(async (req, res) => 

  