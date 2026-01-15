const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction } = require(".");
const { TIER_CONFIG } = require("../constants");

/**
 * Revoke tier access
 */
exports.revokeTierAccess = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { userId, tier, reason } = data;

  try {
    // Find active tier access
    const accessQuery = await admin
      .firestore()
      .collection("tierAccess")
      .where("userId", "==", userId)
      .where("tier", "==", tier)
      .where("active", "==", true)
      .get();

    const batch = admin.firestore().batch();

    accessQuery.forEach((doc) => {
      batch.update(doc.ref, {
        active: false,
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        revokedBy: adminId,
        revokeReason: reason,
      });
    });

    // Update user tiers
    const userRef = admin.firestore().collection("users").doc(userId);
    batch.update(userRef, {
      currentTiers: admin.firestore.FieldValue.arrayRemove(tier),
    });

    await batch.commit();

    await logAdminAction(adminId, "revoke_tier_access", {
      userId,
      tier,
      reason,
      revokedCount: accessQuery.size,
    });

    return {
      success: true,
      message: `Revoked ${TIER_CONFIG[tier].name} access`,
    };
  } catch (error) {
    console.error("Revoke tier access error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to revoke tier access"
    );
  }
});
module.exports = {
  revokeTierAccess: exports.revokeTierAccess,
};