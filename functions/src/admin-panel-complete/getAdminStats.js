const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Get admin dashboard statistics with new payment structure
 */
exports.getAdminStats = functions.https.onCall(async () => {
//   const adminId = requireAdmin(context);

  try {
    // Get date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(now);
    thisWeek.setDate(now.getDate() - 7);

    const thisMonth = new Date(now);
    thisMonth.setDate(now.getDate() - 30);

    // User stats
    const totalUsers = await admin.firestore().collection("users").get();
    const activeUsers = await admin
      .firestore()
      .collection("users")
      .where("lastActive", ">=", thisWeek)
      .get();

    // Financial stats with new tier structure
    const donations = await admin
      .firestore()
      .collection("donations")
      .where("status", "==", "completed")
      .get();

    let totalRevenue = 0;
    let revenueToday = 0;
    let revenueThisWeek = 0;
    let revenueThisMonth = 0;
    let revenueByTier = {
      tier_25: 0,
      tier_50: 0,
      tier_100: 0,
      tier_250: 0,
      tier_500: 0,
      tier_1000: 0,
    };

    donations.forEach((doc) => {
      const donation = doc.data();
      const amount = donation.amount || 0;
      totalRevenue += amount;

      if (donation.tier && revenueByTier[donation.tier] !== undefined) {
        revenueByTier[donation.tier] += amount;
      }

      if (donation.completedAt?.toMillis() >= today.getTime()) {
        revenueToday += amount;
      }
      if (donation.completedAt?.toMillis() >= thisWeek.getTime()) {
        revenueThisWeek += amount;
      }
      if (donation.completedAt?.toMillis() >= thisMonth.getTime()) {
        revenueThisMonth += amount;
      }
    });

    // Calculate platform fees with new percentages
    let platformFees = {
      tier_25: revenueByTier.tier_25 * 0.23, // 23% fee
      tier_50: revenueByTier.tier_50 * 0.23,
      tier_100: revenueByTier.tier_100 * 0.23,
      tier_250: revenueByTier.tier_250 * 0.2, // 20% fee
      tier_500: revenueByTier.tier_500 * 0.2,
      tier_1000: revenueByTier.tier_1000 * 0.2,
      total:
        (revenueByTier.tier_25 +
          revenueByTier.tier_50 +
          revenueByTier.tier_100) *
          0.23 +
        (revenueByTier.tier_250 +
          revenueByTier.tier_500 +
          revenueByTier.tier_1000) *
          0.2,
    };

    // Game stats
    const games = await admin.firestore().collection("games").get();
    const upcomingGames = games.docs.filter(
      (doc) => doc.data().status === "scheduled"
    ).length;
    const activeGames = games.docs.filter(
      (doc) => doc.data().status === "active"
    ).length;
    const completedGames = games.docs.filter(
      (doc) => doc.data().status === "completed"
    ).length;

    // Winner and payout stats
    const winners = await admin.firestore().collection("winners").get();
    const pendingPayouts = winners.docs.filter(
      (doc) => doc.data().status === "pending_payout"
    );
    const instantPayouts = winners.docs.filter(
      (doc) => doc.data().payoutType === "instant"
    );

    let totalPrizesPending = 0;
    let totalInstantPayoutFees = 0;
    let instantPayoutsByTier = {
      tier_25: { count: 0, fees: 0 },
      tier_50: { count: 0, fees: 0 },
      tier_100: { count: 0, fees: 0 },
      tier_250: { count: 0, fees: 0 },
      tier_500: { count: 0, fees: 0 },
      tier_1000: { count: 0, fees: 0 },
    };

    pendingPayouts.forEach((doc) => {
      totalPrizesPending += doc.data().prizeAmount || 0;
    });

    instantPayouts.forEach((doc) => {
      const winner = doc.data();
      const fee = winner.instantPayoutFee || 0;
      totalInstantPayoutFees += fee;

      if (winner.tier && instantPayoutsByTier[winner.tier]) {
        instantPayoutsByTier[winner.tier].count++;
        instantPayoutsByTier[winner.tier].fees += fee;
      }
    });

    // Square stats
    const boards = await admin.firestore().collection("boards").get();
    let totalSquaresFilled = 0;
    boards.forEach((doc) => {
      totalSquaresFilled += Object.keys(doc.data().squares || {}).length;
    });

    // Relay batch stats
    const relayBatches = await admin
      .firestore()
      .collection("relayBatches")
      .get();
    const pendingBatches = relayBatches.docs.filter(
      (doc) => doc.data().status === "generated"
    ).length;
    const processedBatches = relayBatches.docs.filter(
      (doc) => doc.data().status === "processed"
    ).length;

    return {
      success: true,
      stats: {
        users: {
          total: totalUsers.size,
          active: activeUsers.size,
          new: totalUsers.docs.filter(
            (doc) => doc.data().createdAt?.toMillis() >= thisWeek.getTime()
          ).length,
        },
        revenue: {
          total: totalRevenue,
          today: revenueToday,
          thisWeek: revenueThisWeek,
          thisMonth: revenueThisMonth,
          byTier: revenueByTier,
          platformFees,
          operatingProfit: platformFees.total,
        },
        games: {
          total: games.size,
          scheduled: upcomingGames,
          active: activeGames,
          completed: completedGames,
        },
        winners: {
          total: winners.size,
          pendingPayouts: pendingPayouts.length,
          totalPrizesPending,
        },
        instantPayouts: {
          total: instantPayouts.length,
          totalFees: totalInstantPayoutFees,
          percentageOfWinners:
            winners.size > 0
              ? ((instantPayouts.length / winners.size) * 100).toFixed(1)
              : 0,
          byTier: instantPayoutsByTier,
          averageFee:
            instantPayouts.length > 0
              ? (totalInstantPayoutFees / instantPayouts.length).toFixed(2)
              : 0,
        },
        relayBatches: {
          pending: pendingBatches,
          processed: processedBatches,
          total: relayBatches.size,
        },
        squares: {
          totalFilled: totalSquaresFilled,
          totalAvailable: boards.size * 50,
          fillRate: ((totalSquaresFilled / (boards.size * 50)) * 100).toFixed(
            1
          ),
        },
      },
    };
  } catch (error) {
    console.error("Get admin stats error:", error);
    throw new functions.https.HttpsError("internal", "Failed to get stats");
  }
});

module.exports = {
  getAdminStats: exports.getAdminStats,
};
