# Constants Configuration Documentation

This module centralizes all constants and configuration used throughout the Square Trivia system.

## Firebase Functions
*This module contains no Firebase Functions - it's a configuration module*

## Simple Functions

### `getTierById(tierId)`
**Description:** Gets tier configuration by tier ID
**Parameters:**
- `tierId` (string) - Tier identifier (e.g., 'tier_25', 'tier_100')
**Returns:** Tier configuration object or null if not found

### `getTierByAmount(amount)`
**Description:** Gets tier configuration by amount
**Parameters:**
- `amount` (number) - Tier amount (25, 50, 100, etc.)
**Returns:** Tier configuration object or null if not found

### `getAllTierIds()`
**Description:** Gets all available tier IDs
**Parameters:** None
**Returns:** Array of tier ID strings

### `calculatePrizes(tierAmount, gameType)`
**Description:** Calculates prize distribution for a tier
**Parameters:**
- `tierAmount` (number) - Tier amount
- `gameType` (string, optional) - Game type, defaults to 'regular'
**Returns:** Object with prize calculations including totalPot, prizePool, quarterPrize

### `calculateInstantPayout(prizeAmount)`
**Description:** Calculates instant payout amount after fee deduction
**Parameters:**
- `prizeAmount` (number) - Original prize amount
**Returns:** Object with originalPrize, instantPayoutFee, netPayout, feePercentage

## Configuration Objects

### `TIERS`
**Description:** Complete tier system configuration
**Properties:**
- `TIER_25` through `TIER_1000` - Individual tier configurations
- Each tier includes: id, amount, label, color, payoutPercentage, availableIn, etc.

### `GAME_CONFIG`
**Description:** Game-related configuration
**Properties:**
- `SQUARES_PER_BOARD` - Number of squares per board (50)
- `MAX_SQUARES_PER_USER_PER_BOARD` - Maximum squares per user (3)
- `INSTANT_PAYOUT_FEE` - Fee for instant payouts (4%)
- `TYPES` - Game types (regular, playoff, championship)
- `STATUS` - Game status constants
- `QUARTERS` - Quarter definitions

### `SPORTS_CONFIG`
**Description:** Sports API configuration
**Properties:**
- `NFL`, `NBA`, `NCAA_FB`, `NCAA_BB` - Sport-specific configurations
- Each includes: apiSportsId, apiHost, endpoint, hasQuarters, etc.

### `API_CONFIG`
**Description:** API configuration and limits
**Properties:**
- `API_SPORTS` - API-Sports specific configuration
- `STRIPE` - Stripe payment configuration
- Rate limits, timeouts, retry settings

### `NOTIFICATION_CONFIG`
**Description:** Notification system configuration
**Properties:**
- `EMAIL` - Email notification settings
- `TELEGRAM` - Telegram bot configuration
- `SMS` - SMS notification settings

### `RATE_LIMITS`
**Description:** Rate limiting configuration
**Properties:**
- Function-specific rate limits
- Global limits per user and IP
- Time windows and maximum attempts

### `VALIDATION_RULES`
**Description:** Input validation rules
**Properties:**
- Regular expressions for email, phone, Telegram
- Field length constraints
- Financial constraints and limits

### `FEATURE_FLAGS`
**Description:** Feature toggle configuration
**Properties:**
- `ENABLE_SMS`, `ENABLE_CRYPTO_PAYOUTS`, etc.
- `MAINTENANCE_MODE` - System maintenance flag
- Debug and logging flags

### `ERROR_MESSAGES`
**Description:** Standardized error messages
**Properties:**
- Authentication and authorization errors
- Game and payment errors
- Validation error messages

### `SUCCESS_MESSAGES`
**Description:** Standardized success messages
**Properties:**
- Payment and donation confirmations
- Game action confirmations

### `TIMEZONE_CONFIG`
**Description:** Timezone configuration
**Properties:**
- Default timezone settings
- Supported timezones list

### `TIER_CONFIG`
**Description:** Simplified tier configuration
**Properties:**
- Basic tier information with amounts and payout percentages

### `DUMMY_GAMES`
**Description:** Sample game data for testing
**Properties:**
- Mock game objects with scores and team information

## Constants Used
- All configuration objects serve as constants for other modules
- No external dependencies for constants