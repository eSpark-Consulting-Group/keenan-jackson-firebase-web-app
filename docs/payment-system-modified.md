# Payment System Documentation

This module handles complete payment processing with Stripe, free entry, and tier management with updated payment structure.

## Firebase Functions

### `createPaymentIntent`
**Type:** Callable Function
**Description:** Creates a Stripe payment intent for tier donation with rate limiting
**Requirements:**
- `context.auth` - User authentication required
- `data.tier` (string) - Tier ID to purchase
- `data.telegramUsername` (string, optional) - Telegram username for group access

### `stripeWebhook`
**Type:** HTTP Function
**Description:** Handles Stripe webhook events with replay protection
**Requirements:**
- `req.headers["stripe-signature"]` - Stripe signature header
- Valid webhook signature verification
- Processes: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded

### `processFreeEntry`
**Type:** Callable Function
**Description:** Processes free entry submissions (AMOE compliance)
**Requirements:**
- `data.entryCode` (string) - Valid entry code from mail
- `data.email` (string) - User email address
- `data.mailingAddress` (Object) - Complete mailing address
- `data.tier` (string) - Requested tier

### `processRefund`
**Type:** Callable Function
**Description:** Processes refund requests (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.donationId` (string) - Donation document ID
- `data.reason` (string) - Refund reason

### `requestInstantPayout`
**Type:** Callable Function
**Description:** Handles instant payout request from winner
**Requirements:**
- `context.auth` - User authentication required
- `data.gameId` (string) - Game document ID
- `data.prizeAmount` (number) - Prize amount
- User must be verified winner of the game

### `verifyTierAccess`
**Type:** Callable Function
**Description:** Checks if user has active access to a tier
**Requirements:**
- `context.auth` - User authentication required
- `data.tier` (string) - Tier to check access for

### `grantTelegramAccessForTier`
**Type:** Callable Function
**Description:** Grants Telegram access for existing user who adds it later
**Requirements:**
- `context.auth` - User authentication required
- `data.userId` (string) - User ID (must match auth or be admin)
- `data.tier` (string) - Tier to grant access for
- `data.telegramUsername` (string) - Telegram username

### `cleanupExpiredAccess`
**Type:** Scheduled Function (runs every 24 hours)
**Description:** Cleans up expired tier access
**Trigger:** `functions.pubsub.schedule("every 24 hours")`
**Requirements:**
- No parameters (scheduled function)
- Updates user tier lists and access records

## Simple Functions

### `handleSuccessfulPayment(paymentIntent)`
**Description:** Processes successful payment and grants tier access
**Parameters:**
- `paymentIntent` (Object) - Stripe payment intent object
**Returns:** Promise

### `handleFailedPayment(paymentIntent)`
**Description:** Handles failed payment processing
**Parameters:**
- `paymentIntent` (Object) - Stripe payment intent object
**Returns:** Promise

### `handleRefund(charge)`
**Description:** Processes refund and revokes access
**Parameters:**
- `charge` (Object) - Stripe charge object
**Returns:** Promise

### `grantTelegramAccess(userId, telegramUsername, tier)`
**Description:** Grants Telegram group access for a tier
**Parameters:**
- `userId` (string) - User document ID
- `telegramUsername` (string) - Telegram username
- `tier` (string) - Tier ID
**Returns:** Promise

### `revokeTelegramAccess(userId, tier)`
**Description:** Revokes Telegram access for a tier
**Parameters:**
- `userId` (string) - User document ID
- `tier` (string) - Tier ID
**Returns:** Promise

### `processInstantPayout(winnerId, prizeAmount, tierInfo)`
**Description:** Processes instant payout with 4% fee via Stripe
**Parameters:**
- `winnerId` (string) - Winner user ID
- `prizeAmount` (number) - Original prize amount
- `tierInfo` (Object) - Tier information
**Returns:** Promise with payout details

### `calculateInstantPayout(prizeAmount)`
**Description:** Calculates instant payout amount after fee
**Parameters:**
- `prizeAmount` (number) - Original prize amount
**Returns:** Object with originalAmount, fee, finalAmount

### `verifyUserTierAccess(userId, tier)`
**Description:** Helper function to verify user's tier access
**Parameters:**
- `userId` (string) - User document ID
- `tier` (string) - Tier ID
**Returns:** Promise resolving to boolean

## Email Notification Functions

### `sendPaymentConfirmation(userId, donationId, tier)`
**Description:** Sends payment confirmation email with tier details
**Parameters:**
- `userId` (string) - User document ID
- `donationId` (string) - Donation document ID
- `tier` (string) - Tier ID
**Returns:** Promise

### `sendPaymentFailureNotification(userId, donationId)`
**Description:** Sends payment failure notification
**Parameters:**
- `userId` (string) - User document ID
- `donationId` (string) - Donation document ID
**Returns:** Promise

### `sendRefundNotification(userId, donationId, amount, instantFees)`
**Description:** Sends refund confirmation with fee information
**Parameters:**
- `userId` (string) - User document ID
- `donationId` (string) - Donation document ID
- `amount` (number) - Refund amount
- `instantFees` (number) - Non-refundable instant fees
**Returns:** Promise

### `sendFreeEntryConfirmation(email, tier)`
**Description:** Sends free entry confirmation
**Parameters:**
- `email` (string) - User email
- `tier` (string) - Tier ID
**Returns:** Promise

### `sendInstantPayoutConfirmation(winnerId, payoutAmount, instantFee)`
**Description:** Sends instant payout confirmation with fee breakdown
**Parameters:**
- `winnerId` (string) - Winner user ID
- `payoutAmount` (number) - Net payout amount
- `instantFee` (number) - Fee charged
**Returns:** Promise

## Utility Functions

### `checkRateLimit(key, limit, windowSeconds)`
**Description:** Checks rate limit for user actions
**Parameters:**
- `key` (string) - Rate limit key
- `limit` (number) - Maximum attempts
- `windowSeconds` (number) - Time window in seconds
**Returns:** Promise with rate limit status

### `updateAnalytics(event, data)`
**Description:** Updates analytics with event data
**Parameters:**
- `event` (string) - Event type
- `data` (Object) - Event data
**Returns:** Promise

### `sendMail(mailOptions)`
**Description:** Sends email using SendGrid
**Parameters:**
- `mailOptions` (Object) - Email options with to, subject, html
**Returns:** Promise

## Constants Used
- `TIER_CONFIG` - Tier configuration with amounts and Telegram groups
- `DONATION_STATUS` - Payment status constants
- `INSTANT_PAYOUT_FEE` - 4% fee for instant payouts
- `BATCH_PAYOUT_DAYS` - Tuesday and Friday batch processing
- Stripe configuration and webhook secrets
- Telegram bot configuration
- Email templates and styling