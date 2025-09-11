# Payment Functions Documentation

This document covers all payment-related Firebase Cloud Functions in the Square Trivia application.

## Overview

Payment functions handle Stripe integration, tier access management, instant payouts, and financial processing.

## Functions

### createPaymentIntent
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Create Stripe payment intent for tier access

#### Parameters
```javascript
{
  tier: "tier_100", // tier_25, tier_50, tier_100, tier_250, tier_500, tier_1000
  telegramUsername: "@username" // Optional
}
```

#### Response
```javascript
{
  success: true,
  clientSecret: "pi_xxx_secret_xxx",
  donationId: "donation_doc_id"
}
```

#### Business Logic
1. Validates tier selection and Telegram username (if provided)
2. Applies rate limiting (5 attempts per hour)
3. Creates donation record with tier-specific payout percentage
4. Generates Stripe payment intent
5. Returns client secret for frontend processing

---

### stripeWebhook
**Type**: HTTPS Request  
**Auth**: Stripe signature verification  
**Purpose**: Handle Stripe webhook events

#### Supported Events
- `payment_intent.succeeded`: Process successful payments
- `payment_intent.payment_failed`: Handle failed payments
- `charge.refunded`: Process refunds

#### Webhook Security
- Signature verification using webhook secret
- Replay attack prevention with event ID tracking
- Automatic retry handling for failed processing

#### Success Flow
1. Update donation status to completed
2. Grant tier access for 30 days
3. Update user's current tiers
4. Send Telegram group invite (if applicable)
5. Send email confirmation
6. Update analytics

---

### verifyCheckoutSession
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Verify Stripe checkout session completion

#### Parameters
```javascript
{
  sessionId: "cs_xxx"
}
```

#### Response
```javascript
{
  success: true,
  tier: "tier_100",
  donationId: "donation_doc_id",
  alreadyProcessed: false
}
```

---

### processInstantPayout
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Process instant payout with 4% fee

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
  stripePayoutId: "po_xxx"
}
```

#### Fee Structure
- **Instant Payout**: 4% fee, arrives within minutes
- **Batch Payout**: No fee, processed Tuesday/Friday

---

### grantTelegramAccessForTier
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Grant Telegram access for existing tier

#### Parameters
```javascript
{
  userId: "user_id",
  tier: "tier_100",
  telegramUsername: "@username"
}
```

#### Response
```javascript
{
  success: true,
  message: "Telegram access granted for $100 Tier"
}
```

---

### verifyTierAccess
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Check if user has active tier access

#### Parameters
```javascript
{
  tier: "tier_100"
}
```

#### Response
```javascript
{
  hasAccess: true,
  expiresAt: 1704067200000, // Unix timestamp
  tier: "tier_100"
}
```

---

### processRefund
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Process refund for donation

#### Parameters
```javascript
{
  donationId: "donation_doc_id",
  reason: "Customer request"
}
```

#### Response
```javascript
{
  success: true,
  refundId: "re_xxx",
  amount: 100.00
}
```

## Data Structures

### Donation Document
```javascript
{
  userId: "user_id",
  tier: "tier_100",
  amount: 100,
  payoutPercentage: 0.77, // 77% for lower tiers, 80% for higher tiers
  telegramUsername: "@username",
  hasTelegram: true,
  webOnlyAccess: false,
  status: "completed", // "pending", "processing", "completed", "failed", "refunded"
  stripePaymentIntentId: "pi_xxx",
  stripeChargeId: "ch_xxx",
  completedAt: Timestamp,
  accessExpiresAt: Timestamp, // 30 days from completion
  createdAt: Timestamp,
  metadata: {
    userAgent: "Mozilla/5.0...",
    ip: "192.168.1.1"
  }
}
```

### Tier Access Document
```javascript
{
  userId: "user_id",
  tier: "tier_100",
  donationId: "donation_doc_id",
  telegramUsername: "@username",
  grantedAt: Timestamp,
  expiresAt: Timestamp,
  active: true,
  isFreeEntry: false
}
```

### Payout Document
```javascript
{
  userId: "user_id",
  email: "user@example.com",
  amount: 96.00,
  originalAmount: 100.00,
  instantPayoutFee: 4.00,
  winDetails: [
    {
      winnerId: "winner_id",
      game: "Chiefs vs Bills",
      quarter: "q1",
      position: 25,
      amount: 100.00
    }
  ],
  payoutMethod: {
    type: "stripe_connect",
    accountId: "acct_xxx"
  },
  payoutType: "instant", // "instant" or "batch"
  stripePayoutId: "po_xxx",
  status: "completed",
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

## Tier Configuration

### Tier Structure
```javascript
const TIER_CONFIG = {
  tier_25: {
    amount: 25,
    name: "$25 Tier",
    telegramGroupId: "-1002279525248",
    payoutPercentage: 0.77 // 77% to winners
  },
  tier_50: {
    amount: 50,
    name: "$50 Tier",
    telegramGroupId: "-1002862739955",
    payoutPercentage: 0.77
  },
  tier_100: {
    amount: 100,
    name: "$100 Tier",
    telegramGroupId: "-1002749874729",
    payoutPercentage: 0.77
  },
  tier_250: {
    amount: 250,
    name: "$250 Tier",
    telegramGroupId: "-1002554143674",
    payoutPercentage: 0.80 // 80% to winners
  },
  tier_500: {
    amount: 500,
    name: "$500 Tier",
    telegramGroupId: "-1002477878800",
    payoutPercentage: 0.80
  },
  tier_1000: {
    amount: 1000,
    name: "$1000 Tier",
    telegramGroupId: "-1002775562003",
    payoutPercentage: 0.80
  }
};
```

### Prize Calculations
```javascript
// Example for $100 tier
const tierAmount = 100;
const payoutPercentage = 0.77;
const totalSquares = 50;

const totalPot = tierAmount * totalSquares; // $5,000
const prizePool = totalPot * payoutPercentage; // $3,850
const quarterPrize = prizePool / 4; // $962.50 per quarter
const platformRevenue = totalPot * (1 - payoutPercentage); // $1,150
```

## Payment Flow

### Standard Payment Flow
1. User selects tier and provides optional Telegram username
2. `createPaymentIntent` generates Stripe payment intent
3. Frontend processes payment with Stripe Elements
4. Stripe sends webhook to `stripeWebhook`
5. System grants tier access and sends confirmations
6. User can participate in games for 30 days

### Instant Payout Flow
1. User wins a quarter and chooses instant payout
2. `processInstantPayout` calculates 4% fee
3. System creates Stripe payout to user's connected account
4. Payout arrives within minutes
5. User receives confirmation email

### Batch Payout Flow
1. Winners accumulate throughout the week
2. Tuesday: Process payouts for Friday-Monday games
3. Friday: Process payouts for Tuesday-Thursday games
4. Admin downloads CSV for payment processor
5. Payments processed within 1-3 business days

## Error Handling

### Payment Errors
```javascript
// Insufficient funds
{
  code: "card_declined",
  message: "Your card was declined.",
  decline_code: "insufficient_funds"
}

// Invalid tier
{
  code: "invalid-argument",
  message: "Invalid tier selected",
  details: { validTiers: ["tier_25", "tier_50", ...] }
}

// Rate limited
{
  code: "resource-exhausted",
  message: "Too many payment attempts. Try again in 45 minutes.",
  details: { retryAfter: 45 }
}
```

### Webhook Errors
- Signature verification failures logged and rejected
- Duplicate events detected and ignored
- Processing failures trigger admin alerts

## Security

### Payment Security
- PCI compliance through Stripe
- No card data stored in Firebase
- Webhook signature verification
- Rate limiting on payment attempts

### Access Control
- Tier access verified before game participation
- Expiration dates enforced
- Admin-only refund processing
- Audit logging for all financial operations

## Testing

### Test Cards (Stripe)
```javascript
// Successful payment
const testCard = "4242424242424242";

// Declined payment
const declinedCard = "4000000000000002";

// Insufficient funds
const insufficientCard = "4000000000009995";
```

### Test Environment
```javascript
// Use test API keys
const stripe = require('stripe')('sk_test_...');

// Test webhook endpoint
const webhookSecret = 'whsec_test_...';
```

## Monitoring

### Key Metrics
- Payment success rate
- Average payment amount
- Tier distribution
- Refund rate
- Instant payout usage

### Alerts
- Failed payment webhook processing
- High refund rates
- Unusual payment patterns
- Stripe API errors

## Compliance

### Tax Reporting
- 1099 forms for winners over $600/year
- Transaction records maintained
- User tax information collection

### Data Protection
- PII encryption at rest
- Secure data transmission
- GDPR compliance for EU users
- Data retention policies

## Integration

### Frontend Integration
```javascript
// Initialize Stripe
const stripe = Stripe('pk_test_...');

// Create payment intent
const { clientSecret } = await createPaymentIntent({
  tier: 'tier_100',
  telegramUsername: '@username'
});

// Process payment
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Customer Name' }
  }
});
```

### Webhook Integration
```javascript
// Express.js webhook handler
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    // Process event
    res.json({received: true});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```