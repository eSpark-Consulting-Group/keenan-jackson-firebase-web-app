# Financial System Documentation

This module handles complete financial tracking, reconciliation, and payout management for Square Trivia.

## Firebase Functions

### `processInstantPayout`
**Type:** Callable Function
**Description:** Processes instant payout for winners with 4% fee
**Requirements:**
- `context.auth` - User authentication required
- `data.winnerId` (string) - Winner document ID
- User must have connected Stripe account
- Winner status must be pending

### `dailyStripeToMercuryReconciliation`
**Type:** Scheduled Function (runs daily at 9:00 AM)
**Description:** Reconciles Stripe payments to Mercury deposits
**Trigger:** `functions.pubsub.schedule("every day 09:00")`
**Requirements:**
- No parameters (scheduled function)
- Accesses Firestore collections: `donations`, `reconciliations`

### `confirmMercuryDeposit`
**Type:** Callable Function
**Description:** Confirms Mercury deposit amount (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.reconciliationId` (string) - Reconciliation document ID
- `data.actualAmount` (number) - Actual deposit amount
- `data.mercuryTransactionId` (string) - Mercury transaction ID
- `data.notes` (string, optional) - Admin notes

### `processTuesdayPayouts`
**Type:** Scheduled Function (runs Tuesdays at 8:00 AM)
**Description:** Processes batch payouts for Friday-Monday games
**Trigger:** `functions.pubsub.schedule("every tuesday 08:00")`
**Requirements:**
- No parameters (scheduled function)
- Sufficient Mercury balance for payouts

### `processFridayPayouts`
**Type:** Scheduled Function (runs Fridays at 8:00 AM)
**Description:** Processes batch payouts for Tuesday-Thursday games
**Trigger:** `functions.pubsub.schedule("every friday 08:00")`
**Requirements:**
- No parameters (scheduled function)
- Sufficient Mercury balance for payouts

### `confirmRelayPayouts`
**Type:** Callable Function
**Description:** Confirms Relay payout processing results (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.batchId` (string) - Payout batch ID
- `data.confirmations` (Array) - Array of payout confirmations with status

### `generateFinancialReport`
**Type:** Callable Function
**Description:** Generates various financial reports (admin only)
**Requirements:**
- `context.auth.token.admin` - Admin authentication required
- `data.reportType` (string) - Report type: 'daily_summary', 'weekly_pnl', 'monthly_reconciliation', 'tax_summary', 'tier_analysis'
- `data.startDate` (string) - Start date for report
- `data.endDate` (string) - End date for report

### `dailyFinancialHealthCheck`
**Type:** Scheduled Function (runs daily at 10:00 AM)
**Description:** Performs daily financial health checks and alerts
**Trigger:** `functions.pubsub.schedule("every day 10:00")`
**Requirements:**
- No parameters (scheduled function)
- Sends admin alerts for issues found

## Simple Functions

### `processScheduledPayouts(batchDay, daysBackStart, daysBackEnd)`
**Description:** Processes scheduled payout batches
**Parameters:**
- `batchDay` (string) - Day of batch processing
- `daysBackStart` (number) - Days back to start range
- `daysBackEnd` (number) - Days back to end range
**Returns:** Promise

### `getMercuryBalance()`
**Description:** Gets current Mercury account balance
**Parameters:** None
**Returns:** Promise resolving to current balance number

### `updateMercuryBalance(amount)`
**Description:** Updates Mercury balance and sends low balance alerts
**Parameters:**
- `amount` (number) - Amount to add/subtract from balance
**Returns:** Promise

### `generateRelayCSV(payouts)`
**Description:** Generates CSV file for Relay payout processing
**Parameters:**
- `payouts` (Array) - Array of payout objects
**Returns:** Promise resolving to CSV string

### `generateDailySummary(date)`
**Description:** Generates daily financial summary report
**Parameters:**
- `date` (Date) - Date for summary
**Returns:** Promise resolving to summary object

### `generateWeeklyPnL(startDate, endDate)`
**Description:** Generates weekly profit and loss report
**Parameters:**
- `startDate` (Date) - Start date
- `endDate` (Date) - End date
**Returns:** Promise resolving to P&L object

### `generateMonthlyReconciliation(startDate, endDate)`
**Description:** Generates monthly reconciliation report
**Parameters:**
- `startDate` (Date) - Start date
- `endDate` (Date) - End date
**Returns:** Promise resolving to reconciliation object

### `generateTaxSummary(startDate, endDate)`
**Description:** Generates tax summary for 1099 reporting
**Parameters:**
- `startDate` (Date) - Start date
- `endDate` (Date) - End date
**Returns:** Promise resolving to tax summary object

### `generateTierAnalysis(startDate, endDate)`
**Description:** Generates tier performance analysis
**Parameters:**
- `startDate` (Date) - Start date
- `endDate` (Date) - End date
**Returns:** Promise resolving to tier analysis object

### `generateReconciliationRecommendations(totalVariance, variances, unreconciled)`
**Description:** Generates recommendations for reconciliation issues
**Parameters:**
- `totalVariance` (number) - Total variance amount
- `variances` (Array) - Array of variance records
- `unreconciled` (Array) - Array of unreconciled items
**Returns:** Array of recommendation strings

## Notification Functions

### `sendReconciliationNotification(data)`
**Description:** Sends reconciliation notification to admin
**Parameters:**
- `data` (Object) - Reconciliation data with date, transactions, expected deposit
**Returns:** Promise

### `sendPayoutBatchNotification(data)`
**Description:** Sends payout batch notification to admin
**Parameters:**
- `data` (Object) - Batch data with user count, total amount, balance info
**Returns:** Promise

### `sendInstantPayoutConfirmation(winnerId, payoutAmount, instantFee)`
**Description:** Sends instant payout confirmation email to winner
**Parameters:**
- `winnerId` (string) - Winner user ID
- `payoutAmount` (number) - Net payout amount
- `instantFee` (number) - Fee charged
**Returns:** Promise

### `sendPayoutConfirmation(userId, amount, transactionId)`
**Description:** Sends payout confirmation email to user
**Parameters:**
- `userId` (string) - User ID
- `amount` (number) - Payout amount
- `transactionId` (string) - Transaction ID
**Returns:** Promise

### `sendAdminEmail(subject, message)`
**Description:** Sends email to administrators
**Parameters:**
- `subject` (string) - Email subject
- `message` (string) - Email message
**Returns:** Promise

### `sendAdminAlert(subject, message)`
**Description:** Sends urgent alert to administrators via email and Telegram
**Parameters:**
- `subject` (string) - Alert subject
- `message` (string) - Alert message
**Returns:** Promise

## Constants Used
- `TIER_CONFIG` - Tier configuration with payout percentages
- `PAYOUT_STATUS` - Payout status constants
- `INSTANT_PAYOUT_FEE` - 4% fee for instant payouts
- `RECONCILIATION_STATUS` - Reconciliation status constants
- Email templates and styling
- Mercury and Stripe configuration