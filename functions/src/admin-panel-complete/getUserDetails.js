const functions = require("firebase-functions");
const admin = require("firebase-admin");
// const { requireAdmin } = require("../admin-panel-complete/funcs");

/**
 * Get user details with all related data
 */
exports.getUserDetails = functions.https.onCall(async (data, context) => {
//   const adminId = requireAdmin(context);

  const { userId } = data;

  try {
    // Get user
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const user = userDoc.data();

    // Get donations
    const donations = await admin
      .firestore()
      .collection("donations")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    // Get tier access
    const tierAccess = await admin
      .firestore()
      .collection("tierAccess")
      .where("userId", "==", userId)
      .get();

    // Get squares
    const squares = await admin
      .firestore()
      .collection("squareClaims")
      .where("userId", "==", userId)
      .get();

    // Get wins
    const wins = await admin
      .firestore()
      .collection("winners")
      .where("userId", "==", userId)
      .get();

    // Calculate stats including instant payout info
    const instantPayouts = wins.docs.filter(
      (doc) => doc.data().payoutType === "instant"
    );
    const instantPayoutFees = instantPayouts.reduce(
      (sum, doc) => sum + (doc.data().instantPayoutFee || 0),
      0
    );

    const stats = {
      totalDonations: donations.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
      ),
      activeTiers: tierAccess.docs
        .filter(
          (doc) =>
            doc.data().active && doc.data().expiresAt.toMillis() > Date.now()
        )
        .map((doc) => doc.data().tier),
      totalSquares: squares.size,
      totalWins: wins.size,
      totalWinnings: wins.docs.reduce(
        (sum, doc) => sum + (doc.data().prizeAmount || 0),
        0
      ),
      // NEW FIELDS:
      instantPayoutPreference: user.instantPayoutPreference || false,
      totalInstantPayouts: instantPayouts.length,
      totalInstantPayoutFees: instantPayoutFees,
      hasTelegram: user.hasTelegram || !!user.telegramUsername,
      telegramUsername: user.telegramUsername || "Not provided",
      notificationMethod: user.preferredNotificationMethod || "email",
    };

    return {
      success: true,
      user: {
        id: userId,
        ...user,
        stats,
      },
      donations: donations.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      tierAccess: tierAccess.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      recentSquares: squares.docs.slice(0, 10).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      recentWins: wins.docs.slice(0, 10).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    };
  } catch (error) {
    console.error("Get user details error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get user details"
    );
  }
});

module.exports = {
  getUserDetails: exports.getUserDetails,
};