
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// const { requireAdmin } = require("../admin-panel-complete/funcs");

/**
 * Get pending payouts for batch processing
 */
exports.getPendingPayouts = functions.https.onCall(async () => {
  // const adminId = requireAdmin(context);

  try {
    // Get current batch window
    const now = new Date();
    const dayOfWeek = now.getDay();
    let startDate, endDate;

    // Tuesday batch: Friday through Monday
    if (dayOfWeek === 2) {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 4); // Friday
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now);
      endDate.setDate(now.getDate() - 1); // Monday
      endDate.setHours(23, 59, 59, 999);
    }
    // Friday batch: Tuesday through Thursday
    else if (dayOfWeek === 5) {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 3); // Tuesday
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now);
      endDate.setDate(now.getDate() - 1); // Thursday
      endDate.setHours(23, 59, 59, 999);
    } else {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Batch payouts only run on Tuesday and Friday"
      );
    }

    // Get pending winners (excluding instant payouts)
    const winners = await admin
      .firestore()
      .collection("winners")
      .where("status", "==", "pending_payout")
      .where("createdAt", ">=", startDate)
      .where("createdAt", "<=", endDate)
      .get();

    const pendingPayouts = [];
    let totalByTier = {
      tier_25: { count: 0, total: 0 },
      tier_50: { count: 0, total: 0 },
      tier_100: { count: 0, total: 0 },
      tier_250: { count: 0, total: 0 },
      tier_500: { count: 0, total: 0 },
      tier_1000: { count: 0, total: 0 },
    };

    for (const doc of winners.docs) {
      const winner = doc.data();

      // Skip if already processed as instant payout
      if (winner.payoutType === "instant") continue;

      // Get user details
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(winner.userId)
        .get();
      const user = userDoc.data();

      pendingPayouts.push({
        winnerId: doc.id,
        userId: winner.userId,
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
        prizeAmount: winner.prizeAmount,
        tier: winner.tier,
        game: winner.game,
        quarter: winner.quarter,
        payoutPercentage: winner.payoutPercentage,
      });

      totalByTier[winner.tier].count++;
      totalByTier[winner.tier].total += winner.prizeAmount;
    }

    return {
      success: true,
      batchDate: now.toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      payouts: pendingPayouts,
      summary: {
        totalPayouts: pendingPayouts.length,
        totalAmount: pendingPayouts.reduce((sum, p) => sum + p.prizeAmount, 0),
        byTier: totalByTier,
      },
    };
  } catch (error) {
    console.error("Get pending payouts error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get pending payouts"
    );
  }
});

module.exports = {
  getPendingPayouts: exports.getPendingPayouts,
};