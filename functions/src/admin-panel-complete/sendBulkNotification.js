const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin, logAdminAction } = require("./index.js");
const { sendAdminEmail, sendAdminTelegram } = require("./index.js");

/**
 * Send bulk notifications
 */
exports.sendBulkNotification = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { userIds, subject, message, medium } = data;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User IDs required"
    );
  }

  const validMediums = ["email", "telegram", "both"];
  if (!validMediums.includes(medium)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid medium");
  }

  try {
    const results = [];

    for (const userId of userIds) {
      try {
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .get();
        if (!userDoc.exists) {
          results.push({ userId, success: false, error: "User not found" });
          continue;
        }

        const user = userDoc.data();
        let sent = false;

        if ((medium === "email" || medium === "both") && user.email) {
          await sendAdminEmail(user.email, subject, message);
          sent = true;
        }

        if (
          (medium === "telegram" || medium === "both") &&
          user.telegramUsername
        ) {
          await sendAdminTelegram(user.telegramUsername, message);
          sent = true;
        } else if (medium === "telegram" && !user.telegramUsername) {
          // User doesn't have Telegram, fallback to email if available
          if (user.email) {
            await sendAdminEmail(
              user.email,
              subject,
              message +
                "\n\n[Note: You requested Telegram delivery, but this user has not added Telegram. Sent via email instead.]"
            );
            sent = true;
          }
        }

        results.push({ userId, success: sent });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    await logAdminAction(adminId, "bulk_notification", {
      userCount: userIds.length,
      medium,
      successCount: results.filter((r) => r.success).length,
    });

    return {
      success: true,
      results,
      summary: {
        total: userIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    };
  } catch (error) {
    console.error("Bulk notification error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send notifications"
    );
  }
});

module.exports = {
  sendBulkNotification: exports.sendBulkNotification,
};