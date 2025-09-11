# User Functions Documentation

This document covers all user management and analytics Firebase Cloud Functions in the Square Trivia application.

## Overview

User functions handle account management, Telegram integration, analytics tracking, and marketing automation.

## Functions

### addTelegramToAccount
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Link Telegram account to user profile

#### Parameters
```javascript
{
  userId: "user_id",
  telegramUsername: "@username"
}
```

#### Response
```javascript
{
  success: true,
  message: "Telegram added successfully! +5 daily attempts unlocked 🎉",
  benefits: {
    extraAttempts: 5,
    instantNotifications: true,
    communityAccess: true
  }
}
```

#### Business Logic
1. Validates Telegram username format
2. Updates user profile with Telegram info
3. Grants +5 daily trivia attempts (up to 10 total)
4. Grants Telegram access for all active tiers
5. Sets notification preference to "both"

---

### telegramWebhook
**Type**: HTTPS Request  
**Auth**: Telegram webhook verification  
**Purpose**: Handle Telegram bot interactions

#### Supported Commands
- `/start [userId]` - Link account or greet user
- `/games` - Show available games
- `/wins` - Show user's wins
- `/status` - Show current tier subscriptions
- `/squares` - Show claimed squares
- `/refer` - Show referral code
- `/help` - Show support information
- `/payout` - Show payout status

#### Example Bot Interaction
```
User: /start abc123
Bot: ✅ Bot Connected Successfully!

User: /status
Bot: 📊 Your Current Tiers:
     #1: Tier 100
     #2: Tier 250
     Keep playing and climbing up the tiers! 🚀
```

---

### trackUserEvent
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Track user behavior for analytics

#### Parameters
```javascript
{
  eventType: "game_played", // "game_played", "donation_made", "team_interest"
  eventData: {
    sport: "NFL",
    team: "Chiefs",
    amount: 100
  }
}
```

#### Event Types
- `game_played`: User participated in a game
- `donation_made`: User made a tier purchase
- `team_interest`: User showed interest in specific team
- `square_claimed`: User claimed a square
- `trivia_answered`: User answered trivia question

---

### getBusinessAnalytics
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Get comprehensive business analytics

#### Response
```javascript
{
  userMetrics: {
    totalUsers: 1250,
    activeUsers: 890,
    churnRate: "28.8%",
    segments: {
      "high_roller": 45,
      "nfl_enthusiast": 234,
      "casual": 567
    },
    avgLifetimeValue: 156.78
  },
  revenueMetrics: { /* ... */ },
  engagementMetrics: { /* ... */ },
  monetizationMetrics: { /* ... */ }
}
```

---

### runTargetedCampaign
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Run targeted marketing campaigns

#### Parameters
```javascript
{
  campaignType: "tier_upgrade",
  filters: {
    minDonation: 100,
    segment: "nfl_enthusiast"
  },
  message: "Hey {name}! Upgrade to {tier} tier for playoff games!"
}
```

#### Response
```javascript
{
  success: true,
  targetedUsers: 156,
  campaignType: "tier_upgrade"
}
```

---

### exportAnonymizedData
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Export anonymized data for compliance/analysis

#### Parameters
```javascript
{
  dataType: "market_research" // "market_research", "behavioral_insights", "revenue_analysis"
}
```

#### Response
```javascript
{
  sportPreferences: {
    "NFL": { high: 1250, low: 890 },
    "NBA": { high: 567, low: 234 }
  },
  geographicDistribution: {
    "TX": 234,
    "CA": 189,
    "FL": 156
  },
  seasonalTrends: { /* ... */ }
}
```

---

### savePayoutDetails
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Save user's payout preferences

#### Parameters
```javascript
{
  method: "paypal", // "paypal", "venmo", "zelle", "bank_transfer"
  email: "user@paypal.com",
  accountNumber: "1234567890", // For bank transfers
  routingNumber: "021000021"   // For bank transfers
}
```

#### Response
```javascript
{
  success: true,
  message: "Payout details saved successfully"
}
```

---

### setAdminClaim
**Type**: HTTPS Callable  
**Auth**: None (temporary for initial setup)  
**Purpose**: Set admin custom claims

#### Parameters
```javascript
{
  uid: "user_firebase_uid"
}
```

#### Response
```javascript
{
  success: true,
  message: "Admin claim set for abc123"
}
```

**⚠️ Security Note**: This function should be removed after initial admin setup.

## Scheduled Functions

### sendTriviaAttemptNotifications
**Type**: Pub/Sub Scheduled  
**Schedule**: Every 3 hours  
**Purpose**: Remind users about available trivia attempts

#### Notification Logic
- Send to users with Telegram enabled
- Show remaining daily attempts
- Encourage participation

---

### sendGameReminders
**Type**: Pub/Sub Scheduled  
**Schedule**: Every 3 hours  
**Purpose**: Send game start reminders

#### Reminder Logic
- Notify about games starting today or tomorrow
- Include team names and game details
- Send to all Telegram users

---

### sendPayoutMessages
**Type**: Pub/Sub Scheduled  
**Schedule**: Every 5 minutes  
**Purpose**: Notify winners about completed payouts

#### Process Flow
1. Find winners with completed payouts but unsent notifications
2. Send Telegram message with game details
3. Mark notification as sent

---

### checkCancelledGames
**Type**: Pub/Sub Scheduled  
**Schedule**: Every 5 minutes  
**Purpose**: Check for cancelled games and process refunds

#### Cancellation Logic
1. Check API-Sports for game status
2. If game is cancelled, refund all tier access
3. Restore user's tier access for future games
4. Log cancellation for audit

## Data Structures

### User Document
```javascript
{
  email: "user@example.com",
  telegramUsername: "@username",
  telegramChatId: "123456789",
  hasTelegram: true,
  preferredNotificationMethod: "both", // "email", "telegram", "both"
  
  // Financial data
  totalDonations: 250,
  lifetimeValue: 350,
  currentTiers: ["tier_100", "tier_250"],
  lastDonation: Timestamp,
  
  // Activity tracking
  dailyTriviaAttempts: 10, // 5 base + 5 Telegram bonus
  lastActive: Timestamp,
  loginCount: 45,
  gamesPlayed: 23,
  squaresWon: 8,
  totalWinnings: 1200,
  
  // Skill-based stats
  triviaCorrect: 156,
  triviaIncorrect: 34,
  squaresPlaced: 89,
  
  // Preferences
  notifications: {
    email: true,
    telegram: true,
    sms: false,
    marketing: true
  },
  
  // Payout details
  payoutDetails: {
    method: "paypal",
    email: "user@paypal.com",
    updatedAt: Timestamp
  },
  
  // Segmentation
  segments: ["high_roller", "nfl_enthusiast"],
  
  // System fields
  isAdmin: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### User Event Document
```javascript
{
  userId: "user_id",
  eventType: "game_played",
  eventData: {
    sport: "NFL",
    gameId: "game_id",
    tier: "tier_100",
    result: "won"
  },
  timestamp: Timestamp,
  sessionId: "session_id",
  ip: "192.168.1.1"
}
```

### Marketing Campaign Document
```javascript
{
  userId: "user_id",
  email: "user@example.com",
  campaignType: "tier_upgrade",
  message: "Hey John! Upgrade to $250 tier for playoff games!",
  scheduledFor: Timestamp,
  status: "pending", // "pending", "sent", "failed"
  sentAt: Timestamp,
  openedAt: Timestamp,
  clickedAt: Timestamp
}
```

## User Segmentation

### Automatic Segmentation
Users are automatically segmented based on behavior:

#### Financial Segments
- `vip`: $1000+ total donations
- `high_roller`: $500-999 total donations
- `regular`: $200-499 total donations
- `casual`: Under $200 total donations

#### Sport Segments
- `nfl_enthusiast`: 20+ NFL games played
- `nba_enthusiast`: 20+ NBA games played
- `cfb_enthusiast`: 20+ College Football games played
- `ncaa_bb_enthusiast`: 20+ College Basketball games played

#### Behavioral Segments
- `at_risk`: Inactive for 30+ days
- `churned`: Inactive for 60+ days
- `march_madness`: Active during March Madness
- `nfl_playoff_ready`: High NFL engagement

### Monetization Opportunities
Based on segments, users receive targeted offers:

#### High-Value Users
- DraftKings/FanDuel partnership offers
- Exclusive tier access
- VIP customer support

#### Sport Enthusiasts
- YouTube TV streaming offers
- Team merchandise discounts
- Season ticket promotions

#### Geographic Targeting
- Local team promotions
- Regional sports network offers
- Stadium experience packages

## Analytics & Reporting

### Key Metrics Tracked
- Daily/Monthly Active Users (DAU/MAU)
- Tier conversion rates
- Average revenue per user (ARPU)
- Customer lifetime value (CLV)
- Churn rate by segment
- Engagement by sport/season

### Custom Events
```javascript
// Track custom events
await trackUserEvent({
  eventType: "tier_upgrade",
  eventData: {
    fromTier: "tier_100",
    toTier: "tier_250",
    upgradeReason: "playoff_access"
  }
});
```

### Cohort Analysis
- User retention by signup month
- Revenue cohorts by first purchase
- Engagement patterns by user type

## Privacy & Compliance

### Data Protection
- GDPR-compliant data export
- User data anonymization
- Consent management
- Right to be forgotten

### Data Sharing
- Partner data feeds (anonymized)
- Marketing attribution
- Fraud prevention
- Regulatory compliance

## Error Handling

### Common Errors
```javascript
// Invalid Telegram username
{
  code: "invalid-argument",
  message: "Please enter a valid Telegram username",
  details: { format: "@username (5-32 characters)" }
}

// Rate limiting
{
  code: "resource-exhausted",
  message: "Too many requests. Please slow down.",
  details: { retryAfter: 60 }
}

// Permission denied
{
  code: "permission-denied",
  message: "Admin access required",
  details: { requiredRole: "admin" }
}
```

## Testing

### Unit Tests
```javascript
// Test user segmentation
test('segments high-value users correctly', () => {
  const user = { totalDonations: 1500 };
  const segments = calculateUserSegments(user);
  expect(segments).toContain('vip');
});

// Test Telegram validation
test('validates Telegram username', () => {
  const result = validateTelegramUsername('@validuser');
  expect(result.valid).toBe(true);
  expect(result.value).toBe('@validuser');
});
```

### Integration Tests
```javascript
// Test complete user flow
const user = await createTestUser();
const telegram = await addTelegramToAccount({
  userId: user.id,
  telegramUsername: '@testuser'
});

expect(telegram.success).toBe(true);
expect(telegram.benefits.extraAttempts).toBe(5);
```

## Monitoring

### Performance Metrics
- Function execution times
- Database query performance
- External API response times
- Error rates by function

### Business Metrics
- User acquisition cost
- Conversion rates
- Revenue per user
- Support ticket volume

### Alerts
- High error rates
- Unusual user behavior
- Failed integrations
- Performance degradation