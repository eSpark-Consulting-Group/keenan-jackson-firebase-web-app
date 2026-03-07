// modified-trivia-square-system.js
// SKILL-BASED VERSION WITH TIMING PRIVACY: Supports 2 players per square with speed-based winner determination
// Core game mechanics with trivia questions, timing, and skill-based square placement
// PRIVACY: Other players' answer times are hidden until square wins

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");

const crypto = require("crypto");

// Import BAAT System
const {
  BAAT_CONFIG,
  collectAnswerTimes,
  calculateFullBAAT,
} = require("./baat-system");

// Import Consolation Config
const { CONSOLATION_CONFIG } = require("./constants-configuration-fixed");

// =====================================
// CONSTANTS
// =====================================
const TRIVIA_CONFIG = {
  TOKEN_EXPIRY_HOURS: 24,
  MAX_ATTEMPTS_PER_DAY: 5,
  MAX_ATTEMPTS_WITH_TELEGRAM: 10,
  SESSION_TIMEOUT_MINUTES: 5,
  MAX_PLAYERS_PER_SQUARE: 2, // NEW: Skill-based limit - 2 players can share a square
  QUESTIONS_PER_SQUARE: 1,
  MAX_CONSOLATION_PER_BOARD: 4, // NEW: Maximum consolation squares per board
};

const TIER_CONFIG = {
  tier_25: {
    amount: 25,
    name: "$25 Tier",
    maxSquaresPerBoard: 3,
    payoutPercentage: 0.77,
  },
  tier_50: {
    amount: 50,
    name: "$50 Tier",
    maxSquaresPerBoard: 3,
    payoutPercentage: 0.77,
  },
  tier_100: {
    amount: 100,
    name: "$100 Tier",
    maxSquaresPerBoard: 3,
    payoutPercentage: 0.77,
  },
  tier_250: {
    amount: 250,
    name: "$250 Tier",
    maxSquaresPerBoard: 3,
    payoutPercentage: 0.77,
  },
  tier_500: {
    amount: 500,
    name: "$500 Tier",
    maxSquaresPerBoard: 3,
    payoutPercentage: 0.77,
  },
  tier_1000: {
    amount: 1000,
    name: "$1000 Tier",
    maxSquaresPerBoard: 3,
    payoutPercentage: 0.77,
  },
};

const GAME_TYPES = {
  REGULAR: "regular",
  PLAYOFF: "playoff",
  CHAMPIONSHIP: "championship",
};

// =====================================
// TRIVIA QUESTION FLOW
// =====================================

/**
 * Get a trivia question for the user
 * Verifies tier access and returns appropriate question
 * MODIFIED: Now tracks question display time for skill-based timing
 */
exports.getTriviaQuestion = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { tier, boardId, squarePosition } = data;
  const userId = context.auth.uid;
  logger.info("Trivia question request started", {
    userId,
    tier,
    boardId,
    squarePosition,
  });

  // Validate inputs
  if (!tier || !TIER_CONFIG[tier]) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid tier specified",
    );
  }

  if (!boardId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Board ID required",
    );
  }

  // Validate squarePosition if provided
  let targetSquarePosition = null;
  if (squarePosition !== null && squarePosition !== undefined) {
    if (
      !Number.isInteger(squarePosition) ||
      squarePosition < 0 ||
      squarePosition > 49
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Square position must be 0-49",
      );
    }
    targetSquarePosition = squarePosition;
  }

  try {
    // Verify user has active tier access
    // const hasAccess = await verifyUserTierAccess(userId, tier);
    // if (!hasAccess) {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "You do not have active access to this tier. Please pay the entry fee first."
    //   );
    // }

    // Get user data to check Telegram status
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.data() || {};
    const hasTelegram = userData.hasTelegram || !!userData.telegramUsername;

    // Check daily attempt limit based on Telegram status
    const dailyLimit = hasTelegram
      ? TRIVIA_CONFIG.MAX_ATTEMPTS_WITH_TELEGRAM
      : TRIVIA_CONFIG.MAX_ATTEMPTS_PER_DAY;

    logger.info("User data retrieved", {
      userId,
      hasTelegram,
      dailyLimit,
      currentRemainingAttempts: userData.dailyTriviaAttempts,
      lastTriviaAttempt: userData.lastTriviaAttempt?.toDate()?.toISOString(),
    });

    // SIMPLE APPROACH: Check and update attempts
    const attemptsCheck = await checkAndUpdateDailyAttempts(
      userId,
      dailyLimit,
      userData,
    );

    logger.info("Attempts check result", {
      userId,
      canMakeAttempt: attemptsCheck.canMakeAttempt,
      remainingAfterThisAttempt: attemptsCheck.remainingAfterThisAttempt,
      attemptsUsedAfterThis: attemptsCheck.attemptsUsedAfterThis,
      message: attemptsCheck.message,
    });

    // Check if user can make attempt
    if (!attemptsCheck.canMakeAttempt) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        attemptsCheck.message,
      );
    }

    // Verify board exists and is active
    const boardDoc = await admin
      .firestore()
      .collection("boards")
      .doc(boardId)
      .get();
    if (!boardDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Board not found");
    }

    const board = boardDoc.data();
    if (board.tierId !== tier) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Board tier mismatch",
      );
    }

    // Check if user has reached square limit on this board
    const userSquaresOnBoard = await getUserSquaresOnBoard(userId, boardId);
    if (userSquaresOnBoard.length >= TIER_CONFIG[tier].maxSquaresPerBoard) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Maximum ${TIER_CONFIG[tier].maxSquaresPerBoard} squares per board reached`,
      );
    }

    // ========================================
    // Get pre-assigned or random question
    // ========================================
    let question = null;

    if (targetSquarePosition !== null) {
      // Player specified a square - get the PRE-ASSIGNED question for that square
      logger.info("Getting pre-assigned question for square", {
        boardId,
        squarePosition: targetSquarePosition,
      });

      if (!board.squareQuestions) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Board has no pre-assigned questions (corrupted board)",
        );
      }

      const preAssignedQuestionId = board.squareQuestions[String(targetSquarePosition)];
      if (!preAssignedQuestionId) {
        throw new functions.https.HttpsError(
          "not-found",
          `No pre-assigned question for square ${targetSquarePosition}`,
        );
      }

      question = await getTriviaQuestionById(preAssignedQuestionId);
      if (!question) {
        throw new functions.https.HttpsError(
          "not-found",
          `Pre-assigned question ${preAssignedQuestionId} not found in database`,
        );
      }

      logger.info("✅ Got pre-assigned question", {
        squarePosition: targetSquarePosition,
        questionId: question.id,
      });
    } else {
      // No square specified - get random question (backward compatible)
      logger.info("Getting random question (no square position specified)");

      const gameDoc = await admin
        .firestore()
        .collection("games")
        .doc(board.gameId)
        .get();
      const game = gameDoc.data();
      question = await getRandomTriviaQuestion(game.sport, tier);

      logger.info(
        "✅ Got random question (player will select square after answering)",
        {
          questionId: question?.id,
        },
      );
    }

    if (!question) {
      throw new functions.https.HttpsError(
        "not-found",
        "No questions available",
      );
    }

    // Create trivia session with timing information - SKILL-BASED TRACKING
    const sessionRef = await admin
      .firestore()
      .collection("triviaSessions")
      .add({
        sessionId: admin.firestore().collection("triviaSessions").doc().id,
        userId,
        boardId,
        squarePosition: targetSquarePosition, // NEW: Track which square (if predetermined)
        questionId: question.id,

        // Timing fields for skill-based competition
        questionDisplayedAt: admin.firestore.FieldValue.serverTimestamp(),
        answerSubmittedAt: null,
        answerTimeMs: null,
        answerTimeSeconds: null,

        // Answer tracking
        answered: false,
        isCorrect: false,
        answerIndex: null,

        // Session info
        sport: game.sport,
        tier,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(
            Date.now() + TRIVIA_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000,
          ),
        ),

        // Metadata
        metadata: {
          gameId: board.gameId,
          userSquaresOnBoard: userSquaresOnBoard.length,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Record attempt in triviaAttempts collection
    await recordTriviaAttempt(userId, sessionRef.id, false);

    logger.info("Question generated successfully", {
      userId,
      sessionId: sessionRef.id,
      remainingAttempts: attemptsCheck.remainingAfterThisAttempt,
      attemptsUsed: attemptsCheck.attemptsUsedAfterThis,
    });
    const shuffledAnswers = shuffleArray(question.answers);
    const correctIndex = shuffledAnswers.findIndex((a) => a.isCorrect);
    // Save the correct index in the session doc (but not send to frontend)
    await sessionRef.update({
      correctIndex: correctIndex,
    });

    // Return question without correct answer
    return {
      success: true,
      sessionId: sessionRef.id,
      sessionStartTime: Date.now(),

      question: {
        id: question.id,
        question: question.question,
        answers: shuffledAnswers.map((a) => ({ text: a.text })),
        sport: question.sport,
        difficulty: question.difficulty,
      },
      boardInfo: {
        game: `${game?.teams?.away} @ ${game?.teams?.home}`,
        tier: TIER_CONFIG[tier]?.name,
        userSquares: userSquaresOnBoard?.length,
        maxSquares: TIER_CONFIG[tier]?.maxSquaresPerBoard,
      },
      triviaStatus: {
        attemptsUsed: attemptsCheck.attemptsUsedAfterThis,
        attemptsRemaining: attemptsCheck.remainingAfterThisAttempt,
        dailyLimit: dailyLimit,
        hasTelegram: hasTelegram,
        telegramBenefit: !hasTelegram
          ? `Add Telegram for ${TRIVIA_CONFIG.MAX_ATTEMPTS_WITH_TELEGRAM - dailyLimit} more daily attempts!`
          : null,
      },
    };
  } catch (error) {
    logger.error("Get trivia question error", {
      userId,
      error: error.message,
      code: error.code,
    });
    throw error;
  }
});

async function checkAndUpdateDailyAttempts(userId, dailyLimit, userData) {
  const userRef = admin.firestore().collection("users").doc(userId);

  try {
    logger.info("Starting checkAndUpdateDailyAttempts", { userId, dailyLimit });

    // Get current date (Pakistan time)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastAttemptDate = userData.lastTriviaAttempt?.toDate();
    const lastAttemptDay = lastAttemptDate ? new Date(lastAttemptDate) : null;
    if (lastAttemptDay) lastAttemptDay.setHours(0, 0, 0, 0);

    const isNewDay =
      !lastAttemptDate ||
      (lastAttemptDay && lastAttemptDay.getTime() !== today.getTime());

    logger.info("New day check result", { userId, isNewDay });

    let currentRemaining = userData.dailyTriviaAttempts;

    // Reset attempts only if it's a new day or user has no attempts recorded
    if (isNewDay || typeof currentRemaining !== "number") {
      currentRemaining = dailyLimit;
      await userRef.update({
        dailyTriviaAttempts: currentRemaining,
        lastTriviaAttempt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info("Resetting attempts for new day or first-time user", {
        userId,
        currentRemaining,
      });
    }

    // BLOCK if user has 0 remaining attempts
    if (currentRemaining <= 0) {
      const message =
        userData.hasTelegram || !!userData.telegramUsername
          ? "Daily trivia limit reached. Try again tomorrow."
          : `Daily trivia limit reached. Add Telegram to get ${TRIVIA_CONFIG.MAX_ATTEMPTS_WITH_TELEGRAM - TRIVIA_CONFIG.MAX_ATTEMPTS_PER_DAY} more attempts per day!`;

      logger.info("Blocking attempt - limit reached", {
        userId,
        currentRemaining,
        message,
      });

      return {
        canMakeAttempt: false,
        message,
        remainingAfterThisAttempt: 0,
        attemptsUsedAfterThis: dailyLimit,
      };
    }

    // User can make attempt - reduce remaining by 1
    const newRemaining = currentRemaining - 1;
    const attemptsUsed = dailyLimit - newRemaining;

    await userRef.update({
      dailyTriviaAttempts: newRemaining,
      totalTriviaAttempts: admin.firestore.FieldValue.increment(1),
      lastTriviaAttempt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("checkAndUpdateDailyAttempts completed successfully", {
      userId,
      finalResult: {
        canMakeAttempt: true,
        remainingAfterThisAttempt: newRemaining,
        attemptsUsedAfterThis: attemptsUsed,
      },
    });

    return {
      canMakeAttempt: true,
      remainingAfterThisAttempt: newRemaining,
      attemptsUsedAfterThis: attemptsUsed,
      message: "Attempt allowed",
    };
  } catch (error) {
    logger.error("DETAILED Error in checkAndUpdateDailyAttempts", {
      userId,
      dailyLimit,
      userData,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });

    return {
      canMakeAttempt: false,
      message: "Error checking attempts. Please try again.",
      remainingAfterThisAttempt: 0,
      attemptsUsedAfterThis: dailyLimit,
    };
  }
}

/**
 * Submit trivia answer and earn square if correct
 * MODIFIED: Now calculates and stores answer time for skill-based competition
 */
exports.submitTriviaAnswer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }
  const userId = context.auth.uid;
  logger.info(`USER ID: ${userId}`);
  const userRef = admin.firestore().collection("users").doc(userId);
  const db = admin.firestore();

  const { sessionId, answerIndex } = data;
  // Normalize answer index
  const normalizedAnswerIndex =
    answerIndex === null || answerIndex === undefined
      ? null
      : Number(answerIndex);

  // Validate inputs
  if (!sessionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Session ID required",
    );
  }

  // if (normalizedAnswerIndex < 0 || normalizedAnswerIndex > 3) {
  //   throw new functions.https.HttpsError('invalid-argument', 'Invalid answer index');
  // }

  try {
    // Get and validate session
    const sessionDoc = await admin
      .firestore()
      .collection("triviaSessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Invalid trivia session",
      );
    }

    const session = sessionDoc.data();
    logger.info(`SESSION: ${session}`);

    // Validate session ownership
    if (session.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Session does not belong to user",
      );
    }

    // Check if already answered
    if (session.answered) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Question already answered",
      );
    }

    // Check if expired
    if (session.expiresAt.toMillis() < Date.now()) {
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        "Session expired",
      );
    }

    // 🔹 CASE 1: User skipped (no answer submitted)
    if (normalizedAnswerIndex === null) {
      await sessionDoc.ref.update({
        answered: false,
        skipped: true,
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const result = await admin
        .firestore()
        .runTransaction(async (transaction) => {
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists) {
            throw new functions.https.HttpsError("not-found", "User not found");
          }

          const userData = userSnap.data();
          const currentTiers = [...(userData.currentTiers || [])];

          // 🔑 Remove only one occurrence of the tier
          const index = currentTiers.indexOf(tier);
          if (index === -1) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              "Tier not available in user’s currentTiers",
            );
          }
          currentTiers.splice(index, 1);

          const stillHasTier = currentTiers.includes(tier);

          if (!stillHasTier) {
            const accessQuery = await db
              .collection("tierAccess")
              .where("userId", "==", userId)
              .where("tier", "==", tier)
              .where("active", "==", true)
              .limit(1)
              .get();

            if (!accessQuery.empty) {
              transaction.delete(accessQuery.docs[0].ref);
            }
          }

          // Update user's currentTiers
          transaction.update(userRef, {
            currentTiers: currentTiers,
          });

          return { currentTiers };
        });

      return {
        success: true,
        skipped: true,
        message: "No answer submitted. Question skipped.",
      };
    }

    // 🔹 CASE 2: User submitted an answer → validate index
    if (normalizedAnswerIndex < 0 || normalizedAnswerIndex > 3) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid answer index",
      );
    }

    const isCorrect = normalizedAnswerIndex === session.correctIndex;

    // Get the original question to check answer
    const questionDoc = await admin
      .firestore()
      .collection("trivia")
      .doc(session.questionId)
      .get();

    if (!questionDoc.exists) {
      throw new functions.https.HttpsError("internal", "Question not found");
    }

    const question = questionDoc.data();

    // SKILL-BASED: Calculate precise answer time
    const answeredAt = admin.firestore.FieldValue.serverTimestamp();
    const currentTime = Date.now();
    const questionDisplayTime = session.questionDisplayedAt
      ? session.questionDisplayedAt.toMillis()
      : session.startedAt.toMillis();
    const answerTimeMs = currentTime - questionDisplayTime;
    const answerTimeSeconds = Math.round(answerTimeMs / 100) / 10; // Round to 0.1s

    // Update session with answer and timing information
    await sessionDoc.ref.update({
      answered: true,
      answeredAt: answeredAt,
      answerSubmittedAt: answeredAt,

      // Store precise timing for skill-based competition
      answerTimeMs: answerTimeMs,
      answerTimeSeconds: answerTimeSeconds,

      normalizedAnswerIndex,
      isCorrect,
    });

    if (isCorrect) {
      // Create access token for square placement WITH timing info
      const tokenRef = await admin
        .firestore()
        .collection("accessTokens")
        .add({
          userId,
          sessionId,
          boardId: session.boardId,
          tier: session.tier,

          // Store square position if predetermined
          squarePosition: session.squarePosition || null, // null if random placement

          // SKILL-BASED: Include timing for square placement and winner determination
          answerTimeMs: answerTimeMs,
          answerTimeSeconds: answerTimeSeconds,

          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(
              Date.now() + TRIVIA_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
            ),
          ),
          used: false,

          // Skill-based properties
          isConsolationToken: false,
          canEarnConsolation: true,

          // Track question for reference
          questionId: session?.questionId,
        });

      // Update user stats
      await updateUserStats(userId, "trivia_correct", {
        sport: session.sport,
        tier: session.tier,
        answerTimeSeconds: answerTimeSeconds,
      });

      const result = await admin
        .firestore()
        .runTransaction(async (transaction) => {
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists) {
            throw new functions.https.HttpsError("not-found", "User not found");
          }

          const userData = userSnap.data();
          const currentTiers = [...(userData.currentTiers || [])];
          const tier = session.tier;

          // 🔑 Remove only one occurrence of the tier
          const index = currentTiers.indexOf(tier);
          if (index === -1) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              "Tier not available in user’s currentTiers",
            );
          }
          currentTiers.splice(index, 1);

          const stillHasTier = currentTiers.includes(tier);

          if (!stillHasTier) {
            const accessQuery = await db
              .collection("tierAccess")
              .where("userId", "==", userId)
              .where("tier", "==", tier)
              .where("active", "==", true)
              .limit(1)
              .get();

            if (!accessQuery.empty) {
              transaction.update(accessQuery.docs[0].ref, { active: false });
            }
          }

          // Update user's currentTiers
          transaction.update(userRef, {
            currentTiers: currentTiers,
          });

          return { currentTiers };
        });

      return {
        success: true,
        correct: true,
        tokenId: tokenRef.id,
        correctAnswerIndex: session.correctIndex,
        // Include answer time in response
        answerTime: answerTimeSeconds,
        message: `Correct! You answered in ${answerTimeSeconds} seconds. You can now place a square on the board.`,

        boardId: session.boardId,
      };
    } else {
      // Update user stats for incorrect answer
      await updateUserStats(userId, "trivia_incorrect", {
        sport: session.sport,
        tier: session.tier,
      });

      const result = await admin
        .firestore()
        .runTransaction(async (transaction) => {
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists) {
            throw new functions.https.HttpsError("not-found", "User not found");
          }

          const userData = userSnap.data();
          const currentTiers = [...(userData.currentTiers || [])];
          const tier = session.tier;

          // 🔑 Remove only one occurrence of the tier
          const index = currentTiers.indexOf(tier);
          if (index === -1) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              "Tier not available in user’s currentTiers",
            );
          }
          currentTiers.splice(index, 1);

          const stillHasTier = currentTiers.includes(tier);

          if (!stillHasTier) {
            const accessQuery = await db
              .collection("tierAccess")
              .where("userId", "==", userId)
              .where("tier", "==", tier)
              .where("active", "==", true)
              .limit(1)
              .get();

            if (!accessQuery.empty) {
              transaction.delete(accessQuery.docs[0].ref);
            }
          }

          // Update user's currentTiers
          transaction.update(userRef, {
            currentTiers: currentTiers,
          });

          return { currentTiers };
        });

      return {
        success: true,
        correct: false,
        correctAnswerIndex: session.correctIndex,
        message: "Incorrect answer. Try another question!",
      };
    }
  } catch (error) {
    console.error("Submit answer error:", error);
    throw error;
  }
});

// =====================================
// SQUARE PLACEMENT
// =====================================

/**
 * Place a square on the board using earned token
 * MAJOR MODIFICATION: Now supports 2 players per square with skill-based competition
 * PRIVACY: Returns only the user's own time, not other players' times
 */
exports.placeSquare = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { tokenId, position } = data;
  const userId = context.auth.uid;

  // Validate inputs
  if (!tokenId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Token ID required",
    );
  }

  // Position can be null for random placement
  if (position !== null && position !== undefined) {
    if (!Number.isInteger(position) || position < 0 || position > 49) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid square position",
      );
    }
  }

  try {
    // Get and validate token
    const tokenDoc = await admin
      .firestore()
      .collection("accessTokens")
      .doc(tokenId)
      .get();

    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Invalid token");
    }

    const token = tokenDoc.data();

    // Validate token ownership
    if (token.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Token does not belong to user",
      );
    }

    // Check if already used
    if (token.used) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Token already used",
      );
    }

    // Check if expired
    if (token.expiresAt.toMillis() < Date.now()) {
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        "Token expired",
      );
    }

    // ========================================
    // Validate predetermined square position
    // If token was created with a specific square, enforce it
    // ========================================
    if (
      token.squarePosition !== null &&
      token.squarePosition !== undefined
    ) {
      if (token.squarePosition !== position) {
        throw new functions.https.HttpsError(
          "permission-denied",
          `This token is only valid for square ${token.squarePosition}. You answered the pre-assigned question for that square.`,
        );
      }
      logger.info("✅ Token square position validated in placeSquare", {
        tokenSquarePosition: token.squarePosition,
        placedSquarePosition: position,
      });
    } else {
      // Random placement - position can be anything
      logger.info("✅ Token allows random placement in placeSquare", {
        position,
      });
    }

    // Use transaction for atomic square placement
    const result = await admin
      .firestore()
      .runTransaction(async (transaction) => {
        // Get board
        const boardRef = admin
          .firestore()
          .collection("boards")
          .doc(token.boardId);
        const boardDoc = await transaction.get(boardRef);

        if (!boardDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Board not found");
        }

        const board = boardDoc.data();
        const squares = board.squares || {};

        // SKILL-BASED LOGIC: Check square occupancy (max 2 players)
        let targetPosition = position;

        if (targetPosition !== null && targetPosition !== undefined) {
          // User selected specific position
          const squareData = squares[targetPosition] || {
            claims: [],
            isFull: false,
          };

          if (
            squareData.isFull ||
            (squareData.claims &&
              squareData.claims.length >= TRIVIA_CONFIG.MAX_PLAYERS_PER_SQUARE)
          ) {
            throw new functions.https.HttpsError(
              "resource-exhausted",
              "This square is full (2 players maximum)",
            );
          }

          // Check if user already has a claim on this square
          if (squareData.claims) {
            const userAlreadyOnSquare = squareData.claims.some(
              (claim) => claim.userId === userId,
            );

            if (userAlreadyOnSquare) {
              throw new functions.https.HttpsError(
                "already-exists",
                "You already have this square",
              );
            }
          }
        } else {
          // Random placement - find available squares (less than 2 claims)
          const availablePositions = [];

          for (let i = 0; i < 50; i++) {
            const squareData = squares[i] || { claims: [], isFull: false };
            const claimCount = squareData.claims ? squareData.claims.length : 0;

            if (
              claimCount < TRIVIA_CONFIG.MAX_PLAYERS_PER_SQUARE &&
              !squareData.isFull
            ) {
              // Check user doesn't already have this square
              const userHasSquare =
                squareData.claims &&
                squareData.claims.some((claim) => claim.userId === userId);
              if (!userHasSquare) {
                availablePositions.push(i);
              }
            }
          }

          if (availablePositions.length === 0) {
            throw new functions.https.HttpsError(
              "resource-exhausted",
              "No available squares on this board",
            );
          }

          // Select random available position
          targetPosition = await getRandomAvailablePosition(availablePositions);
        }

        // Check user's total squares on this board
        const userSquareCount = Object.values(squares).filter((square) => {
          if (square.claims && Array.isArray(square.claims)) {
            return square.claims.some((claim) => claim.userId === userId);
          }
          // Legacy support for old format
          return square.userId === userId;
        }).length;

        if (userSquareCount >= TIER_CONFIG[token.tier].maxSquaresPerBoard) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            `Maximum ${TIER_CONFIG[token.tier].maxSquaresPerBoard} squares per board reached`,
          );
        }

        // Create claim record with timing data for skill-based competition
        const claimRef = admin.firestore().collection("squareClaims").doc();
        const claimData = {
          id: claimRef.id,
          userId,
          boardId: token.boardId,
          position: targetPosition,

          // SKILL-BASED: Timing data for winner determination
          triviaAnswerTimeMs: token.answerTimeMs || 0,
          triviaAnswerTimeSeconds: token.answerTimeSeconds || 0,

          // Consolation tracking
          isConsolationSquare: token.isConsolationToken || false,
          sourceWinnerId: token.sourceWinnerId || null,
          canEarnConsolation: token.canEarnConsolation !== false,

          earnedVia: token.isConsolationToken ? "consolation" : "trivia",
          triviaQuestionId: token.questionId || null,
          accessTokenId: tokenId,

          earnedAt: token.createdAt,
          placedAt: admin.firestore.FieldValue.serverTimestamp(),

          isWinner: false,
          winningQuarter: null,
          prizeAmount: null,

          tier: token.tier,
          method: targetPosition === position ? "selected" : "random",
        };

        transaction.set(claimRef, claimData);

        // SKILL-BASED: Update board squares structure for multi-player support
        const currentSquareData = squares[targetPosition] || {
          claims: [],
          isFull: false,
        };
        const updatedClaims = [
          ...(currentSquareData.claims || []),
          {
            userId,
            claimId: claimRef.id,
            answerTimeSeconds: token.answerTimeSeconds || 0,
          },
        ];

        transaction.update(boardRef, {
          [`squares.${targetPosition}`]: {
            claims: updatedClaims,
            isFull:
              updatedClaims.length >= TRIVIA_CONFIG.MAX_PLAYERS_PER_SQUARE,
          },
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mark token as used
        transaction.update(tokenDoc.ref, {
          used: true,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
          usedForPosition: targetPosition,
          claimId: claimRef.id,
        });

        // PRIVACY: Return only user's time and occupancy count
        return {
          position: targetPosition,
          claimId: claimRef.id,
          answerTime: token.answerTimeSeconds || 0,
          squareOccupancy: updatedClaims.length,
        };
      });

    // Queue confirmation notification
    await sendSquarePlacementConfirmation(
      userId,
      token.boardId,
      result.position,
    );

    // Update user stats
    await updateUserStats(userId, "square_placed", {
      boardId: token.boardId,
      position: result.position,
      tier: token.tier,
    });

    // PRIVACY: Return only user's own time, not other players'
    return {
      success: true,
      position: result.position,
      claimId: result.claimId,
      answerTime: result.answerTime,
      squareOccupancy: `${result.squareOccupancy}/${TRIVIA_CONFIG.MAX_PLAYERS_PER_SQUARE}`,
      message: `Square ${result.position} successfully claimed!`,
    };
  } catch (error) {
    console.error("Place square error:", error);
    throw error;
  }
});

/**
 * Get available boards for a tier
 * MODIFIED: Shows square occupancy information without revealing times
 */
exports.getAvailableBoards = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { tier } = data;
  const userId = context.auth.uid;

  // if (!tier || !TIER_CONFIG[tier]) {
  //   throw new functions.https.HttpsError("invalid-argument", "Invalid tier");
  // }

  try {
    // Verify tier access
    // const hasAccess = await verifyUserTierAccess(userId, tier);
    // if (!hasAccess) {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "No access to this tier"
    //   );
    // }

    // Get active games
    const activeGames = await admin
      .firestore()
      .collection("games")
      .where("status", "in", ["scheduled", "active"])
      .get();

    const boards = [];

    for (const gameDoc of activeGames.docs) {
      const game = gameDoc.data();

      // Check if tier is available for this game type
      const availableTiers = getAvailableTiersForGameType(game.gameType);
      if (!availableTiers.includes(tier)) {
        continue;
      }

      // Get board for this game and tier
      const boardQuery = await admin
        .firestore()
        .collection("boards")
        .where("gameId", "==", gameDoc.id)
        .where("tier", "==", tier)
        .limit(1)
        .get();

      if (!boardQuery.empty) {
        const boardDoc = boardQuery.docs[0];
        const board = boardDoc.data();
        const squares = board.squares || {};

        // SKILL-BASED: Count user's squares and calculate occupancy properly
        let userSquares = 0;
        let totalOccupiedSlots = 0;
        let fullSquares = 0;

        Object.values(squares).forEach((square) => {
          if (square.claims && Array.isArray(square.claims)) {
            totalOccupiedSlots += square.claims.length;
            if (square.claims.some((claim) => claim.userId === userId)) {
              userSquares++;
            }
            if (square.claims.length >= TRIVIA_CONFIG.MAX_PLAYERS_PER_SQUARE) {
              fullSquares++;
            }
          } else if (square.userId === userId) {
            // Legacy support
            userSquares++;
            totalOccupiedSlots++;
          }
        });

        const totalSquares = 50;
        const availableSquares = totalSquares - fullSquares;

        boards.push({
          boardId: boardDoc.id,
          gameId: gameDoc.id,
          game: `${game.teams.away} @ ${game.teams.home}`,
          sport: game.sport,
          gameType: game.gameType,
          startTime: game.startTime,
          userSquares,
          maxUserSquares: TIER_CONFIG[tier].maxSquaresPerBoard,
          fullSquares,
          totalSquares,
          availableSquares,
          totalOccupiedSlots,
          averageOccupancy: (
            totalOccupiedSlots /
            (totalSquares * TRIVIA_CONFIG.MAX_PLAYERS_PER_SQUARE)
          ).toFixed(2), // Out of max possible slots
          canPlaceMore:
            userSquares < TIER_CONFIG[tier].maxSquaresPerBoard &&
            availableSquares > 0,
          consolationSquaresAwarded: board.consolationSquaresAwarded || 0,
        });
      }
    }

    // Sort by game start time
    boards.sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());

    return {
      success: true,
      boards,
      tier: TIER_CONFIG[tier].name,
    };
  } catch (error) {
    console.error("Get available boards error:", error);
    throw error;
  }
});

/**
 * Get user's squares across all boards
 * PRIVACY: Shows only user's own times, not opponents'
 */
exports.getUserSquares = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const userId = context.auth.uid;
  const { tier } = data; // Optional filter by tier

  try {
    let query = admin
      .firestore()
      .collection("squareClaims")
      .where("userId", "==", userId);

    if (tier) {
      query = query.where("tier", "==", tier);
    }

    const claimsSnapshot = await query.get();
    const squares = [];

    for (const claimDoc of claimsSnapshot.docs) {
      const claim = claimDoc.data();

      // Get board info
      const boardDoc = await admin
        .firestore()
        .collection("boards")
        .doc(claim.boardId)
        .get();

      if (boardDoc.exists) {
        const board = boardDoc.data();

        // Get game info
        const gameDoc = await admin
          .firestore()
          .collection("games")
          .doc(board.gameId)
          .get();

        if (gameDoc.exists) {
          const game = gameDoc.data();

          // PRIVACY: Get occupancy info but NOT opponent times
          const squareData = board.squares?.[claim.position];
          let occupancy = "1/2";
          let hasOpponent = false;

          if (squareData && squareData.claims) {
            occupancy = `${squareData.claims.length}/${TRIVIA_CONFIG.MAX_PLAYERS_PER_SQUARE}`;
            hasOpponent = squareData.claims.length > 1;
          }

          squares.push({
            claimId: claimDoc.id,
            position: claim.position,
            boardId: claim.boardId,
            tier: claim.tier,
            placedAt: claim.placedAt,
            game: `${game.teams.away} @ ${game.teams.home}`,
            gameStatus: game.status,
            gameStartTime: game.startTime,
            isWinner: claim.isWinner || false,

            // PRIVACY: Only show user's own time
            answerTime: claim.triviaAnswerTimeSeconds,
            occupancy: occupancy,
            hasOpponent: hasOpponent,
            // Do NOT include opponent time or ID
            isConsolationSquare: claim.isConsolationSquare || false,
            canEarnConsolation: claim.canEarnConsolation !== false,
          });
        }
      }
    }

    // Group by board
    const squaresByBoard = squares.reduce((acc, square) => {
      if (!acc[square.boardId]) {
        acc[square.boardId] = {
          boardId: square.boardId,
          game: square.game,
          tier: square.tier,
          gameStatus: square.gameStatus,
          squares: [],
        };
      }
      acc[square.boardId].squares.push(square);
      return acc;
    }, {});

    return {
      success: true,
      totalSquares: squares.length,
      squaresByBoard: Object.values(squaresByBoard),
      squares,
    };
  } catch (error) {
    console.error("Get user squares error:", error);
    throw error;
  }
});

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Update user statistics
 */
/**
 * Update user statistics including BAAT (Board Average Answer Time)
 * Uses centralized BAAT system with 0.30-10.00s filtering
 */
async function updateUserStats(userId, action, metadata = {}) {
  try {
    const userRef = admin.firestore().collection("users").doc(userId);

    const updates = {};
    switch (action) {
      case "trivia_correct":
        updates.triviaCorrect = admin.firestore.FieldValue.increment(1);
        updates[`stats.bySport.${metadata.sport}.correct`] =
          admin.firestore.FieldValue.increment(1);
        if (metadata.answerTimeSeconds) {
          updates.lastAnswerTime = metadata.answerTimeSeconds;

          // ========================================
          // BAAT CALCULATION
          // Calculate average answer time using centralized BAAT system
          // Only include times between 0.30s - 10.00s
          // ========================================
          try {
            // Fetch all valid squareClaims for this user
            const claimsSnapshot = await admin
              .firestore()
              .collection("squareClaims")
              .where("userId", "==", userId)
              .get();

            // Convert to format expected by BAAT system
            const claims = claimsSnapshot.docs.map((doc) => ({
              ...doc.data(),
              answerTime: doc.data().triviaAnswerTimeSeconds || 0,
            }));

            // Use centralized BAAT calculation with proper filtering
            const result = calculateFullBAAT(claims);

            if (result.baat && result.validCount > 0) {
              // Calculate fastest from valid times
              const allValidTimes = collectAnswerTimes(claims);
              const fastestTime = Math.min(...allValidTimes);

              updates.averageAnswerTime = parseFloat(result.baat.toFixed(2));
              updates.fastestAnswerTime = parseFloat(fastestTime.toFixed(2));
              updates.validAnswerCount = result.validCount;

              console.log(
                `✅ BAAT Updated for ${userId}: Avg ${updates.averageAnswerTime}s (${result.validCount}/${result.totalCount} valid times)`,
              );
            } else {
              // No valid times yet, set to 0
              updates.averageAnswerTime = 0;
              updates.fastestAnswerTime = 0;
              updates.validAnswerCount = 0;

              console.log(
                `⚠️ BAAT: No valid times in range ${BAAT_CONFIG.MIN_RESPONSE_TIME}-${BAAT_CONFIG.MAX_RESPONSE_TIME}s for ${userId}`,
              );
            }
          } catch (baatError) {
            console.error("Error calculating BAAT:", baatError);
            // Don't throw - let stats update proceed even if BAAT fails
          }
        }
        break;
      case "trivia_incorrect":
        updates.triviaIncorrect = admin.firestore.FieldValue.increment(1);
        updates[`stats.bySport.${metadata.sport}.incorrect`] =
          admin.firestore.FieldValue.increment(1);
        break;
      case "square_placed":
        updates.squaresPlaced = admin.firestore.FieldValue.increment(1);
        updates[`stats.byTier.${metadata.tier}.squares`] =
          admin.firestore.FieldValue.increment(1);
        break;
    }

    updates.lastActive = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(updates);

    // Also log to userStats collection
    await admin.firestore().collection("userStats").add({
      userId,
      action,
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
}

/**
 * Queue square placement confirmation notification
 */
async function sendSquarePlacementConfirmation(userId, boardId, position) {
  try {
    // Queue notification for processing
    await admin.firestore().collection("notificationQueue").add({
      type: "square_assigned",
      userId,
      data: {
        boardId,
        position,
      },
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      retryCount: 0,
    });
  } catch (error) {
    console.error("Error queueing square placement notification:", error);
  }
}

/**
 * Verify user has active tier access
 */
// async function verifyUserTierAccess(userId, tier) {
//   try {
//     const accessQuery = await admin
//       .firestore()
//       .collection("tierAccess")
//       .where("userId", "==", userId)
//       .where("tier", "==", tier)
//       .where("active", "==", true)
//       .get();

//     for (const doc of accessQuery.docs) {
//       const access = doc.data();
//       if (access.expiresAt.toMillis() > Date.now()) {
//         return true;
//       }
//     }

//     return false;
//   } catch (error) {
//     console.error("Error verifying tier access:", error);
//     return false;
//   }
// }

/**
 * Record trivia attempt
 * FIXED: Complete function implementation
 */
async function recordTriviaAttempt(userId, sessionId, correct) {
  try {
    await admin.firestore().collection("triviaAttempts").add({
      userId,
      sessionId,
      correct,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error recording trivia attempt:", error);
  }
}

/**
 * Get user's squares on a specific board
 */
async function getUserSquaresOnBoard(userId, boardId) {
  try {
    const claimsQuery = await admin
      .firestore()
      .collection("squareClaims")
      .where("userId", "==", userId)
      .where("boardId", "==", boardId)
      .get();

    return claimsQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting user squares on board:", error);
    return [];
  }
}

/**
 * Get random trivia question for sport and tier
 */
async function getRandomTriviaQuestion(sport, tier) {
  try {
    const db = admin.firestore();

    // Get questions for the sport
    let query = db
      .collection("trivia")
      .where("sport", "==", sport)
      .where("isActive", "==", true);

    // Tier -> difficulty mapping
    const tierDifficulty = {
      tier_25: ["easy", "medium"],
      tier_50: ["easy", "medium"],
      tier_100: ["medium"],
      tier_250: ["medium", "hard"],
      tier_500: ["medium", "hard"],
      tier_1000: ["hard"],
    };

    const difficulties = tierDifficulty[tier] || ["medium"];
    query = query.where("difficulty", "in", difficulties);

    const snapshot = await query.get();

    if (snapshot.empty) {
      // Fallback: ANY active question for the sport
      const fallbackSnapshot = await db
        .collection("trivia")
        .where("sport", "==", sport)
        .where("isActive", "==", true) // 🔑 fixed field name
        .get();

      if (fallbackSnapshot.empty) {
        return null;
      }

      const questions = fallbackSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return questions[Math.floor(Math.random() * questions.length)];
    }

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return questions[Math.floor(Math.random() * questions.length)];
  } catch (error) {
    console.error("Error getting random trivia question:", error);
    return null;
  }
}

/**
 * Get trivia question by ID from trivia collection
 * Used to retrieve pre-assigned board questions
 */
async function getTriviaQuestionById(questionId) {
  try {
    const db = admin.firestore();
    const questionDoc = await db
      .collection("trivia")
      .doc(questionId)
      .get();

    if (!questionDoc.exists) {
      logger.warn("Question not found in trivia collection", { questionId });
      return null;
    }

    return {
      id: questionDoc.id,
      ...questionDoc.data(),
    };
  } catch (error) {
    logger.error("Error getting trivia question by ID", {
      questionId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Get random available position using crypto for true randomness
 */
async function getRandomAvailablePosition(availablePositions) {
  if (!availablePositions || availablePositions.length === 0) {
    return null;
  }

  // Use crypto for truly random selection
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);
  const randomIndex = randomValue % availablePositions.length;

  return availablePositions[randomIndex];
}

/**
 * Shuffle array using crypto for true randomness
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    const j = randomValue % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get available tiers for game type
 */
function getAvailableTiersForGameType(gameType) {
  const tierAvailability = {
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

  return tierAvailability[gameType] || tierAvailability[GAME_TYPES.REGULAR];
}

// =====================================
// BOARD QUESTION ASSIGNMENT
// =====================================

/**
 * Assign unique trivia questions to all 50 board squares
 * Every square MUST have a question, or board creation fails
 * Ensures both players on same square get identical question
 *
 * @param {object} db - Firestore database instance
 * @param {string} boardId - ID of board to assign questions to
 * @param {string} tierId - Tier ID (determines difficulty)
 * @param {string} sport - Sport type (determines question pool)
 * @returns {object} squareQuestions mapping
 * @throws {Error} If sufficient unique questions not available
 */
async function assignBoardQuestions(db, boardId, tierId, sport) {
  const squareQuestions = {};
  const usedQuestionIds = new Set();
  const TOTAL_SQUARES = 50;
  const MAX_ATTEMPTS_PER_SQUARE = 100;

  console.log(
    `📋 Starting question assignment for board ${boardId} (${sport}, ${tierId})`,
  );

  try {
    // Loop through all 50 squares
    for (let pos = 0; pos < TOTAL_SQUARES; pos++) {
      let question = null;
      let attempts = 0;

      // Keep trying to find a unique question for this square
      do {
        question = await getRandomTriviaQuestion(sport, tierId);
        attempts++;

        if (!question) {
          // ❌ NO QUESTIONS AVAILABLE IN ENTIRE POOL
          const errorMsg = `Cannot create board: no trivia questions available for position ${pos} (sport=${sport}, tier=${tierId}). Add more questions before creating games.`;
          logger.error(errorMsg, { boardId, pos, sport, tierId });
          throw new Error(errorMsg);
        }

        // Check if this question was already assigned to another square
        if (usedQuestionIds.has(question.id)) {
          // Try again with a different question
          question = null;
          continue;
        }

        // Check if we've tried too many times (not enough unique questions)
        if (attempts > MAX_ATTEMPTS_PER_SQUARE) {
          const errorMsg = `Cannot create board: not enough unique questions for position ${pos} (sport=${sport}, tier=${tierId}). Need ${TOTAL_SQUARES} unique questions but only ~${pos} available.`;
          logger.error(errorMsg, {
            boardId,
            pos,
            sport,
            tierId,
            attempts,
          });
          throw new Error(errorMsg);
        }
      } while (!question || usedQuestionIds.has(question.id));

      // ✅ Successfully found a unique question for this square
      squareQuestions[String(pos)] = question.id;
      usedQuestionIds.add(question.id);

      console.log(
        `   ✅ Square ${pos}: Assigned question ${question.id} (${question.question?.substring(0, 50)}...)`,
      );
    }

    // ✅ All 50 squares assigned successfully with unique questions
    // Update board document with question assignments
    await db.collection("boards").doc(boardId).update({
      squareQuestions: squareQuestions,
      questionAssignmentStatus: "complete",
      questionsAssignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `✅ Board ${boardId}: All ${TOTAL_SQUARES} squares assigned with unique questions`,
    );
    return squareQuestions;
  } catch (error) {
    // ❌ FAILED - Log detailed error
    logger.error("❌ Board question assignment failed", {
      boardId,
      tierId,
      sport,
      error: error.message,
      stack: error.stack,
    });

    throw error; // Re-throw so createBoardForTier can handle cleanup
  }
}

// =====================================
// SKILL-BASED CONSOLATION FUNCTIONS
// =====================================

/**
 * Grant a consolation square to a user who lost a skill-based competition
 */
async function grantConsolationSquare(userId, boardId, winnerId) {
  try {
    // Get current board info
    const currentBoardDoc = await admin
      .firestore()
      .collection("boards")
      .doc(boardId)
      .get();
    if (!currentBoardDoc.exists) {
      console.error("Board not found for consolation grant");
      return null;
    }

    const currentBoard = currentBoardDoc.data();

    // Check consolation limit
    const consolationCount = currentBoard.consolationSquaresAwarded || 0;
    if (consolationCount >= TRIVIA_CONFIG.MAX_CONSOLATION_PER_BOARD) {
      console.log("Consolation limit reached for board");
      return null;
    }

    // ========================================
    // Always grant consolation on Entry tier ($25)
    // ========================================
    const consolationTier = CONSOLATION_CONFIG.TIER;  // Always "tier_25"

    // Find next available board for Entry tier ($25)
    const nextBoardQuery = await admin
      .firestore()
      .collection("boards")
      .where("tierId", "==", consolationTier)
      .where("gameId", "!=", currentBoard.gameId)
      .where("status", "==", "active")
      .orderBy("gameId")
      .orderBy("createdAt")
      .limit(1)
      .get();

    if (nextBoardQuery.empty) {
      console.log("No future boards available for consolation square");
      return null;
    }

    const nextBoard = nextBoardQuery.docs[0];

    // Create consolation token
    const tokenRef = await admin
      .firestore()
      .collection("accessTokens")
      .add({
        userId,
        boardId: nextBoard.id,
        tier: consolationTier,
        originalBoardTier: currentBoard.tierId,   // Track which tier the loss occurred on

        // Mark as consolation
        isConsolationToken: true,
        sourceWinnerId: winnerId,
        canEarnConsolation: false, // Cannot earn another consolation

        // No timing data - will use random placement
        answerTimeMs: 0,
        answerTimeSeconds: 0,

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + CONSOLATION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        ),
        used: false,
      });

    // Update board consolation count
    await currentBoardDoc.ref.update({
      consolationSquaresAwarded: admin.firestore.FieldValue.increment(1),
    });

    // Queue consolation notification
    await admin
      .firestore()
      .collection("notificationQueue")
      .add({
        type: "consolation",
        userId,
        data: {
          nextBoardId: nextBoard.id,
          nextBoardGameId: nextBoard.data().gameId,
          consolationTier: consolationTier,         // Always Entry tier ($25)
          originalBoardTier: currentBoard.tierId,   // For analytics
        },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return tokenRef.id;
  } catch (error) {
    console.error("Error granting consolation square:", error);
    return null;
  }
}

// =====================================
// ADMIN FUNCTIONS
// =====================================

/**
 * Add trivia questions (admin only)
 */
exports.addTriviaQuestions = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required",
    );
  }

  const { questions } = data;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Questions array required",
    );
  }

  try {
    const batch = admin.firestore().batch();
    let addedCount = 0;

    for (const question of questions) {
      // Validate question format
      if (
        !question.question ||
        !Array.isArray(question.answers) ||
        question.answers.length !== 4 ||
        question.correctAnswerIndex === undefined ||
        !question.sport ||
        !question.difficulty
      ) {
        continue;
      }

      const questionRef = admin.firestore().collection("triviaQuestions").doc();
      batch.set(questionRef, {
        ...question,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
      });

      addedCount++;
    }

    await batch.commit();

    return {
      success: true,
      addedCount,
      message: `Added ${addedCount} questions`,
    };
  } catch (error) {
    console.error("Error adding trivia questions:", error);
    throw new functions.https.HttpsError("internal", "Failed to add questions");
  }
});

/**
 * Manual square assignment (admin only, for fixing issues)
 */
exports.manualSquareAssignment = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.token?.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required",
      );
    }

    const { userId, boardId, position, reason } = data;

    try {
      // Get board to determine tier
      const boardDoc = await admin
        .firestore()
        .collection("boards")
        .doc(boardId)
        .get();
      if (!boardDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Board not found");
      }

      const board = boardDoc.data();

      // Create manual token
      const tokenRef = await admin
        .firestore()
        .collection("accessTokens")
        .add({
          userId,
          boardId,
          tier: board.tier,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 1 * 60 * 60 * 1000),
          ), // 1 hour
          used: false,
          adminAssigned: true,
          assignedBy: context.auth.uid,
          reason,

          // No timing for admin assignments
          answerTimeMs: 0,
          answerTimeSeconds: 0,
          isConsolationToken: false,
          canEarnConsolation: false,
        });

      return {
        success: true,
        tokenId: tokenRef.id,
        message: `Manual token created for user ${userId}`,
      };
    } catch (error) {
      console.error("Error creating manual assignment:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create manual assignment",
      );
    }
  },
);

/**
 * Export all functions
 */
module.exports = {
  getTriviaQuestion: exports.getTriviaQuestion,
  submitTriviaAnswer: exports.submitTriviaAnswer,
  placeSquare: exports.placeSquare,
  getAvailableBoards: exports.getAvailableBoards,
  getUserSquares: exports.getUserSquares,
  addTriviaQuestions: exports.addTriviaQuestions,
  manualSquareAssignment: exports.manualSquareAssignment,

  // Export helper functions for use in other modules
  grantConsolationSquare,
  updateUserStats,
  assignBoardQuestions,
  getRandomTriviaQuestion, // Helper to get random questions
  getTriviaQuestionById,
  // verifyUserTierAccess,
};
