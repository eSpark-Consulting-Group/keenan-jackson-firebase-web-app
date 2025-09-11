# Square Trivia - Firebase Cloud Functions Documentation

This documentation provides a comprehensive overview of all Firebase Cloud Functions in the Square Trivia application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Function Categories](#function-categories)
4. [Setup & Configuration](#setup--configuration)
5. [API Reference](#api-reference)
6. [Deployment](#deployment)
7. [Monitoring](#monitoring)

## Overview

Square Trivia is a skill-based trivia game where users answer questions to earn squares on a football grid. Winners are determined by the fastest correct answers when game scores match their square positions.

### Key Features
- **Skill-Based System**: Winners determined by trivia answer speed
- **Multiple Tiers**: $25, $50, $100, $250, $500, $1000 tiers
- **Real-time Game Monitoring**: Automatic score updates via API-Sports
- **Payment Processing**: Stripe integration with instant/batch payouts
- **Telegram Integration**: Bot notifications and group access
- **Admin Dashboard**: Complete management interface

## Architecture

```
├── src/
│   ├── backend-game-functions.js      # Core game logic
│   ├── payment-system-modified.js     # Payment processing
│   ├── user-data-monetization-fixed.js # User management & analytics
│   ├── financial-system-complete.js   # Financial tracking
│   ├── automated-game-monitoring-fixed.js # Live game updates
│   ├── grid-system-complete.js        # Square grid logic
│   ├── constants-configuration-fixed.js # Configuration
│   └── utility-functions-fixed.js     # Helper functions
├── docs/                              # Documentation
└── package.json                       # Dependencies
```

## Function Categories

### 1. Game Management
- **createGame**: Create new games with boards
- **claimSquare**: Claim squares using trivia tokens
- **determineWinners**: Process quarter winners
- **cleanupClaims**: Remove old claims from boards

### 2. Payment Processing
- **createPaymentIntent**: Initialize Stripe payments
- **stripeWebhook**: Handle payment confirmations
- **processInstantPayout**: Instant payouts with 4% fee
- **verifyCheckoutSession**: Verify payment completion

### 3. User Management
- **addTelegramToAccount**: Link Telegram accounts
- **telegramWebhook**: Handle Telegram bot interactions
- **trackUserEvent**: Track user behavior
- **savePayoutDetails**: Save user payout preferences

### 4. Financial System
- **dailyStripeToMercuryReconciliation**: Daily payment reconciliation
- **processTuesdayPayouts**: Batch payouts for Tue-Thu games
- **processFridayPayouts**: Batch payouts for Fri-Mon games
- **generateFinancialReport**: Admin financial reports

### 5. Game Monitoring
- **monitorLiveGames**: Real-time score updates
- **activateUpcomingGames**: Auto-activate scheduled games
- **checkStuckGames**: Monitor for stuck games
- **manualScoreUpdate**: Admin manual score entry

### 6. Analytics & Marketing
- **getBusinessAnalytics**: Business intelligence data
- **runTargetedCampaign**: Marketing campaigns
- **exportAnonymizedData**: GDPR-compliant data export
- **generatePartnerDataFeed**: Partner data sharing

## Setup & Configuration

### Environment Variables
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
REACT_SENDGRID_API_KEY=SG...
REACT_SENDGRID_FROM_EMAIL=noreply@squaretrivia.com

# API Sports
REACT_APP_APISPORTS_KEY=your_api_key

# Telegram
TELEGRAM_BOT_TOKEN=7718801037:...
```

### Firebase Configuration
```json
{
  "functions": {
    "source": ".",
    "runtime": "nodejs18"
  },
  "emulators": {
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "auth": { "port": 9099 }
  }
}
```

## API Reference

See individual function documentation files:
- [Game Functions](./game-functions.md)
- [Payment Functions](./payment-functions.md)
- [User Functions](./user-functions.md)
- [Financial Functions](./financial-functions.md)
- [Monitoring Functions](./monitoring-functions.md)

## Deployment

### Development
```bash
npm run serve  # Start emulators
```

### Production
```bash
npm run deploy  # Deploy to Firebase
```

### Environment-Specific Deployment
```bash
firebase use staging
firebase deploy --only functions

firebase use production
firebase deploy --only functions
```

## Monitoring

### Logs
```bash
npm run logs  # View function logs
firebase functions:log --only functionName
```

### Performance Monitoring
- Function execution times logged automatically
- Slow operations (>1000ms) flagged
- Error tracking with context

### Health Checks
- API-Sports health monitoring every 15 minutes
- Daily financial reconciliation
- Stuck game detection every 30 minutes

## Security

### Authentication
- Firebase Auth integration
- Admin role verification
- Rate limiting on sensitive operations

### Data Protection
- Input validation and sanitization
- GDPR-compliant data export
- Secure random number generation

### Payment Security
- Stripe webhook signature verification
- Replay attack prevention
- PCI compliance through Stripe

## Error Handling

### Standardized Error Responses
```javascript
{
  code: 'invalid-argument',
  message: 'User-friendly error message',
  details: { /* Additional context */ }
}
```

### Retry Logic
- Automatic retries for transient failures
- Exponential backoff for API calls
- Transaction conflict resolution

## Contributing

1. Follow the established patterns in existing functions
2. Add comprehensive error handling
3. Include logging for debugging
4. Update documentation for new functions
5. Test with Firebase emulators before deployment

## Support

For technical support or questions:
- Email: support@squaretrivia.com
- Documentation: This repository
- Issues: GitHub Issues (if applicable)