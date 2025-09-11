# Financial Functions Documentation

This document covers all financial tracking, reconciliation, and payout management Firebase Cloud Functions.

## Overview

Financial functions handle money flow tracking, Stripe-to-Mercury reconciliation, batch payouts, and comprehensive financial reporting.

## Functions

### processInstantPayout
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Process instant payout with 4% fee via Stripe

#### Parameters
```javascript
{
  winnerId: "winner_doc_id"
}
```

#### Response
```javascript
{
  success: true,
  payoutAmount: "96.00",
  instantFee: "4.00",
  stripePayoutId: "po_1234567890"
}
```

#### Business Logic
1. Validates winner belongs to authenticated user
2. Checks if payout already processed
3. Calculates 4% instant fee
4. Creates Stripe instant payout
5. Records transaction in database
6. Sends confirmation email

---

### dailyStripeToMercuryReconciliation
**Type**: Pub/Sub Scheduled  
**Schedule**: Daily at 9:00 AM MT  
**Purpose**: Reconcile Stripe payments to Mercury deposits

#### Process Flow
1. Get all completed donations from previous day
2. Calculate expected deposit (gross - Stripe fees)
3. Create reconciliation record
4. Send notification to admin for verification

#### Calculation Example
```javascript
// Example reconciliation
const donations = [
  { amount: 100, stripeFee: 3.20 }, // $100 - $3.20 = $96.80
  { amount: 250, stripeFee: 7.55 }, // $250 - $7.55 = $242.45
];

const grossAmount = 350.00;
const totalFees = 10.75;
const expectedDeposit = 339.25;
```

---

### confirmMercuryDeposit
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Confirm actual Mercury deposit amount

#### Parameters
```javascript
{
  reconciliationId: "recon_doc_id",
  actualAmount: 339.25,
  mercuryTransactionId: "mercury_tx_123",
  notes: "Deposit confirmed in Mercury dashboard"
}
```

#### Response
```javascript
{
  success: true,
  matched: true,
  variance: "0.00",
  variancePercent: "0.00%"
}
```

#### Variance Handling
- Variance < $0.01: Marked as matched
- Variance ≥ $0.01: Marked as variance, admin alert sent
- Large variances trigger investigation

---

### processTuesdayPayouts
**Type**: Pub/Sub Scheduled  
**Schedule**: Every Tuesday at 8:00 AM MT  
**Purpose**: Process batch payouts for Friday-Monday games

#### Payout Schedule
- **Tuesday**: Process winners from Friday, Saturday, Sunday, Monday games
- **Friday**: Process winners from Tuesday, Wednesday, Thursday games

#### Process Flow
1. Get Mercury account balance
2. Find pending winners in date range
3. Group payouts by user
4. Check sufficient funds
5. Generate CSV for payment processor
6. Send admin notification

---

### processFridayPayouts
**Type**: Pub/Sub Scheduled  
**Schedule**: Every Friday at 8:00 AM MT  
**Purpose**: Process batch payouts for Tuesday-Thursday games

#### Same logic as Tuesday payouts but different date range

---

### confirmRelayPayouts
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Confirm batch payout completion

#### Parameters
```javascript
{
  batchId: "batch_doc_id",
  confirmations: [
    {
      payoutId: "payout_1",
      status: "completed",
      transactionId: "relay_tx_123"
    },
    {
      payoutId: "payout_2", 
      status: "failed",
      failureReason: "Invalid account"
    }
  ]
}
```

#### Response
```javascript
{
  success: true,
  successCount: 45,
  failureCount: 2,
  totalPaid: "4250.00"
}
```

---

### generateFinancialReport
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Generate comprehensive financial reports

#### Report Types
- `daily_summary`: Daily revenue and payout summary
- `weekly_pnl`: Weekly profit & loss statement
- `monthly_reconciliation`: Monthly reconciliation status
- `tax_summary`: Annual tax reporting data
- `tier_analysis`: Performance by tier

#### Example Daily Summary
```javascript
{
  date: "2024-01-15",
  revenue: {
    gross: "5250.00",
    stripeFees: "162.75",
    net: "5087.25",
    byTier: {
      tier_100: { count: 25, amount: "2500.00" },
      tier_250: { count: 11, amount: "2750.00" }
    }
  },
  allocations: {
    operatingRevenue: "1271.81", // 25% platform fee
    prizePool: "3815.44",        // 75% to winners
    instantPayoutFees: "84.00"   // 4% instant fees
  },
  payouts: {
    total: "3200.00",
    instant: "800.00",
    batch: "2400.00",
    count: 32
  },
  profit: {
    daily: "1355.81" // Operating + instant fees
  }
}
```

---

### dailyFinancialHealthCheck
**Type**: Pub/Sub Scheduled  
**Schedule**: Daily at 10:00 AM MT  
**Purpose**: Monitor financial system health

#### Health Checks
1. **Unreconciled Deposits**: Alert if deposits pending >24 hours
2. **Old Pending Payouts**: Alert if payouts pending >7 days
3. **Mercury Balance**: Alert if balance < pending payouts
4. **High Instant Volume**: Alert if >50 instant payouts/day

## Data Structures

### Reconciliation Document
```javascript
{
  type: "stripe_to_mercury",
  date: Timestamp, // Date being reconciled
  transactions: 25, // Number of donations
  grossAmount: "5250.00",
  stripeFees: "162.75", 
  expectedDeposit: "5087.25",
  actualDeposit: "5087.25", // Set when confirmed
  variance: "0.00",
  variancePercent: "0.00%",
  status: "matched", // "pending", "matched", "variance", "resolved"
  paymentDetails: [
    {
      donationId: "donation_1",
      amount: 100,
      fee: "3.20",
      net: "96.80",
      stripePaymentIntentId: "pi_xxx"
    }
  ],
  mercuryTransactionId: "mercury_tx_123",
  reconciledAt: Timestamp,
  reconciledBy: "admin_user_id",
  createdAt: Timestamp
}
```

### Payout Batch Document
```javascript
{
  batchDay: "tuesday", // "tuesday" or "friday"
  dateRange: {
    start: Timestamp,
    end: Timestamp
  },
  userCount: 45,
  winnerCount: 67,
  totalAmount: 4250.00,
  mercuryBalance: 15000.00,
  
  // Processing status
  status: "completed", // "pending", "processing", "completed", "failed"
  
  // Relay integration
  relayCSV: "name,email,amount,method...", // CSV data
  relayData: [
    {
      payoutId: "payout_1",
      name: "John Doe",
      email: "john@example.com", 
      amount: "96.00",
      method: "ach",
      accountNumber: "****1234"
    }
  ],
  
  // Completion tracking
  successCount: 45,
  failureCount: 2,
  totalPaid: 4250.00,
  completedAt: Timestamp,
  completedBy: "admin_user_id",
  
  createdAt: Timestamp
}
```

### Account Balance Document
```javascript
{
  account: "mercury", // "mercury", "stripe"
  type: "deposit", // "deposit", "withdrawal"
  amount: 5087.25, // Positive for deposits, negative for withdrawals
  source: "stripe", // "stripe", "relay", "manual"
  reconciliationId: "recon_doc_id",
  mercuryTransactionId: "mercury_tx_123",
  timestamp: Timestamp
}
```

### Financial Report Document
```javascript
{
  type: "daily_summary",
  dateRange: {
    start: Timestamp,
    end: Timestamp
  },
  generatedBy: "admin_user_id",
  generatedAt: Timestamp,
  data: {
    // Report-specific data structure
    revenue: { /* ... */ },
    expenses: { /* ... */ },
    profit: { /* ... */ }
  }
}
```

## Financial Calculations

### Revenue Allocation
```javascript
// Tier-specific payout percentages
const TIER_PAYOUTS = {
  tier_25: 0.77,   // 77% to winners, 23% platform
  tier_50: 0.77,   // 77% to winners, 23% platform  
  tier_100: 0.77,  // 77% to winners, 23% platform
  tier_250: 0.80,  // 80% to winners, 20% platform
  tier_500: 0.80,  // 80% to winners, 20% platform
  tier_1000: 0.80  // 80% to winners, 20% platform
};

// Example calculation for $100 tier
const tierAmount = 100;
const totalSquares = 50;
const payoutPercentage = 0.77;

const totalPot = tierAmount * totalSquares; // $5,000
const prizePool = totalPot * payoutPercentage; // $3,850
const platformRevenue = totalPot * (1 - payoutPercentage); // $1,150
const quarterPrize = prizePool / 4; // $962.50 per quarter
```

### Stripe Fee Calculation
```javascript
// Stripe fees: 2.9% + $0.30 per transaction
function calculateStripeFee(amount) {
  return (amount * 0.029) + 0.30;
}

// Example
const donation = 100.00;
const stripeFee = calculateStripeFee(donation); // $3.20
const netAmount = donation - stripeFee; // $96.80
```

### Instant Payout Fee
```javascript
// 4% fee for instant payouts
function calculateInstantPayout(prizeAmount) {
  const fee = prizeAmount * 0.04;
  const netPayout = prizeAmount - fee;
  
  return {
    originalPrize: prizeAmount,
    instantFee: fee,
    netPayout: netPayout
  };
}

// Example
const prize = 962.50;
const instant = calculateInstantPayout(prize);
// { originalPrize: 962.50, instantFee: 38.50, netPayout: 924.00 }
```

## Reconciliation Process

### Daily Reconciliation Flow
1. **9:00 AM**: Automated reconciliation runs
2. **9:05 AM**: Admin receives email with expected deposit
3. **Admin Action**: Check Mercury dashboard for actual deposit
4. **Admin Action**: Confirm deposit via `confirmMercuryDeposit`
5. **System**: Updates balance tracking and variance analysis

### Variance Investigation
- **Small Variance** (<$1): Usually rounding differences
- **Medium Variance** ($1-$10): Possible fee calculation error
- **Large Variance** (>$10): Requires investigation

### Common Variance Causes
- Stripe fee calculation errors
- Refunds processed after reconciliation
- Currency conversion (if applicable)
- Stripe Connect fees (if using connected accounts)

## Payout Processing

### Batch Payout Workflow
1. **Automated**: System generates payout batch
2. **Admin Review**: Verify Mercury balance sufficient
3. **CSV Generation**: Download payment processor CSV
4. **External Processing**: Upload to Relay or other processor
5. **Confirmation**: Mark payouts as completed/failed

### CSV Format for Relay
```csv
name,email,amount,method,account_details
John Doe,john@example.com,96.00,ach,****1234
Jane Smith,jane@example.com,240.00,paypal,jane@paypal.com
```

### Payout Methods Supported
- **ACH**: Bank account transfers
- **PayPal**: PayPal account transfers  
- **Venmo**: Venmo username transfers
- **Zelle**: Email-based transfers
- **Check**: Mailed paper checks (rare)

## Error Handling

### Reconciliation Errors
```javascript
// Variance detected
{
  type: "reconciliation_variance",
  expected: 5087.25,
  actual: 5090.00,
  variance: 2.75,
  variancePercent: "0.05%",
  action: "investigate"
}

// Missing deposit
{
  type: "missing_deposit", 
  expectedDate: "2024-01-15",
  expectedAmount: 5087.25,
  daysPending: 2,
  action: "contact_stripe"
}
```

### Payout Errors
```javascript
// Insufficient funds
{
  type: "insufficient_funds",
  required: 4250.00,
  available: 3800.00,
  shortfall: 450.00,
  action: "transfer_funds"
}

// Failed payout
{
  type: "payout_failed",
  payoutId: "payout_123",
  reason: "Invalid account number",
  action: "contact_user"
}
```

## Monitoring & Alerts

### Key Metrics
- Daily revenue vs. target
- Payout success rate
- Average reconciliation variance
- Mercury account balance trend
- Instant payout adoption rate

### Alert Conditions
- **Critical**: Mercury balance < 24 hours of payouts
- **High**: Reconciliation variance > 1%
- **Medium**: Payout failure rate > 5%
- **Low**: Unusual revenue patterns

### Dashboard Metrics
```javascript
{
  today: {
    revenue: 5250.00,
    payouts: 3200.00,
    profit: 1355.81,
    margin: "25.8%"
  },
  thisWeek: {
    revenue: 28750.00,
    payouts: 21200.00,
    profit: 6890.50,
    margin: "24.0%"
  },
  thisMonth: {
    revenue: 125000.00,
    payouts: 92500.00,
    profit: 28750.00,
    margin: "23.0%"
  }
}
```

## Compliance & Reporting

### Tax Reporting
- 1099 forms for winners over $600/year
- Revenue recognition by month
- Expense categorization
- State tax compliance

### Audit Trail
- All financial transactions logged
- Admin actions tracked
- Reconciliation history maintained
- Payout confirmations stored

### Financial Controls
- Dual approval for large payouts
- Daily balance monitoring
- Variance investigation procedures
- Fraud detection algorithms

## Integration

### Mercury Banking API
```javascript
// Get account balance
const balance = await mercury.accounts.getBalance(accountId);

// Get transaction history
const transactions = await mercury.transactions.list({
  accountId,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Relay Payment Processing
```javascript
// Upload batch for processing
const batch = await relay.batches.create({
  name: 'Tuesday Payouts - Jan 15',
  csvData: payoutCSV,
  processDate: '2024-01-16'
});

// Check batch status
const status = await relay.batches.getStatus(batch.id);
```

### Stripe Connect (Future)
```javascript
// Create connected account for user
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: user.email
});

// Create instant payout
const payout = await stripe.payouts.create({
  amount: 9600, // $96.00 in cents
  currency: 'usd',
  method: 'instant'
}, {
  stripeAccount: account.id
});
```