# Utility Functions Documentation

This module provides core utilities used throughout the Square Trivia system for consistency and security.

## Firebase Functions
*This module contains no Firebase Functions - it provides utility functions for other modules*

## Timestamp Utilities

### `getTimestamp()`
**Description:** Gets server timestamp for new documents (ALWAYS use instead of new Date())
**Parameters:** None
**Returns:** Firestore server timestamp

### `getNow()`
**Description:** Gets current Firestore timestamp for comparisons
**Parameters:** None
**Returns:** Firestore Timestamp object

### `timestampToDate(timestamp)`
**Description:** Converts Firestore timestamp to JavaScript Date
**Parameters:**
- `timestamp` (Timestamp) - Firestore timestamp
**Returns:** Date object or null if invalid

### `getFutureTimestamp(days, hours, minutes)`
**Description:** Gets timestamp for future date
**Parameters:**
- `days` (number, optional) - Days to add (default 0)
- `hours` (number, optional) - Hours to add (default 0)
- `minutes` (number, optional) - Minutes to add (default 0)
**Returns:** Firestore Timestamp for future date

### `isExpired(timestamp)`
**Description:** Checks if timestamp is expired
**Parameters:**
- `timestamp` (Timestamp) - Timestamp to check
**Returns:** Boolean indicating if expired

### `formatTimestamp(timestamp, format)`
**Description:** Formats timestamp for display
**Parameters:**
- `timestamp` (Timestamp) - Timestamp to format
- `format` (string, optional) - Format type: 'full', 'date', 'time' (default 'full')
**Returns:** Formatted date string

## Input Validation

### `validateEmail(email)`
**Description:** Validates email address format and length
**Parameters:**
- `email` (string) - Email to validate
**Returns:** Object with valid (boolean), value (cleaned email), error (string)

### `validateTelegramUsername(username)`
**Description:** Validates Telegram username format (allows empty values)
**Parameters:**
- `username` (string) - Telegram username to validate
**Returns:** Object with valid (boolean), value (cleaned username), isEmpty (boolean), error (string)

### `validatePhone(phone)`
**Description:** Validates US phone number format
**Parameters:**
- `phone` (string) - Phone number to validate
**Returns:** Object with valid (boolean), value (formatted phone), error (string)

### `validateSquarePosition(position)`
**Description:** Validates square position is within valid range
**Parameters:**
- `position` (number) - Square position to validate
**Returns:** Object with valid (boolean), value (parsed position), error (string)

### `validateDonationAmount(amount, tierId)`
**Description:** Validates donation amount and tier matching
**Parameters:**
- `amount` (number) - Donation amount
- `tierId` (string, optional) - Tier ID to match against
**Returns:** Object with valid (boolean), value (parsed amount), error (string)

### `sanitizeInput(input)`
**Description:** Sanitizes user input to prevent XSS attacks
**Parameters:**
- `input` (string) - Input to sanitize
**Returns:** Sanitized string

### `validateRequestData(data, requiredFields)`
**Description:** Validates request data against schema
**Parameters:**
- `data` (Object) - Data to validate
- `requiredFields` (Array) - Array of required field names
**Returns:** Object with valid (boolean) and errors (Array)

## Error Handling

### `asyncHandler(fn)`
**Description:** Wraps async functions with standardized error handling
**Parameters:**
- `fn` (Function) - Async function to wrap
**Returns:** Wrapped function with error handling

### `createError(code, message, details)`
**Description:** Creates standardized Firebase error response
**Parameters:**
- `code` (string) - Error code: 'auth', 'permission', 'validation', 'not-found', etc.
- `message` (string) - Error message
- `details` (Object, optional) - Additional error details
**Returns:** Firebase HttpsError

### `logError(error, context)`
**Description:** Logs error with context information
**Parameters:**
- `error` (Error) - Error object
- `context` (Object, optional) - Additional context
**Returns:** None (logs to console and error tracking)

### `retryOperation(operation, maxRetries, delay)`
**Description:** Retries failed operations with exponential backoff
**Parameters:**
- `operation` (Function) - Operation to retry
- `maxRetries` (number, optional) - Maximum retry attempts (default 3)
- `delay` (number, optional) - Initial delay in ms (default 1000)
**Returns:** Promise with operation result

## Transaction Helpers

### `safeTransaction(db, transactionFn, maxRetries)`
**Description:** Runs Firestore transaction with automatic retry on conflicts
**Parameters:**
- `db` (Firestore) - Database instance
- `transactionFn` (Function) - Transaction function
- `maxRetries` (number, optional) - Maximum retry attempts (default 5)
**Returns:** Promise with transaction result

### `safeBatchWrite(db, operations)`
**Description:** Batch write with automatic chunking (Firestore limit: 500)
**Parameters:**
- `db` (Firestore) - Database instance
- `operations` (Array) - Array of operation objects with type, ref, data
**Returns:** Promise with batch result

### `updateDistributedCounter(db, docPath, field, delta)`
**Description:** Updates distributed counter for high-frequency updates
**Parameters:**
- `db` (Firestore) - Database instance
- `docPath` (string) - Document path
- `field` (string) - Field name
- `delta` (number, optional) - Amount to increment (default 1)
**Returns:** Promise

### `readDistributedCounter(db, docPath, field)`
**Description:** Reads distributed counter total value
**Parameters:**
- `db` (Firestore) - Database instance
- `docPath` (string) - Document path
- `field` (string) - Field name
**Returns:** Promise resolving to total count

## Rate Limiting

### `checkRateLimit(userId, action, customLimits)`
**Description:** Checks rate limit for user action
**Parameters:**
- `userId` (string) - User ID
- `action` (string) - Action being performed
- `customLimits` (Object, optional) - Custom rate limits
**Returns:** Promise with rate limit status

### `resetRateLimit(userId, action)`
**Description:** Resets rate limit for user
**Parameters:**
- `userId` (string) - User ID
- `action` (string, optional) - Specific action to reset (null for all)
**Returns:** None

### `cleanupRateLimits()`
**Description:** Cleans up expired rate limit entries
**Parameters:** None
**Returns:** None

## Random Number Generation

### `secureRandomInt(min, max)`
**Description:** Generates cryptographically secure random integer without modulo bias
**Parameters:**
- `min` (number) - Minimum value (inclusive)
- `max` (number) - Maximum value (exclusive)
**Returns:** Random integer

### `secureRandomElement(array)`
**Description:** Selects random element from array
**Parameters:**
- `array` (Array) - Array to select from
**Returns:** Random array element

### `secureShuffleArray(array)`
**Description:** Shuffles array using Fisher-Yates algorithm
**Parameters:**
- `array` (Array) - Array to shuffle
**Returns:** New shuffled array

### `generateRandomId(length)`
**Description:** Generates random string for IDs
**Parameters:**
- `length` (number, optional) - Length of ID (default 16)
**Returns:** Random ID string

### `generateReferralCode()`
**Description:** Generates 6-character referral code
**Parameters:** None
**Returns:** Uppercase referral code string

## Data Helpers

### `deepClone(obj)`
**Description:** Deep clones object (Firestore-safe)
**Parameters:**
- `obj` (any) - Object to clone
**Returns:** Deep cloned object

### `safeMerge(target, source)`
**Description:** Merges objects with Firestore FieldValues preserved
**Parameters:**
- `target` (Object) - Target object
- `source` (Object) - Source object
**Returns:** Merged object

### `removeUndefined(obj)`
**Description:** Removes undefined values from object
**Parameters:**
- `obj` (Object) - Object to clean
**Returns:** Object without undefined values

### `batchArray(array, batchSize)`
**Description:** Splits array into batches
**Parameters:**
- `array` (Array) - Array to batch
- `batchSize` (number) - Size of each batch
**Returns:** Array of batches

## Skill-Based System Helpers

### `getTierById(tierId)`
**Description:** Gets tier configuration by ID
**Parameters:**
- `tierId` (string) - Tier ID (e.g., 'tier_25', 'tier_100')
**Returns:** Tier configuration object or null

### `calculatePrizes(tierAmount)`
**Description:** Calculates prize amounts based on tier
**Parameters:**
- `tierAmount` (number) - Tier amount (25, 50, 100, etc.)
**Returns:** Object with totalPrize, quarterPrize, payoutPercentage

## Performance Monitoring

### `measurePerformance(fn, name)`
**Description:** Measures function execution time
**Parameters:**
- `fn` (Function) - Function to measure
- `name` (string, optional) - Function name for logging
**Returns:** Wrapped function with performance logging

### `memoize(fn, ttl)`
**Description:** Caches function results with TTL
**Parameters:**
- `fn` (Function) - Function to memoize
- `ttl` (number, optional) - Time to live in ms (default 300000)
**Returns:** Memoized function

## Constants Used
- `RATE_LIMITS` - Rate limiting configuration
- `VALIDATION_RULES` - Input validation rules
- `ERROR_MESSAGES` - Standardized error messages
- `FEATURE_FLAGS` - Feature toggle flags
- `TIER_CONFIG` - Tier configuration for skill-based system