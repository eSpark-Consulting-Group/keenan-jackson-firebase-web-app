const functions = require("firebase-functions");
const {
  requireAdmin,
  logAdminAction,
  exportUsers,
  exportWinners,
  exportDonations,
  exportSquares,
} = require(".");
/**
 * Bulk export data
 */
exports.exportData = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);

  const { dataType, filters = {} } = data;

  try {
    let exportData;

    switch (dataType) {
      case "users":
        exportData = await exportUsers(filters);
        break;
      case "winners":
        exportData = await exportWinners(filters);
        break;
      case "donations":
        exportData = await exportDonations(filters);
        break;
      case "squares":
        exportData = await exportSquares(filters);
        break;
      default:
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid data type"
        );
    }

    await logAdminAction(adminId, "export_data", {
      dataType,
      recordCount: exportData.length,
      filters,
    });

    return {
      success: true,
      data: exportData,
      count: exportData.length,
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Export data error:", error);
    throw new functions.https.HttpsError("internal", "Failed to export data");
  }
});
module.exports = {
  exportData: exports.exportData,
};