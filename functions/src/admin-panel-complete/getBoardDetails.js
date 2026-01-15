const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {TIER_CONFIG } = require("../constants");

/**
 * Get board details with all squares
 */
exports.getBoardDetails = functions.https.onCall(async (data, context) => {
//   const adminId = requireAdmin(context);

  const { boardId } = data;

  try {
    const boardDoc = await admin
      .firestore()
      .collection("boards")
      .doc(boardId)
      .get();
    if (!boardDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Board not found");
    }

    const board = boardDoc.data();
    const squares = board.squares || {};

    // Get game info
    const gameDoc = await admin
      .firestore()
      .collection("games")
      .doc(board.gameId)
      .get();
    const game = gameDoc.data();

    // Get user info for each square
    const squareDetails = {};
    for (const [position, square] of Object.entries(squares)) {
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(square.userId)
        .get();

      squareDetails[position] = {
        ...square,
        userEmail: userDoc.data()?.email || "Unknown",
        userTelegram: userDoc.data()?.telegramUsername || "Unknown",
      };
    }

    return {
      success: true,
      board: {
        id: boardId,
        ...board,
        squares: squareDetails,
        filledCount: Object.keys(squares).length,
        availableCount: 50 - Object.keys(squares).length,
        payoutPercentage:
          board.payoutPercentage || TIER_CONFIG[board.tier].payoutPercentage,
      },
      game: {
        id: board.gameId,
        ...game,
      },
    };
  } catch (error) {
    console.error("Get board details error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get board details"
    );
  }
});

