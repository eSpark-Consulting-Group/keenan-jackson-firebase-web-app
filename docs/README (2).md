# Square Trivia Documentation

This documentation covers all the source files and functions in the Square Trivia Firebase Cloud Functions project.

## Overview

Square Trivia is a skill-based sports prediction game where users answer trivia questions to earn squares on a grid. Winners are determined by the last digits of game scores, with the fastest trivia answerers winning in case of ties.

## Documentation Structure

Each source file has its own documentation file with detailed information about:

- **Firebase Functions**: Cloud Functions that can be triggered via HTTP, scheduled, or callable
- **Simple Functions**: Regular JavaScript functions used internally
- **Required Parameters**: What each function needs to work properly
- **Return Values**: What each function returns
- **Dependencies**: What constants and configurations are used

## Source Files Documentation

### Core Game Logic
- [`automated-game-monitoring-fixed.md`](./automated-game-monitoring-fixed.md) - Live score updates and API integration
- [`backend-game-functions.md`](./backend-game-functions.md) - Core game functions (creation, claiming, winners)
- [`grid-system-complete.md`](./grid-system-complete.md) - Grid system and winner calculation

### Payment & Financial
- [`payment-system-modified.md`](./payment-system-modified.md) - Payment processing with Stripe
- [`financial-system-complete.md`](./financial-system-complete.md) - Financial tracking and reconciliation

### User Management
- [`user-data-monetization-fixed.md`](./user-data-monetization-fixed.md) - User data collection and Telegram integration

### Configuration & Utilities
- [`constants-configuration-fixed.md`](./constants-configuration-fixed.md) - System constants and configuration
- [`database-schema-complete.md`](./database-schema-complete.md) - Database schemas and security rules
- [`utility-functions-fixed.md`](./utility-functions-fixed.md) - Core utility functions

## Key Features

### Skill-Based System
- Users answer trivia questions to earn squares
- Fastest correct answer wins in case of ties
- Consolation prizes for close losses
- Up to 2 players per square

### Payment Structure
- Multiple tiers: $25, $50, $100, $250, $500, $1000
- 77% payout for lower tiers, 80% for higher tiers
- Instant payouts with 4% fee
- Batch payouts on Tuesdays and Fridays

### Telegram Integration
- Bot commands for game information
- Group access for tier holders
- Real-time notifications
- Enhanced daily trivia attempts (10 vs 5)

### Financial Management
- Stripe payment processing
- Mercury bank reconciliation
- Automated payout batches
- Tax reporting (1099) support

## Getting Started

1. **Environment Setup**: Ensure all environment variables are configured
2. **Firebase Configuration**: Set up Firebase project with proper permissions
3. **API Keys**: Configure API-Sports and other external service keys
4. **Database**: Initialize Firestore with proper security rules and indexes

## Function Categories

### Scheduled Functions
- Game monitoring (every 1-5 minutes)
- Financial reconciliation (daily)
- Payout processing (Tuesdays/Fridays)
- User notifications (every 3 hours)

### Callable Functions
- User actions (claim squares, validate answers)
- Admin functions (create games, process payouts)
- Payment processing (create intents, verify sessions)

### HTTP Functions
- Stripe webhooks
- Telegram bot webhooks
- External API integrations

## Security Considerations

- All admin functions require `context.auth.token.admin`
- User functions require `context.auth` authentication
- Input validation on all user-provided data
- Rate limiting on critical functions
- Secure random number generation for fair play

## Error Handling

- Standardized error responses
- Comprehensive logging
- Retry mechanisms for external API calls
- Transaction safety for database operations

## Performance Optimization

- Distributed counters for high-frequency updates
- Batch operations for bulk updates
- Caching for frequently accessed data
- Efficient database queries with proper indexes

For detailed information about specific functions, refer to the individual documentation files.