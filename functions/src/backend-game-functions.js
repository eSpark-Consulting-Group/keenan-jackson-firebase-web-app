// Square Trivia - Core Backend Game Functions
// Complete implementations for missing functions

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { TIERS } = require("./constants-configuration-fixed");
const {
  handleSuccessfulPayment,
  handleFailedPayment,
  handleRefund,
} = require("./payment-system-modified");
const { logger } = require("firebase-functions");

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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
  } = data;

  try {
    const parsedDate = new Date(gameDate);
    if (isNaN(parsedDate.getTime())) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid gameDate format"
      );
    }
    // Create game document
    const gameRef = await db.collection("games").add({
      teams,
      gameDate: admin.firestore.Timestamp.fromDate(parsedDate),
      gameType,
      sport,
      externalGameId,
      status: "scheduled",
      currentQuarter: 0,
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

    // Create boards for each enabled tier
    const boardPromises = enabledTiers.map((tierId) =>
      createBoardForTier(gameRef.id, tierId)
    );

    await Promise.all(boardPromises);

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
    totalSquares: 50,
    claimedSquares: 0,
    maxPlayersPerSquare: 2,
    status: "open",
    isActive: true,
    gameInfo,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return boardRef.id;
}

// ==========================================
// SQUARE CLAIMING WITH TRIVIA
// ==========================================

exports.claimSquare = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
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
        "Token does not belong to user"
      );
    }

    if (token.used) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Token already used"
      );
    }

    if (token.expiresAt.toMillis() < Date.now()) {
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        "Token expired"
      );
    }

    // Get board and check availability
    const boardRef = db.collection("boards").doc(boardId);
    const boardDoc = await boardRef.get();

    if (!boardDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Board not found");
    }

    const board = boardDoc.data();
    const squares = board.squares || {};
    const squareData = squares[squarePosition] || { claims: [] };

    // Check if square is full
    if (squareData.claims && squareData.claims.length >= 2) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Square is full"
      );
    }

    // Check if user already has this square
    if (
      squareData.claims &&
      squareData.claims.some((claim) => claim.userId === userId)
    ) {
      throw new functions.https.HttpsError(
        "already-exists",
        "You already have this square"
      );
    }

    // Add claim to square
    const newClaim = {
      userId,
      tokenId,
      answerTime: answerTime / 1000, // Convert to seconds
      // claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimedAt: new Date(), // ✅ becomes a Firestore Timestamp
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
    console.log("Checking for winners...");

    try {
      // Get active games
      const gamesSnapshot = await db
        .collection("games")
        .where("status", "in", ["active", "in_progress"])
        .get();

      if (gamesSnapshot.empty) {
        console.log("No active games");
        return null;
      }

      // 2) Process each game independently
      const perGameTasks = gamesSnapshot.docs.map(async (gameDoc) => {
        const game = gameDoc.data();
        const gameId = gameDoc.id;

        const quarters = ["q1", "q2", "q3", "q4"];
        for (const quarter of quarters) {
          const quarterScore = game.quarterScores?.[quarter];

          // Skip if quarter doesn't exist, has no scores yet, or already processed
          if (!quarterScore || quarterScore.processed) continue;

          // Compute the two winning positions for this quarter's digits
          const homeLastDigit = Number(quarterScore.home) % 10;
          const awayLastDigit = Number(quarterScore.away) % 10;
          const winningPositions = [
            homeLastDigit * 10 + awayLastDigit, // home-away
            awayLastDigit * 10 + homeLastDigit, // away-home
          ];

          // 2a) Find all boards for this game
          const boardsSnapshot = await db
            .collection("boards")
            .where("gameId", "==", gameId)
            .get();

          // Collect work first; don't mark processed unless we have at least one winner
          const actions = []; // each action is an async function we'll run later

          for (const boardDoc of boardsSnapshot.docs) {
            const board = boardDoc.data();
            const boardId = boardDoc.id;

            for (const position of winningPositions) {
              const square = board.squares?.[position];
              if (!square || !square.claims || square.claims.length === 0)
                continue;

              if (square.claims.length === 1) {
                // Solo winner
                const onlyClaim = square.claims[0];
                actions.push(async () => {
                  await processWinner({
                    userId: onlyClaim.userId,
                    gameId,
                    boardId,
                    quarter,
                    position,
                    tierId: board.tierId,
                    answerTime: onlyClaim.answerTime,
                    isSoloWin: true,
                  });
                });
              } else {
                // Multiple claimants: fastest wins
                const sorted = [...square.claims].sort(
                  (a, b) => a.answerTime - b.answerTime
                );
                const winner = sorted[0];
                const loser = sorted[1];
                logger.info(`WINNER: ${winner}`);

                actions.push(async () => {
                  // Winner
                  await processWinner({
                    userId: winner.userId,
                    gameId,
                    boardId,
                    quarter,
                    position,
                    tierId: board.tierId,
                    answerTime: winner.answerTime,
                    isSoloWin: false,
                    opponentTime: loser.answerTime,
                  });

                  // Loser
                  await processLoser({
                    userId: loser.userId,
                    gameId,
                    boardId,
                    quarter,
                    position,
                    tierId: board.tierId,
                    answerTime: loser.answerTime,
                    winnerTime: winner.answerTime,
                    winnerId: winner.userId,
                  });

                  // Remove loser from the square on this board
                  const updatedClaims = square.claims.filter(
                    (c) => c.userId !== loser.userId
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

          // 2b) If we found at least one winner action, run them then mark THIS quarter processed
          if (actions.length > 0) {
            console.log(
              `Game ${gameId} / ${quarter}: ${actions.length} winner/loser actions`
            );

            // Run all winner/loser updates for this quarter
            for (const act of actions) {
              await act();
            }

            // Now mark ONLY this quarter on ONLY this game as processed
            await gameDoc.ref.update({
              [`quarterScores.${quarter}.processed`]: true,
              [`quarterScores.${quarter}.processedAt`]:
                admin.firestore.FieldValue.serverTimestamp(),
              // (optional) store which positions matched for debugging/analytics
              [`quarterScores.${quarter}.winningPositions`]: winningPositions,
            });
          } else {
            // No winners yet for this quarter -> leave unprocessed so it can retry next run
            console.log(
              `Game ${gameId} / ${quarter}: no winners yet, skipping`
            );
          }
        }
      });

      await Promise.all(perGameTasks);
      console.log("Winner determination complete");
      return null;
    } catch (err) {
      console.error("Determine winners error:", err);
      return null;
    }
  });

// Helper function to process winner
async function processWinner(winnerData) {
  const { userId, gameId, boardId, quarter, position, tierId, answerTime } =
    winnerData;

  // Get tier info for prize amount
  const tierAmounts = {
    tier_25: { quarter: 200 },
    tier_50: { quarter: 450 },
    tier_100: { quarter: 900 },
    tier_250: { quarter: 2250 },
    tier_500: { quarter: 4500 },
    tier_1000: { quarter: 9000 },
  };

  const prizeAmount = tierAmounts[tierId]?.quarter || 0;

  // Create winner record
  const winnerRef = await db.collection("winners").add({
    userId,
    gameId,
    boardId,
    quarter,
    position,
    tierId,
    prizeAmount,
    answerTime,
    status: "pending_payout",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...winnerData,
  });

  // Update user's win count
  await db
    .collection("users")
    .doc(userId)
    .update({
      totalWins: admin.firestore.FieldValue.increment(1),
      totalWinnings: admin.firestore.FieldValue.increment(prizeAmount),
    });

  // Send notification
  await sendWinnerNotification(userId, prizeAmount, quarter);

  return winnerRef.id;
}

// Helper function to process loser
async function processLoser(loserData) {
  const { userId, boardId, position, tierId, winnerTime } = loserData;

  // Determine consolation prizes by tier
  const consolationCount =
    {
      tier_25: 1,
      tier_50: 1,
      tier_100: 1,
      tier_250: 2,
      tier_500: 2,
      tier_1000: 4,
    }[tierId] || 1;

  // Create consolation record
  await db.collection("consolations").add({
    userId,
    originalBoardId: boardId,
    originalPosition: position,
    tierId,
    consolationCount,
    winnerTime, // Strategic info!
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
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in"
      );
    }

    const { tierId, gameId } = data;
    const userId = context.auth.uid;

    // Get tier info
    const tierPrices = {
      tier_25: 2500, // in cents
      tier_50: 5000,
      tier_100: 10000,
      tier_250: 25000,
      tier_500: 50000,
      tier_1000: 100000,
    };

    const price = tierPrices[tierId];
    if (!price) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid tier");
    }

    const payoutPercentage = Object.values(TIERS).find(
      (t) => t.id === tierId
    )?.payoutPercentage;

    const donationRef = admin.firestore().collection("donations").doc();
    const donationId = donationRef.id;

    await donationRef.set({
      userId,
      tier: tierId,
      tierId,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      const DOMAIN = process.env.DOMAIN || "http://localhost:3000";
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Square Trivia ${tierId.replace("tier_", "$")} Tier`,
                description: `Access to ${tierId.replace("tier_", "$")} tier games`,
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${DOMAIN}/payment-cancel`,
        metadata: {
          userId,
          donationId,
          payoutPercentage,
          tierId,
          gameId: gameId || "general",
        },
      });

      return {
        sessionId: session.id,
        url: session.url || null,
      };
    } catch (error) {
      console.error("Checkout session error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

exports.verifyCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in"
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
          `⚠️ Duplicate verification detected for session ${session.id}`
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
  }
);

exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;

      // Grant tier access
      await grantTierAccess(
        session.metadata.userId,
        session.metadata.tierId,
        session.metadata.gameId
      );

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
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
        ? winner.prizeAmount * 0.96 // 4% fee
        : winner.prizeAmount; // 100% for batch

    // Process via Stripe, PayPal, Venmo, etc.
    // This is a placeholder - implement actual payout logic
    const payoutResult = await processPaymentProvider(
      winner.userId,
      payoutAmount,
      method
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
      "Must be logged in"
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
        "Invalid session"
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
          new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
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
      `🎉 YOU WON $${amount}!\n\nQuarter: ${quarter}\nChoose payout method in the app.`
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
  consolationCount
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
      `⏱️ Close Call!\n\n${message}`
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

module.exports = {
  createGame: exports.createGame,
  claimSquare: exports.claimSquare,
  determineWinners: exports.determineWinners,
  createCheckoutSession: exports.createCheckoutSession,
  verifyCheckoutSession: exports.verifyCheckoutSession,
  handleStripeWebhook: exports.handleStripeWebhook,
  processPayout: exports.processPayout,
  validateAnswer: exports.validateAnswer,
};
