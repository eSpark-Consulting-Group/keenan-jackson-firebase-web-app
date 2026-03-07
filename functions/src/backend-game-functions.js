// Square Trivia - Core Backend Game Functions
// Complete implementations for missing functions

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const stripeKey = functions.config().stripe.key;
const stripe = require("stripe")(stripeKey);
const { TIERS } = require("./constants-configuration-fixed");
const {
  handleSuccessfulPayment,
  handleFailedPayment,
  handleRefund,
} = require("./payment-system-modified");
const { default: axios } = require("axios");
const {
  BigWinPost,
  StandardWinPost,
  PhotoFinishPost,
  NewBoardAlertPost,
  tierAmounts,
} = require("./social-posts-functions");
const { getShortCode, getFirstWord } = require("./utils");
const { assignBoardQuestions } = require("./trivia-system-fixed");
const { CONSOLATION_CONFIG, TIER_CONFIG } = require("./constants-configuration-fixed");

// const { query, collection, where } = require("firebase/firestore");

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket:
      process.env.STORAGE_BUCKET_NAME || "YOUR-PROJECT-ID.appspot.com",
  });
}

const db = admin.firestore();
require("dotenv").config();
const bucket = admin.storage().bucket();

const TELEGRAM_BOT_TOKEN = "7718801037:AAEV4HynXs0vdMTDFcVtVphzFU1PpaLooAQ";

async function sendTelegramNotification(chatId, message) {
  if (!chatId) return;

  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: message,
    },
  );
}

// ==========================================
// GAME CREATION & MANAGEMENT
// ==========================================

exports.createGame = functions.https.onCall(async (data, context) => {
  // Verify admin
  //   if (!context.auth || !context.auth.token.admin) {
  //     throw new functions.https.HttpsError('permission-denied', 'Admin only');
  //   }

  const {
    teams,
    gameDate,
    gameType, // 'regular', 'playoff', 'championship'
    sport, // 'nfl', 'ncaa-football'
    externalGameId, // from SportsData API
    enabledTiers, // array of tier IDs
    week,
  } = data;

  try {
    const parsedDate = new Date(gameDate);
    if (isNaN(parsedDate.getTime())) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid gameDate format",
      );
    }
    // Create game document
    const gameRef = await db.collection("games").add({
      teams,
      gameDate: admin.firestore.Timestamp.fromDate(parsedDate),
      gameType,
      sport,
      week,
      externalGameId,
      status: "scheduled",
      currentQuarter: 1,
      processedQuarters: {
        q1: false,
        q2: false,
        q3: false,
        q4: false,
        ot: false,
      },
      // homeScore: 0,
      // awayScore: 0,
      scores: {
        home: 0,
        away: 0,
      },
      quarterScores: {
        q1: { home: 0, away: 0 },
        q2: { home: 0, away: 0 },
        q3: { home: 0, away: 0 },
        q4: { home: 0, away: 0 },
      },
      enabledTiers,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });
    functions.logger.info(enabledTiers, enabledTiers);
    // Create boards for each enabled tier
    const boardPromises = enabledTiers.map((tierId) =>
      createBoardForTier(gameRef.id, tierId),
    );

    await Promise.all(boardPromises);

    (async () => {
      try {
        // Convert Firestore timestamp to JS Date
        const startDate = new Date(parsedDate);

        // Format date (e.g., "Sun, Oct 19")
        const day = startDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });

        // Format time (e.g., "12:00 PM")
        const time = startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        });
        const boards = enabledTiers.slice(0, 3).map((tier) => {
          const tierNumber = tier.split("_")[1];
          const amount = tierAmounts[tier];

          return {
            tier: `tier${tierNumber}`,
            amount: amount,
          };
        });
        const formatNthDate = (date) => {
          const d = new Date(date).getDate();
          const suffix =
            d % 10 === 1 && d !== 11
              ? "st"
              : d % 10 === 2 && d !== 12
                ? "nd"
                : d % 10 === 3 && d !== 13
                  ? "rd"
                  : "th";

          return `${String(d).padStart(2, "0")}${suffix}`;
        };

        const formatDayName = (date) => {
          return new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
          });
        };

        const formatTimeAMPM = (date) => {
          return new Date(date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        };
        const formValues = {
          nthDate: formatNthDate(startDate), // "01st", "02nd", etc.
          whichDay: formatDayName(startDate), // "Monday", "Tuesday", etc.
          TimeAMPM: formatTimeAMPM(startDate), // "06:00 PM"
          boards,
          // Auto-fill b1, b2, b3 + prices
          bP1: boards[0]?.amount || "",
          b1: boards[0]?.tier || "",
          bP2: boards[1]?.amount || "",
          b2: boards[1]?.tier || "",
          bP3: boards[2]?.amount || "",
          b3: boards[2]?.tier || "",
          time,
          HTeam: getShortCode(teams?.home) || "TBD",
          ATeam: getShortCode(teams?.away) || "TBD",
        };
        const selectedTemplate = "newBoardLive13";
        const payload = {
          templateID: selectedTemplate,
          data: formValues,
          savePath: `savedimages/${gameRef.id}/${selectedTemplate}.jpg`,
        };
        const imageResult = await generateImage(payload);

        if (!imageResult || imageResult.response !== "success") {
          console.error("Image generation failed:", imageResult);
          return;
        }
        // Post New Board Alert
        await NewBoardAlertPost({
          team1: teams?.home || "",
          team2: teams?.away || "",
          day,
          time,
          enabledTiers,
          mediaToUpload:
            imageResult?.path ||
            "https://squaretrivia.com/apple-touch-icon.png",
          captionLink: "https://squaretrivia.com",
        });

        console.log(
          `📢 New Board Alert posted for ${teams?.away || ""} vs ${teams?.home || ""} (${day} ${time})`,
        );
      } catch (err) {
        console.error("❌ Error posting New Board Alert:", err);
      }
    })();

    return {
      success: true,
      gameId: gameRef.id,
      message: `Game created with ${enabledTiers.length} boards`,
    };
  } catch (error) {
    console.error("Create game error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Helper function to create board
async function createBoardForTier(gameId, tierId) {
  // Read the game doc
  const gameRef = db.collection("games").doc(gameId);
  const gameSnap = await gameRef.get();
  if (!gameSnap.exists) {
    throw new Error("Game not found");
  }

  const gameData = gameSnap.data();

  const gameInfo = {
    teams: gameData.teams || { home: "", away: "" },
    sport: gameData.sport || "",
    startTime: gameData.gameDate || null,
  };

  const boardRef = await db.collection("boards").add({
    gameId,
    tierId,
    squares: {}, // Will be filled as players claim squares
    squareQuestions: {},
    totalSquares: 50,
    claimedSquares: 0,
    maxPlayersPerSquare: 2,
    status: "open",
    isActive: true,
    gameInfo,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  functions.logger.info("gameData", { gameData });

  // ========================================
  // Assign questions to all 50 squares
  // Must succeed or board is deleted (rollback)
  // ========================================
  try {
    await assignBoardQuestions(
      db,
      boardRef.id,
      tierId,
      gameData.sport,
    );
    functions.logger.info("✅ Board questions assigned successfully", {
      boardId: boardRef.id,
      tierId,
      sport: gameData.sport,
    });
  } catch (assignmentError) {
    // ❌ Assignment failed - DELETE board and propagate error (rollback)
    functions.logger.error("❌ Board question assignment failed - rolling back", {
      boardId: boardRef.id,
      tierId,
      sport: gameData.sport,
      error: assignmentError.message,
    });

    try {
      await db.collection("boards").doc(boardRef.id).delete();
      functions.logger.info("✅ Rolled back: board deleted", {
        boardId: boardRef.id,
      });
    } catch (deleteError) {
      functions.logger.error(
        "❌ Failed to rollback board deletion",
        { boardId: boardRef.id, error: deleteError.message },
      );
    }

    throw assignmentError; // Re-throw to prevent game creation
  }

  return boardRef.id;
}

// ==========================================
// SQUARE CLAIMING WITH TRIVIA
// ==========================================

exports.claimSquare = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in",
    );
  }

  const {
    boardId,
    squarePosition, // 0-49
    tokenId, // from trivia answer
    answerTime, // in milliseconds
  } = data;

  const userId = context.auth.uid;

  try {
    functions.logger.info("📌 claimSquare called", {
      boardId,
      squarePosition,
      tokenId,
      answerTime,
      userId,
    });
    // Verify token
    const tokenRef = db.collection("accessTokens").doc(tokenId);
    functions.logger.debug("🔍 Checking tokenRef path", {
      path: tokenRef.path,
    });
    const tokenDoc = await tokenRef.get();
    functions.logger.debug("🔍 tokenDoc.exists", { exists: tokenDoc.exists });
    if (!tokenDoc.exists) {
      functions.logger.error("❌ Invalid token, not found in Firestore", {
        tokenId,
      });
      throw new functions.https.HttpsError("invalid-argument", "Invalid token");
    }
    const token = tokenDoc.data();
    functions.logger.info("✅ Token data", token);

    // Verify token belongs to user and hasn't been used
    if (token.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Token does not belong to user",
      );
    }

    if (token.used) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Token already used",
      );
    }

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
      if (token.squarePosition !== squarePosition) {
        throw new functions.https.HttpsError(
          "permission-denied",
          `This token is only valid for square ${token.squarePosition}. You answered the pre-assigned question for that square.`,
        );
      }
      functions.logger.info("✅ Token square position validated", {
        tokenSquarePosition: token.squarePosition,
        claimedSquarePosition: squarePosition,
      });
    } else {
      // Random placement - squarePosition can be anything
      functions.logger.info(
        "✅ Token allows random placement (no predetermined square)",
        { squarePosition },
      );
    }

    // Get board and check availability
    const boardRef = db.collection("boards").doc(boardId);
    const boardDoc = await boardRef.get();

    if (!boardDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Board not found");
    }

    const board = boardDoc.data();

    // 🏈 Fetch related game
    let currentQuarter = 1;
    if (board.gameId) {
      const gameRef = db.collection("games").doc(board.gameId);
      const gameSnap = await gameRef.get();
      if (gameSnap.exists) {
        const gameData = gameSnap.data();
        currentQuarter = gameData.currentQuarter || 1;
      }
    }

    const squares = board.squares || {};
    const squareData = squares[squarePosition] || { claims: [] };

    // Check if square is full
    if (squareData.claims && squareData.claims.length >= 2) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Square is full",
      );
    }

    // Check if user already has this square
    if (
      squareData.claims &&
      squareData.claims.some((claim) => claim.userId === userId)
    ) {
      throw new functions.https.HttpsError(
        "already-exists",
        "You already have this square",
      );
    }

    // Add claim to square
    const newClaim = {
      userId,
      tokenId,
      currentQuarter,
      answerTime: answerTime / 1000, // Convert to seconds
      // claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimedAt: new Date(), // becomes a Firestore Timestamp
    };

    squareData.claims = [...(squareData.claims || []), newClaim];
    squares[squarePosition] = squareData;

    // Update board
    await boardRef.update({
      squares,
      claimedSquares: admin.firestore.FieldValue.increment(1),
    });

    // Mark token as used
    await db.collection("accessTokens").doc(tokenId).update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      usedForSquare: squarePosition,
      usedOnBoard: boardId,
    });

    return {
      success: true,
      message: "Square claimed successfully",
      squarePosition,
      occupancy: squareData.claims.length,
      currentQuarter,
    };
  } catch (error) {
    console.error("Claim square error:", error);
    throw error;
  }
});

// ==========================================
// WINNER DETERMINATION
// ==========================================

exports.determineWinners = functions.pubsub
  .schedule("every 2 minutes")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    console.log("🏁 Starting determineWinners scheduled function...");

    try {
      // 1) Fetch active/in-progress games
      console.log("🔎 Fetching active games...");
      const gamesSnapshot = await db
        .collection("games")
        .where("status", "in", ["active", "in_progress", "completed"])
        .get();

      if (gamesSnapshot.empty) {
        console.log("⚠️ No active games found, exiting.");
        return null;
      }
      console.log(`✅ Found ${gamesSnapshot.size} active games`);

      const perGameTasks = gamesSnapshot.docs.map(async (gameDoc) => {
        const game = gameDoc.data();
        const gameId = gameDoc.id;

        console.log("🎮 Processing Game", { gameId, status: game.status });
        console.log(
          "Full quarterScores",
          JSON.stringify(game.quarterScores, null, 2),
        );

        // Decide which quarter (if any) just finished
        let quarterToProcess = null;
        if (game.currentQuarter === 2) quarterToProcess = "q1";
        else if (game.currentQuarter === 3) quarterToProcess = "q2";
        else if (game.currentQuarter === 4 && game.status !== "completed")
          quarterToProcess = "q3";
        else if (game.currentQuarter === 4 && game.status === "completed")
          quarterToProcess = "q4";

        if (!quarterToProcess) {
          console.log("⏭️ No finished quarter to process yet", {
            gameId,
            currentQuarter: game.currentQuarter,
            status: game.status,
          });
          return;
        }

        const quarterScore = game.quarterScores?.[quarterToProcess];
        console.log("➡️ Quarter to process", {
          gameId,
          quarterToProcess,
          quarterScore,
        });

        if (!quarterScore) {
          console.log("⚠️ No score for finished quarter", {
            gameId,
            quarterToProcess,
          });
          return;
        }

        // 🧩 Early lock to prevent reprocessing
        const gameRef = db.collection("games").doc(gameId);
        const gameSnap = await gameRef.get();
        const alreadyProcessed = gameSnap.get(
          `quarterScores.${quarterToProcess}.processed`,
        );

        if (alreadyProcessed) {
          console.log("✅ Quarter already processed, skipping", {
            gameId,
            quarterToProcess,
          });
          return;
        }

        await gameRef.update({
          [`quarterScores.${quarterToProcess}.processed`]: true,
          [`quarterScores.${quarterToProcess}.lockedAt`]:
            admin.firestore.FieldValue.serverTimestamp(),
        });

        // Compute winning positions
        const homeLastDigit = Math.abs(Number(quarterScore.home)) % 10;
        const awayLastDigit = Math.abs(Number(quarterScore.away)) % 10;

        const winningPositions = Array.from(
          new Set([
            `${homeLastDigit}${awayLastDigit}`.padStart(2, "0"),
            `${awayLastDigit}${homeLastDigit}`.padStart(2, "0"),
          ]),
        );

        console.log("🧮 Computed winning digits", {
          gameId,
          quarterToProcess,
          homeLastDigit,
          awayLastDigit,
          winningPositions,
        });

        // Fetch boards
        const boardsSnapshot = await db
          .collection("boards")
          .where("gameId", "==", gameId)
          .get();

        console.log("✅ Boards found", {
          gameId,
          count: boardsSnapshot.size,
        });

        const actions = [];
        const winnerUserIds = [];

        for (const boardDoc of boardsSnapshot.docs) {
          const board = boardDoc.data();
          const boardId = boardDoc.id;
          console.log("📝 Processing Board", { gameId, boardId });

          // ================================================
          // Quarter-by-Quarter Activation Defense
          // ================================================
          // Each position may activate multiple times across different quarters.
          // The "quarter" field in duplicate prevention ensures:
          // 1. Same position can activate in different quarters
          // 2. Each activation is a separate contest
          // 3. Each creates independent winner records with separate prizes
          // ================================================
          for (const position of winningPositions) {
            console.log("➡️ Checking position", { gameId, position });
            const square = board.squares?.[position];
            console.log("Square data", { gameId, position, square });

            if (!square?.claims?.length) continue;

            // 🧮 Determine winner (solo or fastest)
            if (square.claims.length === 1) {
              const onlyClaim = square.claims[0];
              winnerUserIds.push(onlyClaim.userId);

              // Telegram notify
              try {
                const winnerUserSnap = await db
                  .collection("users")
                  .doc(onlyClaim.userId)
                  .get();
                const winnerTelegramId =
                  winnerUserSnap.exists && winnerUserSnap.data().telegramChatId
                    ? winnerUserSnap.data().telegramChatId
                    : null;
                if (winnerTelegramId) {
                  await sendTelegramNotification(
                    winnerTelegramId,
                    `🎉 Congratulations! 🎉 You’ve won in *Quarter ${quarterToProcess.toUpperCase()}* 🏆🔥`,
                  );
                }
              } catch (err) {
                console.error("Telegram notify failed", err);
              }

              console.log("🏆 Solo winner found", {
                gameId,
                boardId,
                quarter: quarterToProcess,
                position,
                userId: onlyClaim.userId,
                answerTime: onlyClaim.answerTime,
              });

              actions.push(async () => {
                await processWinner({
                  userId: onlyClaim.userId,
                  gameId,
                  boardId,
                  quarter: quarterToProcess,
                  position,
                  tierId: board.tierId,
                  answerTime: onlyClaim.answerTime,
                  isSoloWin: true,
                });
              });
            } else {
              // Multiple claims → sort by fastest
              const sorted = [...square.claims].sort(
                (a, b) => a.answerTime - b.answerTime,
              );
              const winner = sorted[0];
              const loser = sorted[1];
              winnerUserIds.push(winner.userId);

              // Telegram notify
              try {
                const winnerUserSnap = await db
                  .collection("users")
                  .doc(winner.userId)
                  .get();
                const winnerTelegramId =
                  winnerUserSnap.exists && winnerUserSnap.data().telegramChatId
                    ? winnerUserSnap.data().telegramChatId
                    : null;
                if (winnerTelegramId) {
                  await sendTelegramNotification(
                    winnerTelegramId,
                    `🎉 Congratulations! 🎉\n\nYou’ve won in *Quarter ${quarterToProcess.toUpperCase()}* 🏆🔥`,
                  );
                }
              } catch (err) {
                console.error("Telegram notify failed", err);
              }

              console.log("🏆 Winner", {
                gameId,
                boardId,
                quarter: quarterToProcess,
                position,
                userId: winner.userId,
                answerTime: winner.answerTime,
              });
              console.log("❌ Loser", {
                gameId,
                boardId,
                quarter: quarterToProcess,
                position,
                userId: loser.userId,
                answerTime: loser.answerTime,
              });

              actions.push(async () => {
                // Winner
                await processWinner({
                  userId: winner.userId,
                  gameId,
                  boardId,
                  quarter: quarterToProcess,
                  position,
                  tierId: board.tierId,
                  answerTime: winner.answerTime,
                  isSoloWin: false,
                  opponentTime: loser.answerTime,
                  looserUserId: loser.userId,
                });

                // Loser
                await processLoser({
                  userId: loser.userId,
                  gameId,
                  boardId,
                  quarter: quarterToProcess,
                  position,
                  tierId: board.tierId,
                  answerTime: loser.answerTime,
                  winnerTime: winner.answerTime,
                  winnerId: winner.userId,
                });

                // Remove loser from board
                const updatedClaims = square.claims.filter(
                  (c) => c.userId !== loser.userId,
                );
                await db
                  .collection("boards")
                  .doc(boardId)
                  .update({
                    [`squares.${position}.claims`]: updatedClaims,
                    claimedSquares: admin.firestore.FieldValue.increment(-1),
                  });
              });
            }
          }
        }

        if (actions.length > 0) {
          console.log("✅ Winner/loser actions found", {
            gameId,
            quarterToProcess,
            actionsCount: actions.length,
          });

          await Promise.all(actions.map((fn) => fn()));
          console.log("🔖 Marking quarter as processed", {
            gameId,
            quarterToProcess,
            winningPositions,
            winnerUserIds,
          });
          await gameRef.update({
            [`quarterScores.${quarterToProcess}.processedAt`]:
              admin.firestore.FieldValue.serverTimestamp(),
            [`quarterScores.${quarterToProcess}.winningPositions`]:
              winningPositions,
            [`quarterScores.${quarterToProcess}.winnerUserIds`]: winnerUserIds,
          });
        } else {
          console.log("⚠️ No winners found", { gameId, quarterToProcess });
        }

        // ================================================
        // Award Board Champion (Q4 only)
        // Determined by fastest answer time across entire board,
        // independent of Square winners or sporting event outcome
        // ================================================
        if (quarterToProcess === "q4") {
          console.log("🏆 Determining board champions for game", { gameId });
          for (const boardDoc of boardsSnapshot.docs) {
            const board = boardDoc.data();
            await determineAndAwardBoardChampion(boardDoc.id, board, gameId);
          }
        }
      });

      await Promise.all(perGameTasks);
      console.log("🏁 Winner determination complete for all games");
      return null;
    } catch (err) {
      console.error("💥 Error in determineWinners", err);
      return null;
    }
  });

/**
 * Board Champion Award
 * Determines and awards board champion based on fastest correct answer time.
 * Runs immediately when Q4 is processed (not dependent on cleanup job).
 * Fields isFastest, sportingEventIndependent, and winType mark it as
 * independent of game outcome and square winners.
 */
async function determineAndAwardBoardChampion(boardId, boardData, gameId) {
  try {
    // 1. Find fastest claim across entire board
    let fastest = null;

    for (const [position, square] of Object.entries(boardData.squares || {})) {
      if (!square.claims || square.claims.length === 0) continue;

      for (const claim of square.claims) {
        if (!fastest || claim.answerTime < fastest.time) {
          fastest = {
            userId: claim.userId,
            time: claim.answerTime,
            position: String(position),
            quarter: claim.currentQuarter,
          };
        }
      }
    }

    if (!fastest) {
      console.log(`⚠️ No claims found on board ${boardId}, skipping board champion`);
      return;
    }

    // 2. Check if champion already awarded (prevent duplicates)
    const existingChampion = await db
      .collection("winners")
      .where("boardId", "==", boardId)
      .where("gameId", "==", gameId)
      .where("isFastest", "==", true)
      .limit(1)
      .get();

    if (!existingChampion.empty) {
      console.log(`⏭️ Board champion already awarded for ${boardId}, skipping.`);
      return;
    }

    // 3. Create champion winner record
    const tierId = boardData.tierId;
    const tierAmounts = {
      tier_25: { quarter: 200 },
      tier_50: { quarter: 450 },
      tier_100: { quarter: 900 },
      tier_250: { quarter: 2250 },
      tier_500: { quarter: 4500 },
      tier_1000: { quarter: 9000 },
    };

    const prizeAmount = tierAmounts[tierId]?.quarter || 0;

    const winnerDoc = {
      boardId,
      gameId,
      tierId,
      quarter: 4,
      prizeAmount,
      answerTime: fastest.time,
      position: parseInt(fastest.position),
      userId: fastest.userId,
      payoutType: "standard",
      status: "pending_payout",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTelegramSend: false,
      isFastest: true,
      sportingEventIndependent: true,
      winType: "board_champion",
    };

    await db.collection("winners").add(winnerDoc);

    console.log(`🏆 Board Champion awarded for board ${boardId}`, {
      userId: fastest.userId,
      time: fastest.time,
      position: fastest.position,
      prizeAmount,
    });

    // 4. Send Telegram notification
    try {
      const userSnap = await db.collection("users").doc(fastest.userId).get();
      if (userSnap.exists) {
        const telegramId = userSnap.data().telegramChatId;
        if (telegramId) {
          const tierName = TIER_CONFIG[tierId]?.name || tierId;
          const message =
            `🏆 *BOARD CHAMPION* 🏆\n\n` +
            `Fastest Answer: *${fastest.time}s* on Square ${fastest.position}\n` +
            `Tier: ${tierName}\n` +
            `Prize: $${prizeAmount}\n\n` +
            `Congratulations! You dominated the entire board! 🎉🔥`;

          await sendTelegramNotification(telegramId, message);
        }
      }
    } catch (err) {
      console.error("📱 Board champion Telegram notification failed", err);
    }

    // 5. Update board with champion info
    await db.collection("boards").doc(boardId).update({
      fastest: {
        userId: fastest.userId,
        time: fastest.time,
        position: parseInt(fastest.position),
        awardedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      boardChampionAwarded: true,
    });
  } catch (error) {
    console.error("❌ Error determining board champion", {
      boardId,
      gameId,
      error: error.message,
    });
  }
}

async function processClaimForTeam(game, claim) {
  const { userId, answerTime, tokenId } = claim;
  const { sport, teams } = game;

  // 1. Load user
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) return;

  const userTeams = userSnap.data().teams || {};
  if (!userTeams[sport]) return;

  const favTeam = userTeams[sport];
  const gameTeams = [teams?.home, teams?.away];
  if (!gameTeams.includes(favTeam)) return;

  // 2. Reference sport-level document (e.g. teams/NFL)
  const sportDocRef = db.collection("teams").doc(sport);
  const sportDoc = await sportDocRef.get();

  let teamsData = {};
  if (sportDoc.exists) {
    teamsData = sportDoc.data().teams || {};
  }

  // 3. Get team data (or init new one)
  const teamData = teamsData[favTeam] || {
    answerCount: 0,
    processedClaims: [],
    fastestAnswer: null,
  };

  // ✅ Skip if this claim already processed
  if (teamData.processedClaims.includes(tokenId)) {
    console.log(`⏩ Claim ${tokenId} already processed for ${favTeam}`);
    return;
  }

  // 4. Update answerCount & processedClaims
  teamData.answerCount += 1;
  teamData.processedClaims.push(tokenId);

  // 5. Update fastestAnswer
  if (!teamData.fastestAnswer || answerTime < teamData.fastestAnswer.time) {
    teamData.fastestAnswer = { userId, time: answerTime };
  }

  // 6. Save back to Firestore
  await sportDocRef.set(
    {
      teams: {
        ...teamsData,
        [favTeam]: teamData,
      },
    },
    { merge: true },
  );

  console.log(`✅ Updated ${sport} - ${favTeam}`, teamData);
}

// cleanup-old-claims.js
async function cleanupOldClaims(boardId, board, currentQuarter, game) {
  const updates = {};
  let removedSquares = [];

  // Prize mapping
  const tierAmounts = {
    tier_25: { quarter: 200 },
    tier_50: { quarter: 450 },
    tier_100: { quarter: 900 },
    tier_250: { quarter: 2250 },
    tier_500: { quarter: 4500 },
    tier_1000: { quarter: 9000 },
  };

  let fastest = board.fastest || null;

  for (const [position, square] of Object.entries(board.squares || {})) {
    if (!square.claims || square.claims.length === 0) continue;

    for (const claim of square.claims) {
      await processClaimForTeam(game, claim);
    }

    // 1. Find the fastest claim in this square (using answerTime)
    const fastestClaim = square.claims.reduce(
      (best, c) => (!best || c.answerTime < best.answerTime ? c : best),
      null,
    );

    if (fastestClaim) {
      if (!fastest || fastestClaim.answerTime < fastest.time) {
        fastest = {
          userId: fastestClaim.userId,
          time: fastestClaim.answerTime,
          quarter: fastestClaim.currentQuarter,
        };
      }
    }

    // 2. Delete only if claims are from a processed older quarter
    const hasOldClaim = square.claims.some((c) => {
      const qKey = `q${c.currentQuarter}`;
      return (
        (c.currentQuarter < currentQuarter || // older quarters
          (c.currentQuarter === 4 && game.status === "completed")) && // Q4 when game over
        game.quarterScores?.[qKey]?.processed === true
      );
    });

    if (hasOldClaim) {
      updates[`squares.${position}`] = admin.firestore.FieldValue.delete();
      removedSquares.push(position);
    }
  }

  // Save updates + fastest tracker
  if (Object.keys(updates).length > 0 || fastest) {
    if (fastest) updates["fastest"] = fastest;
    await db.collection("boards").doc(boardId).update(updates);
  }

  // 3. Only add fastest winner once when Q4 is processed
  if (game.quarterScores?.q4?.processed && fastest) {
    const existingFastest = await db
      .collection("winners")
      .where("boardId", "==", boardId)
      .where("gameId", "==", board.gameId)
      .where("isFastest", "==", true)
      .limit(1)
      .get();

    if (!existingFastest.empty) {
      console.log(
        `⚠️ Fastest winner already exists for board ${boardId}, skipping.`,
      );
      return;
    }

    const tierId = board.tierId;
    const prizeAmount = tierAmounts[tierId]?.quarter || 0;

    const winnerDoc = {
      boardId,
      gameId: board.gameId,
      tierId,
      quarter: 4,
      prizeAmount,
      answerTime: fastest.time,
      userId: fastest.userId,
      payoutType: "standard",
      status: "pending_payout",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isTelegramSend: false,
      isFastest: true, // mark fastest winners
    };

    await db.collection("winners").add(winnerDoc);

    console.log(`🏆 Fastest winner added for board ${boardId}`, winnerDoc);
  }
}

exports.cleanupClaims = functions.pubsub
  .schedule("every 2 minutes")
  .onRun(async (context) => {
    console.log("🧹 Running scheduled cleanup job...");

    const boardsSnapshot = await db.collection("boards").get();
    console.log(`📊 Found ${boardsSnapshot.size} boards to check`);

    for (const boardDoc of boardsSnapshot.docs) {
      const board = boardDoc.data();
      const boardId = boardDoc.id;

      if (!board.gameId) {
        console.warn(`⚠️ Board ${boardId} has no gameId`);
        continue;
      }

      const gameSnap = await db.collection("games").doc(board.gameId).get();
      if (!gameSnap.exists) {
        console.warn(`⚠️ Game ${board.gameId} not found for board ${boardId}`);
        continue;
      }

      const game = gameSnap.data();
      const currentQuarter = game.currentQuarter || 1;

      console.log("➡️ Starting cleanup for board", {
        boardId,
        gameId: board.gameId,
        currentQuarter,
      });

      try {
        await cleanupOldClaims(boardId, board, currentQuarter, game);
        console.log("✅ Cleanup complete", { boardId, gameId: board.gameId });
      } catch (err) {
        console.error("💥 Cleanup failed", {
          boardId,
          gameId: board.gameId,
          error: err.message,
        });
      }
    }
  });

// Helper function to process winner
async function processWinner(winnerData) {
  const {
    userId,
    gameId,
    boardId,
    quarter,
    position,
    tierId,
    answerTime,
    isSoloWin,
    claimId,
    notificationStatus,
    reportedOn1099,
    opponentTime,
    instantPayoutFee,
    consolationSquareGranted,
    processedBy,
    looserUserId,
  } = winnerData;

  const tierAmounts = {
    tier_25: { quarter: 200 },
    tier_50: { quarter: 450 },
    tier_100: { quarter: 900 },
    tier_250: { quarter: 2250 },
    tier_500: { quarter: 4500 },
    tier_1000: { quarter: 9000 },
  };

  const prizeAmount = tierAmounts[tierId]?.quarter || 0;

  // ========================================
  // Independent Quarterly Activations
  // ========================================
  // Duplicate prevention uses quarter field, allowing the same square
  // to activate multiple times across different quarters. Each activation
  // (identified by unique userId+gameId+quarter+position+boardId) creates
  // a separate winner record with independent prize distribution.
  // Example: User A wins position 00 in Q1 → winner record created.
  //          User A wins position 00 in Q2 → different winner record (quarter differs).
  //          Both are valid, separate contests, each with separate prize.
  // ========================================
  const existingWinnerSnap = await db
    .collection("winners")
    .where("userId", "==", userId)
    .where("gameId", "==", gameId)
    .where("quarter", "==", quarter)
    .where("position", "==", position)
    .where("boardId", "==", boardId)
    .limit(1)
    .get();

  if (!existingWinnerSnap.empty) {
    console.log(
      `⚠️ Duplicate winner skipped: ${userId}, ${gameId}, ${quarter}, ${position}`,
    );
    return existingWinnerSnap.docs[0].id;
  }

  // ✅ Load user and game safely
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) throw new Error(`User ${userId} not found`);
  const userData = userSnap.data();
  const displayName =
    userData.displayName || userData.email || "Unknown Player";

  let displayLooserName = "";
  if (!isSoloWin && looserUserId) {
    const looserSnap = await db.collection("users").doc(looserUserId).get();
    const looserData = looserSnap.data();
    displayLooserName =
      looserData?.displayName || looserData?.email || "Unknown Player";
  }

  const gameSnap = await db.collection("games").doc(gameId).get();
  const game = gameSnap.data();
  const team1 = game.teams?.home || "Home Team";
  const team2 = game.teams?.away || "Away Team";
  const isPhotoFinish =
    opponentTime && Math.abs(answerTime - opponentTime) < 1000;

  // ✅ Create the winner record
  const winnerRef = await db.collection("winners").add({
    userId,
    user: {
      displayName,
      email: userData.email || null,
      photoURL: userData.photoURL || null,
    },
    gameInfo: {
      teams: game.teams || null,
      externalGameId: game.externalGameId || null,
    },
    isSoloWin: isSoloWin || false,
    claimId: claimId || null,
    notificationStatus: notificationStatus || "pending",
    reportedOn1099: reportedOn1099 || false,
    opponentTime: opponentTime || null,
    instantPayoutFee: instantPayoutFee || null,
    consolationSquareGranted: consolationSquareGranted || false,
    processedBy: processedBy || null,
    gameId,
    boardId,
    quarter,
    position,
    tierId,
    prizeAmount,
    answerTime,
    payoutMethodId: null,
    payoutType: "standard",
    status: "pending_payout",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isTelegramSend: false,
  });

  // ✅ Update user’s totals
  await db
    .collection("users")
    .doc(userId)
    .update({
      totalWins: admin.firestore.FieldValue.increment(1),
      totalWinnings: admin.firestore.FieldValue.increment(prizeAmount),
    });

  // ✅ Update game quarter data
  await db
    .collection("games")
    .doc(gameId)
    .update({
      [`quarterScores.${quarter}.winnerUserId`]: userId,
    });

  // ✅ Post to Telegram / Social

  const captionLink = "https://squaretrivia.com";
  const tierValue = Number(tierId.split("_")[1]);
  const isBigWin = tierValue >= 100;

  if (isBigWin) {
    const formValues = {
      wPrice: prizeAmount,
      winner: getFirstWord(displayName),
      HTeam: getShortCode(team1) || "TBD",
      ATeam: getShortCode(team2) || "TBD",
      sq: position,
      winTime: answerTime,
    };
    const selectedTemplate = "bigWin";
    const payload = {
      templateID: selectedTemplate,
      data: formValues,
      savePath: `savedimages/${gameId}/${boardId}/${selectedTemplate}.jpg`,
    };
    let imageUrl = "https://squaretrivia.com/apple-touch-icon.png"; // default fallback

    try {
      const imageResult = await generateImage(payload);

      if (imageResult && imageResult.response === "success") {
        imageUrl = imageResult.path; // use generated image if successful
      } else {
        console.warn("Image generation failed:", imageResult);
      }
    } catch (err) {
      console.error("Image generation error:", err);
    }
    BigWinPost({
      winner: displayName,
      prize: prizeAmount,
      time: answerTime,
      team1,
      team2,
      square: position,
      mediaToUpload: imageUrl,
      captionLink,
    });
  } else {
    const formValues = {
      wPrice: prizeAmount,
      winner: getFirstWord(displayName),
      HTeam: getShortCode(team1) || "TBD",
      ATeam: getShortCode(team2) || "TBD",
      sq: position,
      time: answerTime,
    };
    const selectedTemplate = "winner";
    const payload = {
      templateID: selectedTemplate,
      data: formValues,
      savePath: `savedimages/${gameId}/${boardId}/${selectedTemplate}.jpg`,
    };
    let imageUrl = "https://squaretrivia.com/apple-touch-icon.png"; // default fallback

    try {
      const imageResult = await generateImage(payload);

      if (imageResult && imageResult.response === "success") {
        imageUrl = imageResult.path; // use generated image if successful
      } else {
        console.warn("Image generation failed:", imageResult);
      }
    } catch (err) {
      console.error("Image generation error:", err);
    }
    StandardWinPost({
      winner: displayName,
      prize: prizeAmount,
      time: answerTime,
      team1,
      team2,
      square: position,
      mediaToUpload: imageUrl,
      captionLink,
    });
  }

  if (isPhotoFinish) {
    const formValues = {
      wPrice: prizeAmount,
      winner: getFirstWord(displayName),
      HTeam: getShortCode(team1) || "TBD",
      ATeam: getShortCode(team2) || "TBD",
      lTime: opponentTime,
      wTime: answerTime,
      diff: Math.round((opponentTime - answerTime) * 1000) / 1000,
    };
    const selectedTemplate = "photoFinish";
    const payload = {
      templateID: selectedTemplate,
      data: formValues,
      savePath: `savedimages/${gameId}/${boardId}/${selectedTemplate}.jpg`,
    };
    let imageUrl = "https://squaretrivia.com/apple-touch-icon.png"; // default fallback

    try {
      const imageResult = await generateImage(payload);

      if (imageResult && imageResult.response === "success") {
        imageUrl = imageResult.path; // use generated image if successful
      } else {
        console.warn("Image generation failed:", imageResult);
      }
    } catch (err) {
      console.error("Image generation error:", err);
    }
    PhotoFinishPost({
      winner: getFirstWord(displayName),
      loser: getFirstWord(displayLooserName),
      diff: Math.round((opponentTime - answerTime) * 1000) / 1000,
      winTime: answerTime,
      loseTime: opponentTime,
      mediaToUpload: imageUrl,
      captionLink,
    });
  }

  console.log(`🏆 Winner processed: ${displayName} - $${prizeAmount}`);
  return winnerRef.id;
}

// Helper function to process loser
async function processLoser(loserData) {
  const { userId, boardId, position, tierId, winnerTime, quarter } = loserData;

  const looserUserSnap = await db.collection("users").doc(userId).get();
  let looserTelegramId = null;
  console.log(`LOOSER: ${JSON.stringify(looserUserSnap.data())}`);

  if (looserUserSnap.exists) {
    looserTelegramId = looserUserSnap.data().telegramChatId || null;
    console.log(`LOOSER TELEGRAM EXIST: ${looserTelegramId}`);
  }

  // ========================================
  // Consolation Credit — Universal $25
  // Always 1x Entry tier ($25) regardless of loss tier
  // ========================================
  const consolationCount = CONSOLATION_CONFIG.CREDITS_PER_LOSS;  // Always 1
  const consolationTier = CONSOLATION_CONFIG.TIER;               // Always "tier_25"

  if (looserTelegramId) {
    console.log(`LOOSER TELEGRAM MESSAGE STARTS: ${looserTelegramId}`);
    await sendTelegramNotification(
      looserTelegramId,
      `
❌ Tough Luck! ❌

You didn’t win in *Quarter ${quarter.toUpperCase()}* this time.  
But don’t worry – you’ve earned **${consolationCount} consolation chance${
        consolationCount > 1 ? "s" : ""
      }** for the next rounds. 💪

Stay sharp, your comeback is coming! 🔥
`,
    );
    console.log(`LOOSER MESSAGE SENT`);
  }

    // Create consolation record with original loss tier tracking
  await db.collection("consolations").add({
    userId,
    originalBoardId: boardId,
    originalPosition: position,
    originalBoardTierId: tierId,          // Track which tier the loss occurred on
    consolationTier: consolationTier,
    consolationCount: consolationCount,
    consolationAmount: CONSOLATION_CONFIG.AMOUNT,  // $25
    winnerTime,
    usedCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Send strategic notification
  await sendLoserNotification(userId, position, winnerTime, consolationCount);
}

// ==========================================
// PAYMENT PROCESSING
// ==========================================

exports.createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    functions.logger.info("createCheckoutSession called", {
      data,
      auth: context.auth ? { uid: context.auth.uid } : null,
    });

    // Auth check
    if (!context.auth) {
      functions.logger.warn("Unauthenticated request");
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in",
      );
    }

    const { boardId, squarePosition, boardPrice } = data;
    const userId = context.auth.uid;

    functions.logger.debug("Parsed request data", {
      userId,
      boardId,
      squarePosition,
      boardPrice,
    });
    // Validation
    if (!boardId || squarePosition === undefined || !boardPrice) {
      functions.logger.error("Missing required parameters", {
        boardId,
        squarePosition,
        boardPrice,
      });

      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing boardId, squarePosition, or boardPrice",
      );
    }

    if (typeof boardPrice !== "number" || boardPrice <= 0) {
      functions.logger.error("Invalid board price", { boardPrice });

      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid board price",
      );
    }

    // Create payment record
    const paymentRef = admin.firestore().collection("payments").doc();
    const paymentId = paymentRef.id;

    functions.logger.info("Creating payment record", {
      paymentId,
      userId,
      boardId,
      squarePosition,
      amount: boardPrice,
    });

    await paymentRef.set({
      userId,
      boardId,
      squarePosition,
      amount: boardPrice,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      const DOMAIN = process.env.DOMAIN || "http://localhost:3000";

      functions.logger.info("Creating Stripe checkout session", {
        paymentId,
        DOMAIN,
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Square ${squarePosition}`,
                description: `Square ${squarePosition} - Individual Contest Entry`,
              },
              unit_amount: boardPrice,
            },
            quantity: 1,
          },
        ],
        success_url: `${DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${DOMAIN}/payment-cancel`,
        metadata: {
          paymentId,
          userId,
          boardId,
          squarePosition,
          amount: boardPrice,
        },
      });

      functions.logger.info("Stripe checkout session created", {
        paymentId,
        sessionId: session.id,
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      functions.logger.error("Stripe checkout session failed", {
        paymentId,
        error: error.message,
        stack: error.stack,
      });

      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);
exports.createCheckoutSession1 = functions.https.onCall(
  async (data, context) => {
    functions.logger.info("createCheckoutSession called", {
      data,
      auth: context.auth ? { uid: context.auth.uid } : null,
    });

    // Auth check
    if (!context.auth) {
      functions.logger.warn("Unauthenticated request");
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in",
      );
    }

    const { boardId, squarePosition, boardPrice } = data;
    const userId = context.auth.uid;

    functions.logger.debug("Parsed request data", {
      userId,
      boardId,
      squarePosition,
      boardPrice,
    });

    // Validation
    if (!boardId || squarePosition === undefined || !boardPrice) {
      functions.logger.error("Missing required parameters", {
        boardId,
        squarePosition,
        boardPrice,
      });

      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing boardId, squarePosition, or boardPrice",
      );
    }

    if (typeof boardPrice !== "number" || boardPrice <= 0) {
      functions.logger.error("Invalid board price", { boardPrice });

      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid board price",
      );
    }

    // Create payment record
    const paymentRef = admin.firestore().collection("payments").doc();
    const paymentId = paymentRef.id;

    functions.logger.info("Creating payment record", {
      paymentId,
      userId,
      boardId,
      squarePosition,
      amount: boardPrice,
    });

    await paymentRef.set({
      userId,
      boardId,
      squarePosition,
      amount: boardPrice,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      const DOMAIN = process.env.DOMAIN || "http://localhost:3000";

      functions.logger.info("Creating Stripe checkout session", {
        paymentId,
        DOMAIN,
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Square ${squarePosition}`,
                description: `Square ${squarePosition} - Individual Contest Entry`,
              },
              unit_amount: boardPrice,
            },
            quantity: 1,
          },
        ],
        success_url: `${DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${DOMAIN}/payment-cancel`,
        metadata: {
          paymentId,
          userId,
          boardId,
          squarePosition,
          amount: boardPrice,
        },
      });

      functions.logger.info("Stripe checkout session created", {
        paymentId,
        sessionId: session.id,
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      functions.logger.error("Stripe checkout session failed", {
        paymentId,
        error: error.message,
        stack: error.stack,
      });

      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);

exports.verifyCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in",
      );
    }

    const { sessionId } = data;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent", "payment_intent.latest_charge"],
      });

      if (session.payment_status !== "paid") {
        return { success: false, message: "Payment not completed" };
      }

      const paymentIntent = session.payment_intent;
      const charge = paymentIntent?.latest_charge;

      const eventRef = db
        .collection("stripeEvents")
        .doc(`manual-${session.id}`);
      const eventDoc = await eventRef.get();
      if (eventDoc.exists) {
        console.log(
          `⚠️ Duplicate verification detected for session ${session.id}`,
        );
        return {
          success: true,
          tier: session.metadata?.tierId,
          donationId: session.metadata?.donationId,
          alreadyProcessed: true,
        };
      }

      await eventRef.set({
        type: "checkout.session.completed",
        processed: false,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          sessionId: session.id,
          paymentIntentId: paymentIntent?.id,
          chargeId: charge?.id,
        },
      });

      // 3. Run your handlers
      if (paymentIntent?.status === "succeeded") {
        await handleSuccessfulPayment(session);
      } else if (paymentIntent?.status === "requires_payment_method") {
        await handleFailedPayment(session);
      }

      if (charge && charge.refunded) {
        await handleRefund(charge);
      }

      // 4. Mark as processed
      await eventRef.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Return result
      return {
        success: true,
        tier: session.metadata?.tierId,
        donationId: session.metadata?.donationId,
      };
    } catch (error) {
      console.error("Verification error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);

exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Respond immediately
  res.status(200).json({ received: true });

  // ⏳ Process asynchronously
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        await grantTierAccess(
          session.metadata.userId,
          session.metadata.tierId,
          session.metadata.gameId,
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Error processing Stripe webhook:", err);
  }
});

async function grantTierAccess(userId, tierId, gameId) {
  // Update user's tier access
  await db
    .collection("users")
    .doc(userId)
    .update({
      [`tierAccess.${tierId}`]: true,
      currentTiers: admin.firestore.FieldValue.arrayUnion(tierId),
      lastPurchase: admin.firestore.FieldValue.serverTimestamp(),
    });

  // Create access record
  await db.collection("tierAccess").add({
    userId,
    tierId,
    gameId,
    grantedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: null, // No expiration
  });

  // Send to trivia immediately
  await createTriviaSession(userId, tierId);
}

exports.processPayout = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { winnerId, method } = data; // method: 'instant' or 'batch'

  try {
    const winnerDoc = await db.collection("winners").doc(winnerId).get();
    if (!winnerDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Winner not found");
    }

    const winner = winnerDoc.data();
    const payoutAmount =
      method === "instant"
        ? winner.prizeAmount * 0.92 // 8% fee
        : winner.prizeAmount; // 100% for batch

    // Process via Stripe, PayPal, Venmo, etc.
    // This is a placeholder - implement actual payout logic
    const payoutResult = await processPaymentProvider(
      winner.userId,
      payoutAmount,
      method,
    );

    // Update winner record
    await winnerDoc.ref.update({
      status: "paid",
      payoutMethod: method,
      payoutAmount,
      payoutId: payoutResult.id,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user's payout history
    await db
      .collection("users")
      .doc(winner.userId)
      .update({
        totalPaidOut: admin.firestore.FieldValue.increment(payoutAmount),
        lastPayout: admin.firestore.FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      payoutId: payoutResult.id,
      amount: payoutAmount,
    };
  } catch (error) {
    console.error("Process payout error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ==========================================
// TRIVIA SYSTEM
// ==========================================

exports.validateAnswer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in",
    );
  }

  const { sessionId, questionId, answer, answerTime } = data;
  const userId = context.auth.uid;

  try {
    // Get session
    const sessionDoc = await db
      .collection("triviaSessions")
      .doc(sessionId)
      .get();
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Session not found");
    }

    const session = sessionDoc.data();

    // Verify session belongs to user
    if (session.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Invalid session",
      );
    }

    // Get question
    const questionDoc = await db.collection("trivia").doc(questionId).get();
    if (!questionDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Question not found");
    }

    const question = questionDoc.data();

    // Check answer
    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      // Generate square token
      const tokenRef = await db.collection("accessTokens").add({
        userId,
        tierId: session.tierId,
        answerTime: answerTime,
        questionId,
        sessionId,
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        ),
      });

      // Update session
      await sessionDoc.ref.update({
        answered: true,
        answeredAt: admin.firestore.FieldValue.serverTimestamp(),
        tokenId: tokenRef.id,
      });

      return {
        correct: true,
        tokenId: tokenRef.id,
        message: "Correct! You earned a square token.",
      };
    } else {
      // Wrong answer
      await sessionDoc.ref.update({
        answered: true,
        answeredAt: admin.firestore.FieldValue.serverTimestamp(),
        wasCorrect: false,
      });

      return {
        correct: false,
        correctAnswer: question.correctAnswer,
        message: "Incorrect answer. Try again next time!",
      };
    }
  } catch (error) {
    console.error("Validate answer error:", error);
    throw error;
  }
});

// ==========================================
// NOTIFICATION HELPERS
// ==========================================

async function sendWinnerNotification(userId, amount, quarter) {
  // Get user data
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data();

  // Send Telegram notification if available
  if (userData.telegramChatId) {
    await sendTelegramMessage(
      userData.telegramChatId,
      `🎉 YOU WON $${amount}!\n\nQuarter: ${quarter}\nChoose payout method in the app.`,
    );
  }

  // Queue email notification
  await db.collection("notifications").add({
    userId,
    type: "win",
    title: "You Won!",
    message: `Congratulations! You won $${amount} in ${quarter}.`,
    data: { amount, quarter },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function sendLoserNotification(
  userId,
  position,
  winnerTime,
  consolationCount,
) {
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data();

  const message =
    `Square ${position} was won by someone with ${winnerTime}s.\n\n` +
    `You got ${consolationCount} consolation question(s)!\n\n` +
    `TIP: Try to reclaim this square - you know you need under ${winnerTime}s!`;

  if (userData.telegramChatId) {
    await sendTelegramMessage(
      userData.telegramChatId,
      `⏱️ Close Call!\n\n${message}`,
    );
  }

  await db.collection("notifications").add({
    userId,
    type: "consolation",
    title: "Consolation Prize!",
    message,
    data: { position, winnerTime, consolationCount },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Placeholder functions to be implemented
async function createTriviaSession(userId, tierId) {
  // Implementation needed
}

async function processPaymentProvider(userId, amount, method) {
  // Implementation needed - Stripe Connect, PayPal, etc.
  return { id: "payout_" + Date.now() };
}

async function sendTelegramMessage(chatId, message) {
  // Implementation needed - Telegram Bot API
}
exports.convertSvgToJpg = functions.https.onCall(async (payload, context) => {
  try {
    const { templateID, data, saveAt } = payload;

    const templatePath = path.join(__dirname, "templates", `${templateID}.svg`);
    let svgContent = await fs.readFile(templatePath, "utf-8");

    svgContent = svgContent.replace(/{([^}]+)}/g, (m, key) => data[key] ?? "");

    const jpgBuffer = await sharp(Buffer.from(svgContent))
      .jpeg({ quality: 90 })
      .toBuffer();

    const file = bucket.file(saveAt);
    await file.save(jpgBuffer, {
      metadata: { contentType: "image/jpeg" },
      public: true,
    });

    const url = `https://storage.googleapis.com/${bucket.name}/${saveAt}`;
    return { response: "success", path: url };
  } catch (err) {
    console.error("convertSvgToJpg error:", err);
    return { response: "failed", error: err.message };
  }
});

// -------------------
// Helper: Generate Image Programmatically
// -------------------
async function generateImage({ templateID, data, savePath }) {
  try {
    const templatePath = path.join(__dirname, "templates", `${templateID}.svg`);
    let svgContent = await fs.readFile(templatePath, "utf-8");

    svgContent = svgContent.replace(
      /{([^}]+)}/g,
      (match, key) => data[key] ?? "",
    );

    const jpgBuffer = await sharp(Buffer.from(svgContent))
      .jpeg({ quality: 90 })
      .toBuffer();

    const file = bucket.file(savePath);
    await file.save(jpgBuffer, {
      metadata: { contentType: "image/jpeg" },
      public: true,
    });

    const url = `https://storage.googleapis.com/${bucket.name}/${savePath}`;
    return { response: "success", path: url };
  } catch (err) {
    console.error("generateImage error:", err);
    return { response: "failed", error: err.message };
  }
}

// -------------------
// Optional: Push All Templates to Bucket
// -------------------
async function pushAllTemplatesToBucket() {
  try {
    const templatesDir = path.join(__dirname, "templates");
    const files = await fs.readdir(templatesDir);

    for (const fileName of files) {
      if (!fileName.endsWith(".svg")) continue;

      const templateID = fileName.replace(".svg", "");
      const templatePath = path.join(templatesDir, fileName);
      const svgContent = await fs.readFile(templatePath, "utf-8");

      const jpgBuffer = await sharp(Buffer.from(svgContent))
        .jpeg({ quality: 90 })
        .toBuffer();

      const savePath = `templates/${templateID}.jpg`;
      const file = bucket.file(savePath);

      await file.save(jpgBuffer, {
        metadata: { contentType: "image/jpeg" },
        public: true,
      });

      console.log(`Uploaded ${savePath} to bucket`);
    }
    console.log("All templates pushed to bucket successfully!");
  } catch (err) {
    console.error("pushAllTemplatesToBucket error:", err);
  }
}

module.exports = {
  createGame: exports.createGame,
  claimSquare: exports.claimSquare,
  determineWinners: exports.determineWinners,
  cleanupClaims: exports.cleanupClaims,
  createCheckoutSession: exports.createCheckoutSession,
  createCheckoutSession1: exports.createCheckoutSession1,
  verifyCheckoutSession: exports.verifyCheckoutSession,
  handleStripeWebhook: exports.handleStripeWebhook,
  processPayout: exports.processPayout,
  validateAnswer: exports.validateAnswer,
  convertSvgToJpg: exports.convertSvgToJpg,
  generateImage,
  pushAllTemplatesToBucket,
};
