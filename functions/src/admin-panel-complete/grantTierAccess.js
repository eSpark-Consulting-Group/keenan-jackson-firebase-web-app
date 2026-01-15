const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction,  } = require(".");
const { TIER_CONFIG } = require("../constants");

/**
 * Grant tier access manually
 */
exports.grantTierAccess = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { userId, tier, days, reason } = data;

  // if (!TIER_CONFIG[tier]) {
  //   throw new functions.https.HttpsError("invalid-argument", "Invalid tier");
  // }

  try {
    // Create donation record with payout percentage
    const donationRef = await admin
      .firestore()
      .collection("donations")
      .add({
        userId,
        tier,
        amount: 0,
        payoutPercentage: TIER_CONFIG[tier].payoutPercentage,
        isAdminGrant: true,
        grantedBy: adminId,
        reason,
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      });

    // Grant tier access
    await admin
      .firestore()
      .collection("tierAccess")
      .add({
        userId,
        tier,
        donationId: donationRef.id,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        active: true,
        isAdminGrant: true,
        grantedBy: adminId,
      });

    // Update user tiers
    await admin
      .firestore()
      .collection("users")
      .doc(userId)

    await logAdminAction(adminId, "grant_tier_access", {
      userId,
      tier,
      days,
      reason,
    });

    return {
      success: true,
      message: `Granted ${TIER_CONFIG[tier].name} access for ${days} days`,
    };
  } catch (error) {
    console.error("Grant tier access error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to grant tier access"
    );
  }
});
module.exports = {
    grantTierAccess: exports.grantTierAccess,
  };