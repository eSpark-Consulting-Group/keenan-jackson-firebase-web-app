# Grid System Documentation

This module handles the grid system and winner calculation for the skill-based Square Trivia system.

## Firebase Functions
*This module contains no Firebase Functions - it provides utility functions for other modules*

## Simple Functions

### `calculateWinningPositions(homeScore, awayScore)`
**Description:** Calculates winning square positions based on final score digits
**Parameters:**
- `homeScore` (number) - Home team score
- `awayScore` (number) - Away team score
**Returns:** Array of winning position numbers

### `getPositionDisplay(position)`
**Description:** Gets display information for a square position
**Parameters:**
- `position` (number) - Square position (0-49)
**Returns:** Object with position details including row, col, digits, and label

### `getPositionsForDigits(homeDigit, awayDigit)`
**Description:** Gets all positions that could win with specific score digits
**Parameters:**
- `homeDigit` (number) - Home team last digit (0-9)
- `awayDigit` (number) - Away team last digit (0-9)
**Returns:** Array of position objects with descriptions

### `getAvailablePositions(board, userId)`
**Description:** Gets available positions on a board (skill-based: positions with < 2 players)
**Parameters:**
- `board` (Object) - Board data object
- `userId` (string, optional) - User ID to check existing claims
**Returns:** Array of available position numbers

### `assignRandomSquare(db, userId, boardId, accessTokenId, tokenData)`
**Description:** Randomly assigns an available square to a user (skill-based version)
**Parameters:**
- `db` (Firestore) - Database instance
- `userId` (string) - User document ID
- `boardId` (string) - Board document ID
- `accessTokenId` (string) - Access token ID
- `tokenData` (Object) - Token data including answer time
**Returns:** Promise resolving to assignment result

### `selectSquare(db, userId, boardId, position, accessTokenId, tokenData)`
**Description:** Allows user to select a specific square (skill-based version)
**Parameters:**
- `db` (Firestore) - Database instance
- `userId` (string) - User document ID
- `boardId` (string) - Board document ID
- `position` (number) - Desired square position
- `accessTokenId` (string) - Access token ID
- `tokenData` (Object) - Token data including answer time
**Returns:** Promise resolving to selection result

### `processQuarterWinners(db, gameId, quarter, score, gameData)`
**Description:** Processes winners for a specific quarter (skill-based version)
**Parameters:**
- `db` (Firestore) - Database instance
- `gameId` (string) - Game document ID
- `quarter` (string) - Quarter identifier (q1, q2, q3, q4)
- `score` (Object) - Score object with home and away values
- `gameData` (Object) - Game data object
**Returns:** Promise resolving to array of winner objects

### `grantConsolationSquare(db, grant)`
**Description:** Grants consolation square to losing player
**Parameters:**
- `db` (Firestore) - Database instance
- `grant` (Object) - Grant object with winner/loser details
**Returns:** Promise resolving to consolation grant result

### `generateTestBoard(fillPercentage)`
**Description:** Generates test board with skill-based squares for testing
**Parameters:**
- `fillPercentage` (number, optional) - Percentage of squares to fill (default 0.5)
**Returns:** Test board object with mock data

### `testSkillBasedWinners()`
**Description:** Tests winner calculation with skill-based system scenarios
**Parameters:** None
**Returns:** Logs test results to console

## React Components

### `UserSquareGrid`
**Description:** Visual grid component for users (skill-based version)
**Props:**
- `board` (Object) - Board data
- `currentUserId` (string) - Current user ID
- `onSquareClick` (Function) - Square click handler
- `allowSelection` (boolean) - Whether to allow square selection
**Features:**
- Shows square occupancy (0/2, 1/2, 2/2)
- Highlights user's squares
- Displays skill-based competition explanation

### `AdminSquareGrid`
**Description:** Admin grid component with extra features (skill-based version)
**Props:**
- `board` (Object) - Board data
- `onSquareClick` (Function) - Square click handler
**Features:**
- Test winner calculation with score input
- Shows answer times for each claim
- Detailed square information display

## Grid Configuration

### `GRID_CONFIG`
**Description:** Grid layout configuration
**Properties:**
- `TOTAL_SQUARES` (50) - Total squares on board
- `ROWS` (5) - Number of rows
- `COLS` (10) - Number of columns
- `ROW_DIGITS` - Mapping of rows to score digits
- `COL_DIGITS` - Mapping of columns to score digits

## Helper Functions

### `getSquareStatus(position)`
**Description:** Gets status of a square (available, partial, full, mine)
**Parameters:**
- `position` (number) - Square position
**Returns:** String status

### `getSquareColor(status)`
**Description:** Gets CSS classes for square based on status
**Parameters:**
- `status` (string) - Square status
**Returns:** String of CSS classes

### `getSquareText(position)`
**Description:** Gets display text for square
**Parameters:**
- `position` (number) - Square position
**Returns:** String to display in square

## Constants Used
- `GRID_CONFIG` - Grid layout and digit mapping
- `GAME_CONFIG` - Game configuration constants
- `VALIDATION_RULES` - Input validation rules
- `ERROR_MESSAGES` - Error message constants
- Skill-based system constants for timing and consolation