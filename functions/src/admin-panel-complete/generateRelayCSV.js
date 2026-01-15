const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction } = require(".");

/**
 * Generate Relay CSV for batch payouts
 */
exports.generateRelayCSV = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { payoutIds } = data;

  if (!Array.isArray(payoutIds) || payoutIds.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payout IDs required"
    );
  }

  try {
    const csvRows = [
      "Name,Email,Amount,Payment Method,Account Details", // Relay CSV headers
    ];

    const batch = admin.firestore().batch();
    const relayBatchRef = admin.firestore().collection("relayBatches").doc();

    let totalAmount = 0;
    const processedPayouts = [];

    for (const winnerId of payoutIds) {
      const winnerDoc = await admin
        .firestore()
        .collection("winners")
        .doc(winnerId)
        .get();
      if (!winnerDoc.exists) continue;

      const winner = winnerDoc.data();
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(winner.userId)
        .get();
      const user = userDoc.data();

      // Format for Relay
      const name = user.displayName || user.email.split("@")[0];
      const amount = winner.prizeAmount.toFixed(2);
      const paymentMethod = user.preferredPaymentMethod || "ACH";
      const accountDetails = user.paymentAccountLast4 || "On File";

      csvRows.push(
        `"${name}","${user.email}",${amount},${paymentMethod},"${accountDetails}"`
      );

      totalAmount += winner.prizeAmount;
      processedPayouts.push({
        winnerId,
        userId: winner.userId,
        amount: winner.prizeAmount,
      });

      // Update winner status
      batch.update(winnerDoc.ref, {
        status: "processing",
        payoutType: "batch",
        relayBatchId: relayBatchRef.id,
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Create relay batch record
    batch.set(relayBatchRef, {
      createdBy: adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      payoutCount: processedPayouts.length,
      totalAmount,
      status: "generated",
      payouts: processedPayouts,
    });

    await batch.commit();

    await logAdminAction(adminId, "generate_relay_csv", {
      batchId: relayBatchRef.id,
      payoutCount: processedPayouts.length,
      totalAmount,
    });

    return {
      success: true,
      csv: csvRows.join("\n"),
      batchId: relayBatchRef.id,
      summary: {
        payoutCount: processedPayouts.length,
        totalAmount,
      },
    };
  } catch (error) {
    console.error("Generate Relay CSV error:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate CSV");
  }
});

module.exports = { 
    generateRelayCSV: exports.generateRelayCSV,
};