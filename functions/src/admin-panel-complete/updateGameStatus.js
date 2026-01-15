const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {
  requireAdmin,
  logAdminAction,
  handleGameCancellation,
} = require(".");
/**
 * Update game status manually - COMPLETE IMPLEMENTATION
 */
exports.updateGameStatus = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { gameId, status, reason } = data;

  const validStatuses = ["scheduled", "active", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid status");
  }

  try {
    // Update the game document with new status
    await admin
      .firestore()
      .collection("games")
      .doc(gameId)
      .update({
        status,
        statusReason: reason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        [`statusHistory.${status}`]: {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: adminId,
          reason,
        },
      });

    // Log the admin action
    await logAdminAction(adminId, "update_game_status", {
      gameId,
      status,
      reason,
    });

    // If game is cancelled, handle refunds or notifications
    if (status === "cancelled") {
      await handleGameCancellation(gameId, adminId, reason);
    }

    return {
      success: true,
      message: `Game status updated to ${status}`,
    };
  } catch (error) {
    console.error("Game status update error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update game status"
    );
  }
});

module.exports = {
  updateGameStatus: exports.updateGameStatus,
};
