const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction } = require(".");

/**
 * Mark Relay batch as processed
 */
exports.markRelayBatchProcessed = functions.https.onCall(
  async (data, context) => {
    const adminId = requireAdmin(context);

    const { batchId, relayConfirmationNumber } = data;

    try {
      const batchDoc = await admin
        .firestore()
        .collection("relayBatches")
        .doc(batchId)
        .get();
      if (!batchDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Batch not found");
      }

      const batch = admin.firestore().batch();

      // Update batch status
      batch.update(batchDoc.ref, {
        status: "processed",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: adminId,
        relayConfirmationNumber,
      });

      // Update all winners in batch
      const payouts = batchDoc.data().payouts;
      for (const payout of payouts) {
        const winnerRef = admin
          .firestore()
          .collection("winners")
          .doc(payout.winnerId);
        batch.update(winnerRef, {
          status: "completed",
          payoutCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      await logAdminAction(adminId, "process_relay_batch", {
        batchId,
        relayConfirmationNumber,
        payoutCount: payouts.length,
      });

      return {
        success: true,
        message: `Batch ${batchId} marked as processed`,
      };
    } catch (error) {
      console.error("Mark batch processed error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update batch"
      );
    }
  }
);

module.exports = {
  markRelayBatchProcessed: exports.markRelayBatchProcessed,
};