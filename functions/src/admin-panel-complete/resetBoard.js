const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction } = require(".");

/**
 * Reset board (remove all squares)
 */
exports.resetBoard = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { boardId, reason } = data;

  if (!reason) {
    throw new functions.https.HttpsError("invalid-argument", "Reason required");
  }

  try {
    const batch = admin.firestore().batch();

    // Update board
    const boardRef = admin.firestore().collection("boards").doc(boardId);
    batch.update(boardRef, {
      squares: {},
      resetAt: admin.firestore.FieldValue.serverTimestamp(),
      resetBy: adminId,
      resetReason: reason,
    });

    // Delete all square claims
    const claimsQuery = await admin
      .firestore()
      .collection("squareClaims")
      .where("boardId", "==", boardId)
      .get();

    claimsQuery.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    await logAdminAction(adminId, "reset_board", {
      boardId,
      reason,
      squaresRemoved: claimsQuery.size,
    });

    return {
      success: true,
      message: `Board reset - removed ${claimsQuery.size} squares`,
    };
  } catch (error) {
    console.error("Reset board error:", error);
    throw new functions.https.HttpsError("internal", "Failed to reset board");
  }
});
module.exports = {
  resetBoard: exports.resetBoard,
};
