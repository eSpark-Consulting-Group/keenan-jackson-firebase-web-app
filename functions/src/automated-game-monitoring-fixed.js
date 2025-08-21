// Square Trivia - Automated Game Monitoring System
// Handles live score updates, API integration, and fallback mechanisms
require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
// const db = admin.firestore();


const {
  SPORTS_CONFIG,
  GAME_CONFIG,
  API_CONFIG,
  ERROR_MESSAGES,
  FEATURE_FLAGS,
  VALIDATION_RULES,
} = require("./constants-configuration-fixed");

const {
  getTimestamp,
  getNow,
  retryOperation,
  logError,
  safeTransaction,
  measurePerformance,
  createError,
} = require("./utility-functions-fixed.js");

const { processQuarterWinners } = require("./grid-system-complete.js");

// =====================================
// API-SPORTS SERVICE
// =====================================

class ApiSportsService {
  constructor() {
    this.apiKey = functions.config()?.apisports?.key || process.env.APISPORTS_KEY;
    this.requestCount = 0;
    this.lastRequestTime = null;
  }

  /**
   * Get API headers
   */
  getHeaders(sport) {
    const config = SPORTS_CONFIG[sport];
    return {
      "x-rapidapi-key": this.apiKey,
      "x-rapidapi-host": config.apiHost,
    };
  }

  /**
   * Make API request with retry logic
   */
  async makeRequest(
    url,
    headers,
    retries = API_CONFIG.API_SPORTS.RETRY_ATTEMPTS
  ) {
    return await retryOperation(
      async () => {
        // Log API call in debug mode
        if (FEATURE_FLAGS.LOG_API_CALLS) {
          console.log(`API-Sports request: ${url}`);
        }

        const response = await axios.get(url, {
          headers,
          timeout: API_CONFIG.API_SPORTS.TIMEOUT,
        });

        this.requestCount++;
        this.lastRequestTime = Date.now();

        if (response.data.errors?.length > 0) {
          throw new Error(
            `API-Sports error: ${JSON.stringify(response.data.errors)}`
          );
        }

        return response.data;
      },
      retries,
      API_CONFIG.API_SPORTS.RETRY_DELAY
    );
  }

  /**
   * Fetch game score from API-Sports
   */
  async fetchGameScore(apiSportsId, sport) {
    if (!apiSportsId) {
      throw new Error("No API Sports ID provided");
    }

    // Use mock data in test mode
    if (FEATURE_FLAGS.MOCK_API_SPORTS) {
      return this.getMockGameData(apiSportsId, sport);
    }

    const config = SPORTS_CONFIG[sport];
    if (!config) {
      throw new Error(`Unknown sport: ${sport}`);
    }

    const url = `https://${config.apiHost}${config.endpoint}?id=${apiSportsId}`;
    const headers = this.getHeaders(sport);

    try {
      const data = await this.makeRequest(url, headers);

      if (!data.response || data.response.length === 0) {
        throw new Error("Game not found in API response");
      }

      return this.parseGameData(data.response[0], sport);
    } catch (error) {
      logError(error, {
        context: "fetchGameScore",
        apiSportsId,
        sport,
      });
      throw error;
    }
  }

  /**
   * Parse API response into standard format
   */
  parseGameData(apiGame, sport) {
    const isBasketball = sport === "NBA" || sport === "NCAA_BB";

    // Extract quarter scores
    const quarterScores = {
      q1: {
        home: apiGame.scores?.home?.quarter_1 || null,
        away: apiGame.scores?.away?.quarter_1 || null,
      },
      q2: {
        home: apiGame.scores?.home?.quarter_2 || null,
        away: apiGame.scores?.away?.quarter_2 || null,
      },
      q3: {
        home: apiGame.scores?.home?.quarter_3 || null,
        away: apiGame.scores?.away?.quarter_3 || null,
      },
      q4: {
        home: apiGame.scores?.home?.quarter_4 || null,
        away: apiGame.scores?.away?.quarter_4 || null,
      },
    };

    // Check for overtime
    if (apiGame.scores?.home?.over_time) {
      quarterScores.ot = {
        home: apiGame.scores.home.over_time,
        away: apiGame.scores.away.over_time,
      };
    }

    // Determine game status
    let gameStatus = "unknown";
    const statusMap = {
      NS: "scheduled", // Not Started
      Q1: "active", // 1st Quarter
      Q2: "active", // 2nd Quarter
      Q3: "active", // 3rd Quarter
      Q4: "active", // 4th Quarter
      OT: "active", // Overtime
      HT: "active", // Halftime
      FT: "completed", // Full Time
      AOT: "completed", // After Overtime
      PST: "cancelled", // Postponed
      CANC: "cancelled", // Cancelled
      SUSP: "cancelled", // Suspended
    };

    gameStatus = statusMap[apiGame.status?.short] || "unknown";

    return {
      apiSportsId: apiGame.id,
      status: gameStatus,
      currentPeriod: apiGame.periods?.current || 0,
      quarterScores,
      totalScore: {
        home: apiGame.scores?.home?.total || 0,
        away: apiGame.scores?.away?.total || 0,
      },
      teams: {
        home: apiGame.teams?.home?.name || "",
        away: apiGame.teams?.away?.name || "",
      },
      startTime: apiGame.date ? new Date(apiGame.date) : null,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Get mock data for testing
   */
  getMockGameData(apiSportsId, sport) {
    return {
      apiSportsId,
      status: "active",
      currentPeriod: 2,
      quarterScores: {
        q1: { home: 7, away: 3 },
        q2: { home: 14, away: 10 },
        q3: { home: null, away: null },
        q4: { home: null, away: null },
      },
      totalScore: { home: 21, away: 13 },
      teams: { home: "Test Home", away: "Test Away" },
      startTime: new Date(),
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const url = "https://v1.american-football.api-sports.io/status";
      const headers = this.getHeaders("NFL");
      const response = await axios.get(url, { headers, timeout: 5000 });

      return {
        healthy: true,
        requestsUsed: this.requestCount,
        lastRequest: this.lastRequestTime,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const apiSportsService = new ApiSportsService();

// =====================================
// GAME MONITORING ENGINE
// =====================================

/**
 * Monitor all active games (runs every minute)
 */
const monitorLiveGames = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone("America/Denver")
  .onRun(async (context) => {
    // Skip if in maintenance mode
    if (FEATURE_FLAGS.MAINTENANCE_MODE) {
      console.log("Skipping game monitoring - maintenance mode");
      return;
    }

    console.log("Starting live game monitoring cycle...");
    const startTime = Date.now();

    try {
      // Get all active games
      const db = admin.firestore();
      const activeGames = await db
        .collection("games")
        .where("status", "==", GAME_CONFIG.STATUS.ACTIVE)
        .get();

      console.log(`Found ${activeGames.size} active games to monitor`);

      if (activeGames.empty) {
        return;
      }

      // Process games in parallel (but limit concurrency)
      const gamePromises = [];
      const MAX_CONCURRENT = 5;

      for (let i = 0; i < activeGames.docs.length; i += MAX_CONCURRENT) {
        const batch = activeGames.docs.slice(i, i + MAX_CONCURRENT);
        const batchPromises = batch.map((gameDoc) =>
          monitorSingleGame(db, gameDoc).catch((error) => {
            logError(error, {
              context: "monitorSingleGame",
              gameId: gameDoc.id,
            });
            return null;
          })
        );

        const results = await Promise.all(batchPromises);
        gamePromises.push(...results);
      }

      const duration = Date.now() - startTime;
      console.log(`Game monitoring completed in ${duration}ms`);

      // Log summary
      const successful = gamePromises.filter((r) => r?.success).length;
      const failed = gamePromises.length - successful;

      await db.collection("systemLogs").add({
        type: "game_monitoring",
        timestamp: getTimestamp(),
        duration,
        gamesProcessed: activeGames.size,
        successful,
        failed,
      });
    } catch (error) {
      logError(error, { context: "monitorLiveGames" });

      // Send admin alert
      await sendAdminAlert({
        type: "monitoring_failure",
        message: "Game monitoring cycle failed",
        error: error.message,
      });
    }
  });

/**
 * Monitor a single game
 */
async function monitorSingleGame(db, gameDoc) {
  const gameId = gameDoc.id;
  const game = gameDoc.data();

  console.log(
    `Monitoring game ${gameId}: ${game.teams.away} @ ${game.teams.home}`
  );

  if (!game.apiSportsId) {
    console.warn(`Game ${gameId} missing apiSportsId - skipping`);
    return { success: false, reason: "missing_api_id" };
  }

  try {
    // Fetch current scores with performance tracking
    const fetchScores = measurePerformance(
      () => apiSportsService.fetchGameScore(game.apiSportsId, game.sport),
      "fetchGameScore"
    );

    const liveData = await fetchScores();

    // Update game with latest data
    const updates = {
      lastApiCheck: getTimestamp(),
      lastApiStatus: liveData.status,
      apiCheckCount: admin.firestore.FieldValue.increment(1),
    };

    // Check if game status changed
    if (liveData.status !== game.status) {
      console.log(
        `Game ${gameId} status changed: ${game.status} → ${liveData.status}`
      );
      updates.status = liveData.status;

      if (liveData.status === GAME_CONFIG.STATUS.COMPLETED) {
        updates.completedAt = getTimestamp();
        updates.finalScore = liveData.totalScore;
      }
    }

    // Process each quarter
    const quarters = ["q1", "q2", "q3", "q4"];
    if (liveData.quarterScores.ot) {
      quarters.push("ot");
    }

    let winnersProcessed = 0;

    for (const quarter of quarters) {
      const quarterScore = liveData.quarterScores[quarter];

      // Skip if no score yet
      if (
        !quarterScore ||
        quarterScore.home === null ||
        quarterScore.away === null
      ) {
        continue;
      }

      // Skip if already processed - FIXED: Complete the condition
      if (game.processedQuarters?.[quarter]) {
        continue;
      }

      console.log(
        `Processing ${quarter} for game ${gameId}: ${quarterScore.home}-${quarterScore.away}`
      );

      try {
        // Process winners for this quarter
        const winners = await processQuarterWinners(
          db,
          gameId,
          quarter,
          quarterScore,
          game
        );

        // Mark quarter as processed
        updates[`processedQuarters.${quarter}`] = true;
        updates[`scores.${quarter}`] = quarterScore;

        winnersProcessed += winners.length;

        // Send notifications (async - don't wait)
        notifyWinners(db, winners).catch((error) => {
          logError(error, {
            context: "notifyWinners",
            gameId,
            quarter,
          });
        });
      } catch (error) {
        logError(error, {
          context: "processQuarterWinners",
          gameId,
          quarter,
        });

        // Continue with other quarters
      }
    }

    // Save all updates
    await gameDoc.ref.update(updates);

    return {
      success: true,
      gameId,
      winnersProcessed,
      status: liveData.status,
    };
  } catch (error) {
    logError(error, {
      context: "monitorSingleGame",
      gameId,
      apiSportsId: game.apiSportsId,
    });

    // Update game with error status
    await gameDoc.ref.update({
      lastApiCheck: getTimestamp(),
      lastApiError: error.message,
      apiErrorCount: admin.firestore.FieldValue.increment(1),
    });

    return {
      success: false,
      gameId,
      error: error.message,
    };
  }
}

// =====================================
// MANUAL SCORE ENTRY
// =====================================

/**
 * Manual score update by admin
 */
const manualScoreUpdate = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth?.token?.admin) {
    throw createError("permission", ERROR_MESSAGES.ADMIN_ONLY);
  }

  const { gameId, quarter, homeScore, awayScore, markAsComplete } = data;

  // Validate input
  if (
    !gameId ||
    !quarter ||
    homeScore === undefined ||
    awayScore === undefined
  ) {
    throw createError("validation", "Missing required fields");
  }

  const db = admin.firestore();

  try {
    // Get game
    const gameRef = db.collection("games").doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw createError("not-found", ERROR_MESSAGES.GAME_NOT_FOUND);
    }

    const game = gameDoc.data();

    // Check if quarter already processed
    if (game.processedQuarters?.[quarter]) {
      throw createError("exists", `Quarter ${quarter} already processed`);
    }

    // Process winners
    const quarterScore = {
      home: parseInt(homeScore),
      away: parseInt(awayScore),
    };

    const winners = await processQuarterWinners(
      db,
      gameId,
      quarter,
      quarterScore,
      game
    );

    // Update game
    const updates = {
      [`scores.${quarter}`]: quarterScore,
      [`processedQuarters.${quarter}`]: true,
      manualScoreEntry: true,
      [`manualScores.${quarter}`]: {
        ...quarterScore,
        enteredBy: context.auth.uid,
        enteredAt: getTimestamp(),
      },
    };

    if (markAsComplete) {
      updates.status = GAME_CONFIG.STATUS.COMPLETED;
      updates.completedAt = getTimestamp();
      updates.finalScore = {
        home: Object.values({ ...game.scores, ...updates })
          .filter((s) => s.home !== undefined)
          .reduce((sum, s) => sum + (s.home || 0), 0),
        away: Object.values({ ...game.scores, ...updates })
          .filter((s) => s.away !== undefined)
          .reduce((sum, s) => sum + (s.away || 0), 0),
      };
    }

    await gameRef.update(updates);

    // Notify winners
    await notifyWinners(db, winners);

    return {
      success: true,
      message: `${quarter} winners processed`,
      winnersCount: winners.length,
      score: `${quarterScore.home}-${quarterScore.away}`,
    };
  } catch (error) {
    logError(error, {
      context: "manualScoreUpdate",
      gameId,
      quarter,
    });
    throw error;
  }
});

// =====================================
// GAME SCHEDULING
// =====================================

/**
 * Auto-activate games at start time
 */
const activateUpcomingGames = functions.pubsub
  .schedule("every 5 minutes")
  .timeZone("America/Denver")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = getNow();

    try {
      // Find games that should be active
      const upcomingGames = await db
        .collection("games")
        .where("status", "==", GAME_CONFIG.STATUS.UPCOMING)
        .where("startTime", "<=", now)
        .get();

      if (upcomingGames.empty) {
        return;
      }

      console.log(`Activating ${upcomingGames.size} games`);

      const batch = db.batch();

      upcomingGames.forEach((doc) => {
        batch.update(doc.ref, {
          status: GAME_CONFIG.STATUS.ACTIVE,
          actualStartTime: getTimestamp(),
        });
      });

      await batch.commit();

      // Log activation
      await db.collection("systemLogs").add({
        type: "games_activated",
        count: upcomingGames.size,
        timestamp: getTimestamp(),
      });
    } catch (error) {
      logError(error, { context: "activateUpcomingGames" });
    }
  });

/**
 * Check for stuck games
 */
const checkStuckGames = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("America/Denver")
  .onRun(async (context) => {
    const db = admin.firestore();
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    try {
      // Find games active for too long
      const stuckGames = await db
        .collection("games")
        .where("status", "==", GAME_CONFIG.STATUS.ACTIVE)
        .where(
          "actualStartTime",
          "<",
          admin.firestore.Timestamp.fromDate(fourHoursAgo)
        )
        .get();

      if (!stuckGames.empty) {
        console.warn(`Found ${stuckGames.size} potentially stuck games`);

        const gamesList = stuckGames.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          hoursActive: Math.floor(
            (Date.now() - doc.data().actualStartTime.toDate()) /
              (1000 * 60 * 60)
          ),
        }));

        await sendAdminAlert({
          type: "stuck_games",
          message: `${stuckGames.size} games have been active for over 4 hours`,
          games: gamesList,
        });
      }

      // Check for games with API errors
      const errorGames = await db
        .collection("games")
        .where("status", "==", GAME_CONFIG.STATUS.ACTIVE)
        .where("apiErrorCount", ">", 10)
        .get();

      if (!errorGames.empty) {
        await sendAdminAlert({
          type: "api_errors",
          message: `${errorGames.size} games have excessive API errors`,
          games: errorGames.docs.map((d) => ({
            id: d.id,
            errors: d.data().apiErrorCount,
          })),
        });
      }
    } catch (error) {
      logError(error, { context: "checkStuckGames" });
    }
  });

// =====================================
// NOTIFICATION SYSTEM
// =====================================

/**
 * Send winner notifications (placeholder - full implementation in next artifact)
 */
async function notifyWinners(db, winners) {
  if (winners.length === 0) return;

  console.log(`Queuing notifications for ${winners.length} winners`);

  // Queue notifications for processing
  const batch = db.batch();

  winners.forEach((winner) => {
    const notificationRef = db.collection("notificationQueue").doc();
    batch.set(notificationRef, {
      type: "winner",
      winnerId: winner.id,
      userId: winner.userId,
      priority: "high",
      attempts: 0,
      createdAt: getTimestamp(),
      status: "pending",
    });
  });

  await batch.commit();
}

/**
 * Send admin alerts
 */
async function sendAdminAlert(alert) {
  const db = admin.firestore();

  await db.collection("adminAlerts").add({
    ...alert,
    timestamp: getTimestamp(),
    resolved: false,
    priority: alert.type === "monitoring_failure" ? "critical" : "high", // FIXED: Complete ternary operator
  });

  // In production, also send immediate notification
  console.error("ADMIN ALERT:", alert);
}

// =====================================
// HEALTH MONITORING
// =====================================

/**
 * Monitor API-Sports health
 */
const monitorApiHealth = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async (context) => {
    try {
      const health = await apiSportsService.checkHealth();

      const db = admin.firestore();
      await db.collection("systemHealth").add({
        service: "api-sports",
        timestamp: getTimestamp(),
        ...health,
      });

      if (!health.healthy) {
        await sendAdminAlert({
          type: "api_unhealthy",
          message: "API-Sports health check failed",
          error: health.error,
        });
      }
    } catch (error) {
      logError(error, { context: "monitorApiHealth" });
    }
  });

// =====================================
// TESTING UTILITIES
// =====================================

/**
 * Test API connection
 */
const testApiConnection = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw createError("permission", ERROR_MESSAGES.ADMIN_ONLY);
  }

  const { apiSportsId, sport } = data;

  try {
    const result = await apiSportsService.fetchGameScore(apiSportsId, sport);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

function validateTelegramUsername(username) {
  // Allow empty/null values
  if (!username || username === '' || username.trim() === '') {
    return { valid: true, value: null, isEmpty: true };
  }
  
  if (typeof username !== 'string') {
    return { valid: false, error: ERROR_MESSAGES.INVALID_TELEGRAM };
  }
  
  // Remove @ if present and trim
  const cleaned = username.trim().replace(/^@/, '');
  
  if (!VALIDATION_RULES.TELEGRAM_USERNAME.test('@' + cleaned)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_TELEGRAM };
  }
  
  return { valid: true, value: '@' + cleaned, isEmpty: false };
}


/**
 * Force game monitoring for specific game
 */
const forceMonitorGame = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw createError("permission", ERROR_MESSAGES.ADMIN_ONLY);
  }

  const { gameId } = data;

  const db = admin.firestore();
  const gameDoc = await db.collection("games").doc(gameId).get();

  if (!gameDoc.exists) {
    throw createError("not-found", ERROR_MESSAGES.GAME_NOT_FOUND);
  }

  const result = await monitorSingleGame(db, gameDoc);

  return result;
});

//  const addTelegramToAccount = functions.https.onCall(async (data, context) => {
//   // data comes from frontend
//   const { userId, telegramUsername } = data;

//   console.log("addTelegramToAccount called", { userId, telegramUsername });

//   // Optional: check authentication
//   if (!context.auth) {
//     throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
//   }

//   // Optional: validate userId matches authenticated user
//   if (context.auth.uid !== userId) {
//     throw new functions.https.HttpsError("permission-denied", "Cannot add Telegram for another user.");
//   }

//   try {
//     // Validate telegram username
//     const validation = validateTelegramUsername(telegramUsername);
//     if (!validation.valid || validation.isEmpty) {
//       throw new functions.https.HttpsError(
//         "invalid-argument",
//         validation.error || "Please enter a valid Telegram username"
//       );
//     }

//     // Update user profile in Firestore
//     const userRef = db.collection("users").doc(userId);
//     await userRef.update({
//       telegramUsername: validation.value,
//       hasTelegram: true,
//       preferredNotificationMethod: "both",
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     // Grant Telegram access for active tiers
//     const userDoc = await userRef.get();
//     const userData = userDoc.data();

//     if (userData.currentTiers && userData.currentTiers.length > 0) {
//       for (const tier of userData.currentTiers) {
//         const grantTelegramAccessForTier = functions.httpsCallable("grantTelegramAccessForTier");
//         await grantTelegramAccessForTier({ userId, tier, telegramUsername: validation.value });
//       }
//     }

//     return {
//       success: true,
//       message: "Telegram added successfully! You now have access to all benefits.",
//       benefits: {
//         extraAttempts: 5,
//         instantNotifications: true,
//         communityAccess: true,
//       },
//     };
//   } catch (error) {
//     console.error("Add Telegram error:", error);
//     throw new functions.https.HttpsError("internal", error.message);
//   }
// });


// =====================================
// EXPORTS
// =====================================

module.exports = {
  // Services
  apiSportsService,

  // Functions
  monitorLiveGames,
  manualScoreUpdate,
  activateUpcomingGames,
  checkStuckGames,
  monitorApiHealth,

  // Testing
  testApiConnection,
  forceMonitorGame,
  // addTelegramToAccount
};
