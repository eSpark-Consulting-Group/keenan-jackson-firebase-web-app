const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin } = require(".");

/**
 * Mark winners for a game quarter
 */
exports.markQuarterWinners = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { gameId, quarter, homeScore, awayScore } = data;

  // Validate inputs
  const validQuarters = ["q1", "q2", "q3", "q4", "ot"];
  if (!validQuarters.includes(quarter)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid quarter");
  }

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid scores");
  }

  try {
    // Get game
    const gameDoc = await admin
      .firestore()
      .collection("games")
      .doc(gameId)
      .get();
    if (!gameDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Game not found");
    }

    // const game = gameDoc.data();

    // Calculate winning positions
    // const winningPositions = calculateWinningPositions(homeScore, awayScore);

    // Process winners for all boards
    // const boards = await admin
    //   .firestore()
    //   .collection("boards")
    //   .where("gameId", "==", gameId)
    //   .get();

    // const winners = [];
    const batch = admin.firestore().batch();

    // for (const boardDoc of boards.docs) {
    //   const board = boardDoc.data();

    //   for (const position of winningPositions) {
    //     const square = board.squares?.[position];

    //     if (square?.userId) {
    //       // Create winner record with new payout percentage
    //       const winnerRef = admin.firestore().collection("winners").doc();
    //       const prizeAmount = calculatePrizeAmount(board.tier);

    //       batch.set(winnerRef, {
    //         userId: square.userId,
    //         gameId,
    //         boardId: boardDoc.id,
    //         quarter,
    //         position,
    //         score: `${homeScore}-${awayScore}`,
    //         prizeAmount,
    //         tier: board.tier,
    //         payoutPercentage: TIER_CONFIG[board.tier].payoutPercentage,
    //         game: `${game.teams.away} @ ${game.teams.home}`,
    //         sport: game.sport,
    //         createdAt: admin.firestore.FieldValue.serverTimestamp(),
    //         markedBy: adminId,
    //         status: "pending_payout",
    //         notificationStatus: "pending",
    //       });

    //       winners.push({
    //         winnerId: winnerRef.id,
    //         userId: square.userId,
    //         position,
    //         prizeAmount,
    //         tier: board.tier,
    //         payoutPercentage: TIER_CONFIG[board.tier].payoutPercentage,
    //       });

    //       // Mark square as winner
    //       batch.update(boardDoc.ref, {
    //         [`squares.${position}.isWinner`]: true,
    //         [`squares.${position}.winQuarter`]: quarter,
    //       });
    //     }
    //   }
    // }

    // Update game with scores
    batch.update(gameDoc.ref, {
      [`quarterScores.${quarter}`]: { home: homeScore, away: awayScore },
      [`processedQuarters.${quarter}`]: true,
      [`manualScoreEntry.${quarter}`]: {
        enteredBy: adminId,
        enteredAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    await batch.commit();

    // Trigger winner notifications
    // if (winners.length > 0) {
    //   await triggerWinnerNotifications(winners);
    // }

    // Log admin action
    // await logAdminAction(adminId, "mark_winners", {
    //   gameId,
    //   quarter,
    //   score: `${homeScore}-${awayScore}`,
    //   winnerCount: winners.length,
    //   totalPrizes: winners.reduce((sum, w) => sum + w.prizeAmount, 0),
    // });

    return {
      success: true,
      message: `Quarter ${quarter} score updated successfully`,
      // winners: winners.length,
      // totalPrizes: winners.reduce((sum, w) => sum + w.prizeAmount, 0),
      // winningPositions,
    };
  } catch (error) {
    console.error("Mark winners error:", error);
    throw new functions.https.HttpsError("internal", "Failed to mark winners");
  }
});

module.exports = {
  markQuarterWinners: exports.markQuarterWinners,
};