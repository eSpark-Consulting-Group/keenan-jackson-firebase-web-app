
// =====================================
// CONSTANTS - Configure these during deployment
// =====================================

// Payment tier configuration with payout percentages
const TIER_CONFIG = {
  tier_25: { amount: 25, name: "$25 Tier", payoutPercentage: 0.64 },
  tier_50: { amount: 50, name: "$50 Tier", payoutPercentage: 0.64 },
  tier_100: { amount: 100, name: "$100 Tier", payoutPercentage: 0.64 },
  tier_250: { amount: 250, name: "$250 Tier", payoutPercentage: 0.72 },
  tier_500: { amount: 500, name: "$500 Tier", payoutPercentage: 0.72 },
  tier_1000: { amount: 1000, name: "$1000 Tier", payoutPercentage: 0.72 },
};

// Game type definitions - Configure based on your league structure
const GAME_TYPES = {
  REGULAR: "regular", // Regular season games
  PLAYOFF: "playoff", // Playoff games
  CHAMPIONSHIP: "championship", // Championship/Super Bowl games
};

// Tier availability by game type - Configure based on business rules
const TIER_AVAILABILITY = {
  [GAME_TYPES.REGULAR]: ["tier_25", "tier_50", "tier_100"],
  [GAME_TYPES.PLAYOFF]: [
    "tier_25",
    "tier_50",
    "tier_100",
    "tier_250",
    "tier_500",
  ],
  [GAME_TYPES.CHAMPIONSHIP]: [
    "tier_25",
    "tier_50",
    "tier_100",
    "tier_250",
    "tier_500",
    "tier_1000",
  ],
};

// Payment processing constants
const INSTANT_PAYOUT_FEE = 0.08; // 8% fee for instant payouts
const BATCH_PAYOUT_DAYS = ["tuesday", "friday"];

// API Sports configuration - Add your API keys during deployment
const API_SPORTS_CONFIG = {
  NFL: {
    endpoint: "/v3/nfl/scores/json/ScoresByWeek",
    leagueId: 1,
  },
  CFB: {
    endpoint: "/v3/cfb/scores/json/GamesByWeek",
  },
};

module.exports = {
  TIER_CONFIG,
  GAME_TYPES,
  TIER_AVAILABILITY,
  INSTANT_PAYOUT_FEE,
  BATCH_PAYOUT_DAYS,
  API_SPORTS_CONFIG,}