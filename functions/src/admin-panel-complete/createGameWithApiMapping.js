const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { requireAdmin,logAdminAction } = require(".");
const { GAME_TYPES, TIER_AVAILABILITY, TIER_CONFIG } = require("../constants");

/**
 * Create game with API mapping
 */
exports.createGameWithApiMapping = functions.https.onCall(
  async (data, context) => {
    const adminId = requireAdmin(context);
    const { sport, homeTeam, awayTeam, startTime, gameType, apiSportsId } =
      data;

    // Validate inputs
    if (
      !sport ||
      !homeTeam ||
      !awayTeam ||
      !startTime ||
      !gameType ||
      !apiSportsId
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    if (!Object.values(GAME_TYPES).includes(gameType)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid game type"
      );
    }

    try {
      // Create game
      const gameRef = await admin
        .firestore()
        .collection("games")
        .add({
          sport,
          teams: { home: homeTeam, away: awayTeam },
          startTime: admin.firestore.Timestamp.fromDate(new Date(startTime)),
          gameType,
          apiSportsId,
          status: "scheduled",
          processedQuarters: {},
          scores: {},
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: adminId,
        });

      // Create boards for available tiers
      const availableTiers = TIER_AVAILABILITY[gameType];
      const boardPromises = availableTiers.map((tier) =>
        admin.firestore().collection("boards").add({
          gameId: gameRef.id,
          tier,
          gameType,
          squares: {},
          maxSquares: 50,
          payoutPercentage: TIER_CONFIG[tier].payoutPercentage,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );

      await Promise.all(boardPromises);

      // Log admin action
      await logAdminAction(adminId, "create_game", {
        gameId: gameRef.id,
        sport,
        teams: `${awayTeam} @ ${homeTeam}`,
        apiSportsId,
        boardsCreated: availableTiers.length,
      });

      return {
        success: true,
        gameId: gameRef.id,
        message: `Game created with ${availableTiers.length} boards`,
        availableTiers,
      };
    } catch (error) {
      console.error("Game creation error:", error);
      throw new functions.https.HttpsError("internal", "Failed to create game");
    }
  }
);
