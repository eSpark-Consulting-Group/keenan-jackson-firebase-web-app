# Game Functions Documentation

This document covers all game-related Firebase Cloud Functions in the Square Trivia application.

## Overview

Game functions handle the core gameplay mechanics including game creation, square claiming, winner determination, and board management.

## Functions

### createGame
**Type**: HTTPS Callable  
**Auth**: Admin required  
**Purpose**: Create a new game with associated boards for each tier

#### Parameters
```javascript
{
  teams: {
    home: "Team Name",
    away: "Team Name"
  },
  gameDate: "2024-01-15T20:00:00Z",
  gameType: "regular", // "regular", "playoff", "championship"
  sport: "NFL", // "NFL", "CFB", "NBA", "NCAA_BB"
  externalGameId: "12345", // API-Sports game ID
  enabledTiers: ["tier_25", "tier_100"], // Array of tier IDs
  week: 1 // Week number for NFL/CFB
}
```

#### Response
```javascript
{
  success: true,
  gameId: "game_doc_id",
  message: "Game created with 2 boards"
}
```

#### Example Usage
```javascript
const createGame = firebase.functions().httpsCallable('createGame');

const result = await createGame({
  teams: { home: "Chiefs", away: "Bills" },
  gameDate: "2024-01-15T20:00:00Z",
  gameType: "playoff",
  sport: "NFL",
  externalGameId: "12345",
  enabledTiers: ["tier_100", "tier_250"],
  week: 18
});
```

---

### claimSquare
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Claim a square on a board using a trivia access token

#### Parameters
```javascript
{
  boardId: "board_doc_id",
  squarePosition: 25, // 0-49
  tokenId: "access_token_id",
  answerTime: 3500 // milliseconds
}
```

#### Response
```javascript
{
  success: true,
  message: "Square claimed successfully",
  squarePosition: 25,
  occupancy: "1/2", // Current occupancy
  currentQuarter: 2
}
```

#### Business Logic
1. Validates access token belongs to user and is unused
2. Checks if square has room (max 2 players per square)
3. Verifies user doesn't already have this square
4. Creates claim record with timing data
5. Updates board square structure
6. Marks token as used

---

### determineWinners
**Type**: Pub/Sub Scheduled  
**Schedule**: Every 2 minutes  
**Purpose**: Process winners for completed quarters

#### Process Flow
1. Fetch all active/completed games
2. Determine which quarters are finished but unprocessed
3. Calculate winning square positions based on score digits
4. Find fastest trivia answer times for contested squares
5. Create winner records and grant consolation prizes
6. Send notifications to winners and losers

#### Winner Determination Logic
```javascript
// Example: Score 21-17
const homeLastDigit = 21 % 10; // 1
const awayLastDigit = 17 % 10; // 7

// Winning positions are squares where:
// - Row represents home digit (1) and column represents away digit (7)
// - Row represents away digit (7) and column represents home digit (1)
```

#### Consolation System
- Losing players get free squares for next games
- Maximum 4 consolation squares per board
- Consolation squares cannot earn additional consolations

---

### cleanupClaims
**Type**: Pub/Sub Scheduled  
**Schedule**: Every 2 minutes  
**Purpose**: Remove old claims and track fastest players

#### Cleanup Logic
1. Remove claims from processed quarters
2. Track fastest answer time per board
3. Award fastest player bonus when game completes
4. Maintain board integrity

---

### validateAnswer
**Type**: HTTPS Callable  
**Auth**: User authentication required  
**Purpose**: Validate trivia answers and generate access tokens

#### Parameters
```javascript
{
  sessionId: "trivia_session_id",
  questionId: "question_id",
  answer: "B", // A, B, C, or D
  answerTime: 3500 // milliseconds
}
```

#### Response
```javascript
{
  correct: true,
  tokenId: "access_token_id",
  message: "Correct! You earned a square token."
}
```

## Data Structures

### Game Document
```javascript
{
  teams: { home: "Chiefs", away: "Bills" },
  gameDate: Timestamp,
  gameType: "playoff",
  sport: "NFL",
  week: 18,
  externalGameId: "12345",
  status: "active", // "scheduled", "active", "completed", "cancelled"
  currentQuarter: 2,
  quarterScores: {
    q1: { home: 7, away: 3, processed: true },
    q2: { home: 14, away: 10, processed: false },
    q3: { home: null, away: null, processed: false },
    q4: { home: null, away: null, processed: false }
  },
  processedQuarters: {
    q1: true,
    q2: false,
    q3: false,
    q4: false
  },
  createdAt: Timestamp,
  createdBy: "admin_user_id"
}
```

### Board Document
```javascript
{
  gameId: "game_doc_id",
  tierId: "tier_100",
  gameType: "playoff",
  squares: {
    "0": {
      claims: [
        {
          userId: "user_id",
          claimId: "claim_id",
          answerTimeSeconds: 3.5
        }
      ],
      isFull: false
    }
  },
  maxPlayersPerSquare: 2,
  consolationSquaresAwarded: 0,
  gameInfo: {
    teams: { home: "Chiefs", away: "Bills" },
    sport: "NFL",
    startTime: Timestamp
  },
  isActive: true,
  createdAt: Timestamp
}
```

### Square Claim Document
```javascript
{
  userId: "user_id",
  boardId: "board_id",
  position: 25,
  triviaAnswerTimeMs: 3500,
  triviaAnswerTimeSeconds: 3.5,
  isConsolationSquare: false,
  sourceWinnerId: null,
  canEarnConsolation: true,
  earnedVia: "trivia", // "trivia", "consolation", "admin"
  accessTokenId: "token_id",
  placedAt: Timestamp,
  isWinner: false,
  winningQuarter: null,
  prizeAmount: 0
}
```

### Winner Document
```javascript
{
  userId: "user_id",
  gameId: "game_id",
  boardId: "board_id",
  claimId: "claim_id",
  position: 25,
  quarter: "q1",
  score: "21-17",
  tierId: "tier_100",
  prizeAmount: 900,
  winnerAnswerTimeMs: 3500,
  winnerAnswerTimeSeconds: 3.5,
  loserUserId: "loser_user_id",
  loserAnswerTimeMs: 4200,
  consolationSquareGranted: true,
  consolationSquareId: "token_id",
  gameInfo: {
    teams: { home: "Chiefs", away: "Bills" },
    sport: "NFL"
  },
  notificationStatus: "pending",
  status: "pending_payout",
  createdAt: Timestamp
}
```

## Error Handling

### Common Errors
- `unauthenticated`: User not logged in
- `permission-denied`: Admin access required
- `invalid-argument`: Invalid parameters
- `not-found`: Game/board/token not found
- `already-exists`: Square already claimed by user
- `resource-exhausted`: Square is full (2/2 players)

### Error Response Format
```javascript
{
  code: "invalid-argument",
  message: "Square is full (2 players maximum)",
  details: {
    squarePosition: 25,
    currentOccupancy: 2,
    maxOccupancy: 2
  }
}
```

## Testing

### Unit Tests
```javascript
// Test winner calculation
const { calculateWinningPositions } = require('./grid-system-complete');

test('calculates winning positions correctly', () => {
  const positions = calculateWinningPositions(21, 17);
  expect(positions).toContain(17); // Row 1 (digit 1), Col 7
  expect(positions).toContain(71); // Row 7 (digit 7), Col 1
});
```

### Integration Tests
```javascript
// Test complete game flow
const testGame = await createGame({
  teams: { home: "Test Home", away: "Test Away" },
  gameDate: new Date().toISOString(),
  gameType: "regular",
  sport: "NFL",
  externalGameId: "test123",
  enabledTiers: ["tier_25"]
});

const board = await getBoard(testGame.gameId, "tier_25");
const token = await generateTestToken(userId, "tier_25");
const claim = await claimSquare({
  boardId: board.id,
  squarePosition: 0,
  tokenId: token.id,
  answerTime: 3000
});

expect(claim.success).toBe(true);
```

## Performance Considerations

### Optimization Strategies
1. **Batch Operations**: Use Firestore batches for multiple updates
2. **Indexing**: Proper indexes for game queries
3. **Caching**: Cache frequently accessed game data
4. **Pagination**: Limit query results for large datasets

### Monitoring
- Function execution time tracking
- Error rate monitoring
- Database read/write metrics
- API call frequency to external services

## Security

### Access Control
- Admin functions require custom claims
- User functions verify token ownership
- Rate limiting on square claiming
- Input validation and sanitization

### Data Integrity
- Transaction-based updates for critical operations
- Validation of game state before processing
- Duplicate prevention mechanisms
- Audit logging for admin actions