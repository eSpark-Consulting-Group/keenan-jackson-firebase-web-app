import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR-API-KEY",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "YOUR-PROJECT.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR-PROJECT-ID",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR-PROJECT.appspot.com",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR-SENDER-ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR-APP-ID",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "YOUR-MEASUREMENT-ID",
};

console.log(firebaseConfig, "firebaseConfig");

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Initialize Analytics only in production
let analytics = null;
if (process.env.NODE_ENV === "production") {
  analytics = getAnalytics(app);
}
export { analytics };

// Connect to emulators in development
if (
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_USE_EMULATORS === "true"
) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199);
}

// Helper function to call Firebase Functions
export const callFunction = async (functionName, data = {}) => {
  try {
    const func = httpsCallable(functions, functionName);
    const result = await func(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    throw error;
  }
};

// Collection references
export const collections = {
  users: "users",
  games: "games",
  boards: "boards",
  donations: "donations",
  winners: "winners",
  trivia: "trivia",
  accessTokens: "accessTokens",
  squareClaims: "squareClaims",
  notifications: "notifications",
  payouts: "payouts",
  referrals: "referrals",
  triviaAttempts: "triviaAttempts",
};

// Board configuration (matches backend)
export const TIERS = {
  TIER_25: {
    id: "tier_25",
    amount: 25,
    name: "$25 Board",
    color: "bg-green-600",
    prizePerQuarter: 200,
    totalPrize: 800,
    description: "Win $200 per quarter!",
  },
  TIER_50: {
    id: "tier_50",
    amount: 50,
    name: "$50 Board",
    color: "bg-blue-600",
    prizePerQuarter: 450,
    totalPrize: 1800,
    description: "Win $450 per quarter!",
  },
  TIER_100: {
    id: "tier_100",
    amount: 100,
    name: "$100 Board",
    color: "bg-purple-600",
    prizePerQuarter: 900,
    totalPrize: 3600,
    description: "Win $900 per quarter!",
  },
  TIER_250: {
    id: "tier_250",
    amount: 250,
    name: "$250 Board",
    color: "bg-yellow-600",
    prizePerQuarter: 2250,
    totalPrize: 9000,
    description: "Win $2,250 per quarter!",
  },
  TIER_500: {
    id: "tier_500",
    amount: 500,
    name: "$500 Board",
    color: "bg-red-600",
    prizePerQuarter: 4500,
    totalPrize: 18000,
    description: "Win $4,500 per quarter!",
  },
  TIER_1000: {
    id: "tier_1000",
    amount: 1000,
    name: "$1000 Board",
    color: "bg-gray-800",
    prizePerQuarter: 9000,
    totalPrize: 36000,
    description: "Win $9,000 per quarter!",
  },
};

// Game configuration
export const GAME_CONFIG = {
  SQUARES_PER_BOARD: 50,
  MAX_PLAYERS_PER_SQUARE: 2,
  MAX_SQUARES_PER_USER: 3,
  TRIVIA_TIME_LIMIT: 30, // seconds
  TOKEN_EXPIRY_HOURS: 48,
  CONSOLATION_TOKEN_EXPIRY_DAYS: 30,
};

// Instant payout configuration
export const INSTANT_PAYOUT_FEE = 0.04; // 4%

// Helper to get board by ID
export const getTierById = (tierId) => {
  return Object.values(TIERS).find((tier) => tier.id === tierId) || null;
};

// Helper to format currency
export const formatCurrency = (amount) => {
  if (isNaN(amount)) {
    return "$0";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default app;
