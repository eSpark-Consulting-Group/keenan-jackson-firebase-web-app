# Square Trivia - Complete App Explainer Guide

## 🎯 Executive Summary

**Square Trivia** is a skill-based sports trivia competition platform where participants earn squares on game boards by answering trivia questions quickly and correctly. Winners are determined purely by their trivia answer speed - the fastest correct answer wins when squares match game scores.

**Key Innovation:** Unlike traditional squares games based on luck, Square Trivia rewards knowledge and quick thinking, making it a legal skill-based competition.

---

## 🎮 How It Works - Simple Overview

1. **Players donate** to support the platform and gain access to exclusive Telegram groups
2. **Players answer trivia questions** about sports - correct answers earn square tokens
3. **Players claim squares** on game boards (max 2 players per square)
4. **When game scores match** square numbers, the player with the **fastest trivia answer time wins**
5. **Losers receive consolation prizes** (free squares for future games)

---

## 🏗️ Core Features & Mechanics

### 1. **Skill-Based Competition System**

**The Revolutionary Difference:**

- Traditional squares: Random winner based on score
- Square Trivia:**Fastest trivia answer wins** - 100% skill-based

**Answer Time Privacy:**

- Answer times are **hidden** until a square wins
- Players can see their own times but not others'
- Creates suspense and prevents gaming the system

### 2. **Tiered Access System**

Six donation tiers with guaranteed contest prizess - NO FEES:

| Tier | Entry | Prize Per Quarter | Total Prizes | Available In |
|------|-------|-------------------|--------------|--------------|
| 🟢 Tier 1 | $25 | $200 | $800 | All games |
| 🔵 Tier 2 | $50 | $450 | $1,800 | All games |
| 🟡 Tier 3 | $100 | $900 | $3,600 | All games |
| 🟣 Tier 4 | $250 | $2,250 | $9,000 | Playoffs & Championships |
| 🟠 Tier 5 | $500 | $4,500 | $18,000 | Playoffs & Championships |
| 🔴 Tier 6 | $1000 | $9,000 | $36,000 | Championships only |

### 3. **Game Board System**

**Board Structure:**

- 50 squares (10×5 grid)
- Each square can hold **2 players maximum**

- 100 total player slots per board

**Square Assignment:**

- Squares are numbered 0-49 or use (row,column) notation
- Winners determined by last digit of each team's score
- **IMPORTANT: Digit order doesn't matter!**
  - Square (3,7) wins with scores 13-17 OR 17-13
  - Square (0,5) wins with scores 20-15 OR 15-20
  - Each square has two chances to win per quarter
- Winners determined each quarter

### 4. **Trivia Challenge System**

**Question Flow:**

1. Player requests trivia challenge
2. System presents sport-specific question
3. Timer starts when question appears
4. Player submits answer
5. If correct → receive square token
6. Token valid for 48 hours

**Question Difficulty:**

- Scales with tier (higher tiers = harder questions)
- Categories: Rules, History, Stats, Players, Records
- Pool of 1000+ questions per sport

### 5. **Winner Determination**

**When Squares Win:**

- End of each quarter, check score
- Example: Score is 14-7 → Square at position (4,7) wins
- Both players on that square compete
- **Fastest trivia answer time wins the prize**

**Prize Distribution:**

- Guaranteed fixed prizes each quarter (no calculations needed!)
- Instant payout: Get 96% of prize immediately
- Standard payout: Full prize amount in 2-3 days
- NO FEES on entry or prizes - only optional instant payout fee

### 6. **Consolation System**

**Protecting Player Engagement:**

- **ONLY for players who lose speed competitions on WINNING squares**

- If your square's numbers match the score BUT you had the slower answer time, you get consolation
- Consolation prizes by tier:
  - **$25, $50, $100 tiers:** Get 1 free $25 trivia question
  - **$250, $500 tiers:** Get 2 free $25 trivia questions
  - **$1000 tier:** Get 4 free $25 trivia questions
- No payment required for consolation questions
- If answered correctly, get a square on a $25 tier board
- Valid for 30 days
- **IMPORTANT: Consolation squares CANNOT earn more consolation prizes**
  - If you lose on a consolation square, you get nothing
  - Prevents infinite free squares
- Maximum 4 consolation squares awarded per board
- **NOT for non-winning squares** - only for speed competition losers

---

## 👤 User Journey - Step by Step

### New User Flow

1. **Landing Page** → Learn about skill-based competition
2. **Registration** → Email, optional Telegram/phone
3. **Choose Tier** → Select donation amount
4. **Payment** → Stripe checkout
5. **Telegram Invite** → Join tier-specific group
6. **Dashboard Access** → View available games

### Playing Flow

1. **View Boards** → See upcoming games and guaranteed prizes
2. **Request Trivia** → Click "Play Trivia"
3. **Answer Question** → Beat the clock!
4. **Claim Square** → Choose position (if available)
5. **Wait for Game** → Watch live scores
6. **Get Notified** → Instant notification if you win
7. **Choose Payout** → Instant (96%) or standard (100%)

### Winning Flow

1. **Win Notification** → Email/Telegram alert with prize amount
2. **View Details** → See your winning time vs opponent
3. **Payout Choice** →
   - Instant: Get 96% immediately
   - Standard: Get 100% in 2-3 days
4. **Receive Funds** → Via chosen method
5. **Tax Forms** → W-9 if over $600 annually

---

## 💻 Technical Architecture

### Frontend

- **Framework:** React.js
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **Hosting:** Firebase Hosting

### Backend

- **Runtime:** Node.js
- **Functions:** Firebase Cloud Functions
- **Database:** Cloud Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage

### Integrations

- **Payments:** Stripe (donations & payouts)
- **Sports Data:** API-Sports (live scores)
- **Notifications:** Telegram Bot API
- **Email:** Nodemailer with Gmail
- **Batch Payouts:** Relay (Tuesday/Friday batches)

### Security

- **Answer Times:** Encrypted until reveal
- **Firestore Rules:** Role-based access
- **Payment Security:** PCI compliant via Stripe
- **Rate Limiting:** Prevent abuse
- **Input Validation:** All user inputs sanitized

---

## 💰 Business Model & Economics

### Revenue Streams

1. **Platform Operations:**
   - Built into the guaranteed prize structure
   - No visible fees to users
   - "NO FEES" marketing advantage

2. **Instant Payout Service:**
   - 4% convenience fee (optional)
   - Players choose: wait for full amount or get 96% instantly
   - Positioned as premium service, not a fee

3. **Future Revenue:** (Planned)
   - Premium features
   - Special event games
   - Corporate tournaments

### Prize Structure

**Example $25 Tier Board:**

- Entry: $25 per square
- Guaranteed prizes: $200 per quarter
- Total contest prizes: $800 (4 quarters)
- Clear, simple, no math needed!

**Example $100 Tier Board:**

- Entry: $100 per square
- Guaranteed prizes: $900 per quarter
- Total contest prizes: $3,600
- Users love the transparency!

**Payout Options:**

1. **Instant:** 96% of prize (4% service fee)
   - Example: $200 win = $192 instant
2. **Standard:** 100% of prize (2-3 days)
   - Example: $200 win = $200 full amount

### Key Messaging

- "NO FEES on playing or winning!"
- "Guaranteed prize amounts every game"
- "Choose instant or full payout"

### Operational Costs

- Firebase: ~$25-100/month
- Stripe: 2.9% + $0.30 per transaction
- API-Sports: $24/month
- Telegram: Free
- Email: Free (Gmail limits)

---

## 🛡️ Legal & Compliance

### Skill-Based Classification

- **No gambling license required** (skill-based)
- Winners determined by ability, not chance
- Free entry option (AMOE) available, except in Restricted States (AZ, TN, MD, or LA.)
- Legal precedent: Similar to trivia competitions

### Tax Compliance

- W-9 collection for $600+ annual winners
- 1099 forms issued
- Automatic tax tracking per user

### Terms of Service Include

- 18+ only
- US residents only
- One account per person
- No proxy playing
- Skill-based competition disclosure

---

## 👨‍💼 Admin Features

### Game Management

- Create games with API-Sports integration
- Manual score override capability
- Cancel/postpone games
- View all active boards

### User Management

- View user profiles and history
- Ban/unban capabilities
- Manual square assignments
- Refund processing

### Financial Management

- Payout queue management
- Relay CSV export (batch payouts)
- Revenue reporting
- Fee tracking

### Monitoring

- Real-time error tracking
- API health monitoring
- User activity analytics
- Performance metrics

### Support Tools

- User lookup
- Transaction history
- Manual notifications
- Trivia question management

---

## 📱 Platform Features by Interface

### Web Application

- Full gameplay
- Account management  
- Payment processing
- Board visualization
- Real-time updates

### Telegram Integration

- Game notifications
- Quick stats
- Community chat
- Winner announcements
- Support bot

### Email System

- Welcome sequences
- Donation confirmations
- Winner notifications
- Payout confirmations
- Weekly summaries

---

## 🎯 Unique Selling Points

1. **100% Skill-Based** - No luck involved
2. **NO FEES** - Guaranteed prize amounts, no hidden costs
3. **Answer Time Privacy** - Hidden until win
4. **Fixed Prizes** - Know exactly what you're playing for
5. **Smart Consolation System** - Higher tiers get more chances, but no infinite loops
6. **Multiple Sports** - NFL, NBA, NCAA
7. **Instant Payouts** - Get money same day (optional)
8. **Free Entry Option** - Legal compliance
9. **Transparent Scoring** - See all answer times after
10. **Fair Competition** - Max 2 per square

---

## 📈 Growth Features

### Referral System

- Both parties get $25 credit
- Unique referral codes
- Automatic tracking

### Achievements: (Planned)

- Speed badges
- Win streaks  
- Sport expertise levels
- Leaderboards

### Special Events: (Planned)

- Tournament mode
- Head-to-head challenges
- Season-long competitions
- VIP tiers

---

## 🚀 Future Roadmap

### Phase 1 (Current)

- ✅ Core gameplay
- ✅ Payment system
- ✅ Basic notifications
- ✅ Manual admin tools

### Phase 2 (Next 3 months)

- Mobile app
- Advanced analytics
- Automated customer support
- More payment methods

### Phase 3 (6 months)

- Multiple countries
- Cryptocurrency payouts
- Custom corporate games
- AI-powered question generation

### Phase 4 (1 year)

- White-label solution
- API for partners
- Season passes
- Loyalty rewards

---

## ❓ Frequently Asked Questions

**Q: How is this different from gambling?**
A: Winners are determined by skill (trivia speed), not random chance. It's like a timed quiz competition with prizes.

**Q: Are there any fees?**
A: NO! There are no fees to play or win. Prizes are guaranteed fixed amounts. The only optional fee is 4% if you choose instant payout instead of waiting 2-3 days for the full amount.

**Q: How much can I win?**
A: It depends on your tier:

- $25 tier: Win $200 per quarter
- $50 tier: Win $450 per quarter  
- $100 tier: Win $900 per quarter
- And higher tiers have even bigger prizes!

**Q: Can I play for free?**
A: Yes! We offer a free mail-in entry option (AMOE), except in Restricted States (AZ, TN, MD, or LA.) that provides the same access as paid players.

**Q: How fast do I need to answer?**
A: Average winning times are 2-5 seconds. Practice makes perfect!

**Q: What if two players have the same time?**
A: Measured to milliseconds. True ties split the prize.

**Q: Can I see others' answer times?**
A: Only after a square wins. This prevents strategic avoidance of fast players.

**Q: What happens if I lose?**
A: If you were on a WINNING square but had the slower answer time, you get consolation prizes! Free $25 tier trivia questions based on your original tier:

- $25-$100 tiers: 1 free question
- $250-$500 tiers: 2 free questions  
- $1000 tier: 4 free questions
Answer correctly to claim squares on $25 boards!

**IMPORTANT:** Consolation squares cannot win more consolation prizes. If you lose on a free square, that's it - no additional consolation.

**Q: How many squares can I get?**
A: Maximum 3 squares per board through trivia, plus any consolation squares.

**Q: How do I know if my square wins?**
A: Your square wins if its numbers match the last digits of the score in ANY order. For example, square (2,7) wins with scores like 12-17, 17-12, 22-7, 7-32, etc. Each square has two ways to win!

**Q: How do I know if my square wins?**
A: Your square wins if its numbers match the last digits of the score in ANY order. For example, square (2,7) wins with scores like 12-17, 17-12, 22-7, 7-32, etc. Each square has two ways to win!

**Q: When do I get paid?**
A: Choose instant (same day, 4% fee) or standard (2-3 days, no fee).

**Q: Is this legal?**
A: Yes! Skill-based competitions are legal in most US states. Check your local laws.

---

## 📞 Support & Resources

### For Players

- Email: [support@squaretrivia.com](mailto:support@squaretrivia.com)
- Telegram: @SquareTriviaSupport
- FAQ: squaretrivia.com/help

### For Developers

- GitHub: [Repository Link](https://github.com)
- API Docs: [Documentation Link](https://github.com)
- Firebase Console: [Console Link](https://github.com)

### For Partners

- Business: [partners@squaretrivia.com](mailto:partners@squaretrivia.com)
- White-label: [enterprise@squaretrivia.com](mailto:enterprise@squaretrivia.com)

---

## 🔧 Implementation Notes for Developer (Nishant)

### Key Changes from Original Code

1. **Prize Calculation Updates:**
   - Remove all percentage-based calculations from UI
   - Use fixed prize amounts per quarter:
     - $25 tier → $200/quarter
     - $50 tier → $450/quarter
     - $100 tier → $900/quarter
     - $250 tier → $2,250/quarter
     - $500 tier → $4,500/quarter
     - $1000 tier → $9,000/quarter

2. **CRITICAL: Percentage Handling**
   - **Backend Code:** Keep percentage calculations for internal revenue tracking
   - **User Interface:** NEVER show percentages, fees, or calculations
   - **Marketing:** Only show flat guaranteed prize amounts
   - The math exists in code but is completely hidden from users

3. **Internal Calculations (KEEP IN CODE, HIDE FROM UI):**

```javascript
// This stays in backend for calculations:
const TIER_MARGINS = {
  tier_25: 0.36,  // 36% margin after $800 prizes
  tier_50: 0.28,  // 28% margin after $1,800 prizes
  tier_100: 0.28, // 28% margin after $3,600 prizes
  // etc...
}

// But users ONLY see:
const TIER_DISPLAY = {
  tier_25: "Win $200 per quarter!",
  tier_50: "Win $450 per quarter!",
  // etc...
}
```

1. **UI/UX Changes:**

   - Remove ALL mentions of fees or percentages from user-facing components
   - Add "NO FEES" badges/messaging throughout
   - Show guaranteed prize amounts prominently
   - Update all marketing copy to emphasize fee-free structure

1. **Consolation Prize Updates:**

   - **CRITICAL: Only award consolation to speed competition losers on WINNING squares**
   - ALL consolation prizes are for $25 tier boards only
   - Award free trivia questions based on losing tier:
     - $25/$50/$100 losers → 1 free $25 trivia question
     - $250/$500 losers → 2 free $25 trivia questions
     - $1000 losers → 4 free $25 trivia questions
   - **CRITICAL: Consolation squares CANNOT win more consolation**
     - Track if a square was claimed via consolation
     - If consolation square loses, NO additional consolation
     - Prevents infinite free squares
   - Update consolation flow to:
     1. Check if square won (numbers match score)
     2. Identify faster player (winner) and slower player (loser)
     3. Check if loser's square was a consolation square
     4. Award consolation ONLY if NOT already a consolation square
     5. Players on non-winning squares get nothing

1. **Constants to Update:**

```javascript
// Instead of:
TIER_25: { amount: 25, payoutPercentage: 0.77 }

// Use:
TIER_25: { 
  amount: 25,
  prizePerQuarter: 200,
  totalPrizes: 800,
  displayName: "$25 Tier - Win $200/Quarter!",
  internalMargin: 0.36, // NEVER SHOW TO USERS
  consolationQuestions: 1
}

// Database schema for squares should include:
square: {
  position: 14,
  players: [...],
  isConsolationSquare: false, // TRACK THIS!
  claimedVia: 'paid' // or 'consolation'
}
```

1. **Key Marketing Messages to Implement:**

   - "NO FEES - Guaranteed Prizes!"
   - "Play for $X in prizes" (not percentages)
   - "Choose instant payout or full amount"
   - "The only fee-free sports squares platform"

1. **Winner Calculation Logic (IMPORTANT):**

   ```javascript
   // Square (1,4) wins if:
   // - Away: X1, Home: X4 (last digits 1,4)
   // - Away: X4, Home: X1 (last digits 4,1)
   
   function checkWinningSquare(square, awayScore, homeScore) {
     const awayLastDigit = awayScore % 10;
     const homeLastDigit = homeScore % 10;
     
     return (
       (square.row === awayLastDigit && square.col === homeLastDigit) ||
       (square.row === homeLastDigit && square.col === awayLastDigit)
     );
   }
   ```

1. **Consolation Logic (CRITICAL):**

   ```javascript
   function awardConsolation(losingPlayer, winningSquare) {
     // Check if this was already a consolation square
     if (winningSquare.isConsolationSquare) {
       // NO CONSOLATION FOR CONSOLATION SQUARES
       return null;
     }
     
     // Award based on original tier
     const consolationQuestions = {
       tier_25: 1,
       tier_50: 1,
       tier_100: 1,
       tier_250: 2,
       tier_500: 2,
       tier_1000: 4
     };
     
     return {
       userId: losingPlayer.id,
       questionsAwarded: consolationQuestions[losingPlayer.originalTier],
       forTier: 'tier_25' // All consolation is for $25 boards
     };
   }
   ```

1. **Payout Flow Updates:**

    - Show both options clearly at winner notification
    - Frame instant as "express service" not "fee"
    - Emphasize full amount available with standard option

---

## 🎉 Summary

Square Trivia revolutionizes the traditional squares game by making it 100% skill-based with NO FEES on entry or prizes. Players compete with their sports knowledge and quick thinking for guaranteed, fixed prize amounts. With features like answer time privacy, consolation prizes, and optional instant payouts, it creates an engaging, fair, and legal competition platform that rewards true sports fans.

**The Bottom Line:** If you know sports and can think fast, you can win - and keep your full prize!
