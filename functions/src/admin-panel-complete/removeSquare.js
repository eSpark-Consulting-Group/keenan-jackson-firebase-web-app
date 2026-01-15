const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction } = require(".");

/**
 * Remove specific square from board
 */
exports.removeSquare = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { boardId, position, reason } = data;

  if (!Number.isInteger(position) || position < 0 || position > 49) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid position"
    );
  }

  try {
    const batch = admin.firestore().batch();

    // Get board
    const boardRef = admin.firestore().collection("boards").doc(boardId);
    const boardDoc = await boardRef.get();

    if (!boardDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Board not found");
    }

    const board = boardDoc.data();
    const square = board.squares?.[position];

    if (!square) {
      throw new functions.https.HttpsError("not-found", "Square not occupied");
    }

    // Remove from board
    const updates = { ...board.squares };
    delete updates[position];

    batch.update(boardRef, { squares: updates });

    // Delete claim record
    if (square.claimId) {
      const claimRef = admin
        .firestore()
        .collection("squareClaims")
        .doc(square.claimId);
      batch.delete(claimRef);
    }

    await batch.commit();

    await logAdminAction(adminId, "remove_square", {
      boardId,
      position,
      userId: square.userId,
      reason,
    });

    return {
      success: true,
      message: `Removed square ${position}`,
    };
  } catch (error) {
    console.error("Remove square error:", error);
    throw new functions.https.HttpsError("internal", "Failed to remove square");
  }
});

module.exports = {
  removeSquare: exports.removeSquare,
};