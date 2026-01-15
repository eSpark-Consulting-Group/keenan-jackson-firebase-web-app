const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction, triggerWinnerNotifications } = require(".");

/**
 * Retry failed winner notifications
 */
exports.retryWinnerNotifications = functions.https.onCall(
  async (data, context) => {
    const adminId = requireAdmin(context);

    const { winnerIds } = data;

    if (!Array.isArray(winnerIds) || winnerIds.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Winner IDs required"
      );
    }

    try {
      const results = [];

      for (const winnerId of winnerIds) {
        const winnerDoc = await admin
          .firestore()
          .collection("winners")
          .doc(winnerId)
          .get();

        if (!winnerDoc.exists) {
          results.push({ winnerId, success: false, error: "Not found" });
          continue;
        }

        try {
          await triggerWinnerNotifications([
            {
              winnerId,
              userId: winnerDoc.data().userId,
              position: winnerDoc.data().position,
              prizeAmount: winnerDoc.data().prizeAmount,
              tier: winnerDoc.data().tier,
              payoutPercentage: winnerDoc.data().payoutPercentage,
            },
          ]);

          await winnerDoc.ref.update({
            notificationStatus: "retried",
            retriedAt: admin.firestore.FieldValue.serverTimestamp(),
            retriedBy: adminId,
          });

          results.push({ winnerId, success: true });
        } catch (error) {
          results.push({ winnerId, success: false, error: error.message });
        }
      }

      await logAdminAction(adminId, "retry_notifications", {
        attemptedCount: winnerIds.length,
        successCount: results.filter((r) => r.success).length,
      });

      return {
        success: true,
        results,
        summary: {
          attempted: winnerIds.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      };
    } catch (error) {
      console.error("Retry notifications error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to retry notifications"
      );
    }
  }
);
module.exports = {
  retryWinnerNotifications: exports.retryWinnerNotifications,
};