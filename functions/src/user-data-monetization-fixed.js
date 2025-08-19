const functions = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { validateTelegramUsername } = require("./utility-functions-fixed");
const admin = require("firebase-admin");
const { grantTelegramAccess } = require("./payment-system-modified");
const { verifyUserTierAccess } = require("./trivia-system-fixed");
const { default: axios } = require("axios");
// import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
const { logger } = require("firebase-functions");

const db = admin.firestore();

// User Data Collection & Monetization System

// =====================================
// ENHANCED USER PROFILE SCHEMA
// =====================================

const enhancedUserSchema = {
  // Basic Info (already collecting)
  email: "user@example.com",
  telegramUsername: "@username",
  createdAt: "Timestamp",

  // Financial Profile
  totalDonations: 0,
  lifetimeValue: 0,
  averageDonation: 0,
  preferredTiers: ["100", "250"],
  lastDonation: "Timestamp",
  churnRisk: "low", // low, medium, high

  // Game Preferences
  favoriteTeams: {
    NFL: ["Chiefs", "Bills"],
    NBA: ["Lakers"],
    NCAA_FB: ["Alabama"],
    NCAA_BB: ["Duke"],
  },
  sportsEngagement: {
    NFL: { gamesPlayed: 45, winRate: 0.22 },
    NBA: { gamesPlayed: 23, winRate: 0.25 },
    NCAA_FB: { gamesPlayed: 12, winRate: 0.18 },
    NCAA_BB: { gamesPlayed: 8, winRate: 0.31 },
  },

  // Behavioral Data
  lastActive: "Timestamp",
  loginFrequency: "weekly", // daily, weekly, monthly
  notificationPreferences: {
    email: true,
    telegram: true,
    sms: false,
    marketing: true, // KEY for monetization
  },

  // Geographic/Demographic
  location: {
    city: "Dallas",
    state: "TX",
    country: "US",
    timezone: "America/Chicago",
  },
  estimatedAge: "25-34", // Based on game choices

  // Engagement Metrics
  referralCode: "MIKE123",
  referredUsers: 3,
  socialShares: 12,
  supportTickets: 0,

  // Monetization Flags
  segments: ["high_roller", "nfl_enthusiast", "playoff_player"],
  partnerOffers: {
    draftkings: { eligible: true, converted: false },
    fanduel: { eligible: true, converted: false },
    youtubetv: { eligible: false, converted: false },
  },
};

const TELEGRAM_BOT_TOKEN = "7718801037:AAEV4HynXs0vdMTDFcVtVphzFU1PpaLooAQ";

// Helper: send Telegram message
async function sendTelegramNotification(chatId, message) {
  if (!chatId) return;

  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: message,
    }
  );
}

// =====================================
// DATA COLLECTION FUNCTIONS
// =====================================

// Track every user action
exports.trackUserEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) return;

  const { eventType, eventData } = data;
  const userId = context.auth.uid;

  // Record raw event
  await db.collection("userEvents").add({
    userId,
    eventType,
    eventData,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    sessionId: context.auth.token.sessionId,
    ip: context.rawRequest.ip,
  });

  // Update user profile based on event
  await updateUserProfile(userId, eventType, eventData);
});

/**
 * Internal helper: safely grant Telegram access for a user & tier
 */
/**
 * Internal helper: safely grant Telegram access for a user & tier
 */
async function handleGrantTelegramAccess(userId, telegramUsername, tier) {
  try {
    // Step 1: Verify user has access to the tier
    const hasAccess = await verifyUserTierAccess(userId, tier);
    if (!hasAccess) {
      console.warn(
        `User ${userId} does not have access to tier ${tier}, skipping Telegram grant`
      );
      return { success: false, message: "No active access to this tier" };
    }

    // Step 2: Grant access (re-uses your existing function)
    await grantTelegramAccess(userId, telegramUsername, tier);

    // Step 3: Return result for logging
    return {
      success: true,
      message: `Telegram access granted for tier ${tier}`,
    };
  } catch (err) {
    console.error(
      `Failed to grant Telegram access for user ${userId}, tier ${tier}:`,
      err
    );
    return { success: false, message: err.message || "Grant failed" };
  }
}

exports.addTelegramToAccount = functions.https.onCall(async (data, context) => {
  // data comes from frontend
  console.log(data, "dataCcQCCCAQ   ");
  const { userId, telegramUsername } = data;

  console.log("addTelegramToAccount called", { userId, telegramUsername });

  // Optional: check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated."
    );
  }
  console.log("context.auth.uid", context.auth.uid, userId);
  // Optional: validate userId matches authenticated user
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Cannot add Telegram for another user."
    );
  }

  try {
    // Validate telegram username
    const validation = validateTelegramUsername(telegramUsername);
    if (!validation.valid || validation.isEmpty) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.error || "Please enter a valid Telegram username"
      );
    }

    const userRef = db.collection("users").doc(userId);
    console.log("userRef....!....", userRef);

    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    const updates = {
      telegramUsername: validation.value,
      hasTelegram: true,
      preferredNotificationMethod: "both",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    let addedExtraAttempts = false;

    // ✅ Only adjust if they are adding Telegram for the first time
    if (!userData.hasTelegram && !userData.telegramUsername) {
      const currentAttempts = userData.dailyTriviaAttempts || 0;

      // Cap at 10 for Telegram users
      const newAttempts = Math.min(currentAttempts + 5, 10);

      updates.dailyTriviaAttempts = newAttempts;
      addedExtraAttempts = true;
    } else {
      // Just make sure they’re not above the cap
      const currentAttempts = userData.dailyTriviaAttempts || 0;
      const maxAllowed = telegramUsername ? 10 : 5;

      if (currentAttempts > maxAllowed) {
        updates.dailyTriviaAttempts = maxAllowed;
      }
    }

    // Save updates
    await userRef.set(updates, { merge: true });

    // Grant Telegram access for active tiers
    // 🔑 Instead of httpsCallable, use the helper directly
    // 🔑 Instead of httpsCallable, use the helper directly
    if (userData.currentTiers && userData.currentTiers.length > 0) {
      for (const tier of userData.currentTiers) {
        await handleGrantTelegramAccess(userId, telegramUsername, tier);
      }
    }

    return {
      success: true,
      message: addedExtraAttempts
        ? "Telegram added successfully! +5 daily attempts unlocked 🎉"
        : "Telegram updated successfully.",
      benefits: {
        extraAttempts: addedExtraAttempts ? 5 : 0,
        instantNotifications: true,
        communityAccess: true,
      },
    };
  } catch (error) {
    console.error("Add Telegram error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  const body = req.body;

  if (!body || !body.message) {
    return res.send("ok");
  }
  logger.info("Incoming update", { body: req.body });

  const msg = body.message;
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!msg) {
    logger.warn("No message in update", { update: req.body });
    return res.send("ok");
  }

  logger.debug("Chat ID extracted", { chatId });
  logger.debug("MESSAGE", { msg });

  // User typed /start <firebaseUserId>
  if (text && text.startsWith("/start")) {
    const parts = text.split(" ");
    const userId = parts[1]; // you pass this in link

    if (userId) {
      await admin.firestore().collection("users").doc(userId).update({
        telegramChatId: chatId,
      });

      // send confirmation
      // await axios.post(
      //   `https://api.telegram.org/bot7718801037:AAEV4HynXs0vdMTDFcVtVphzFU1PpaLooAQ/sendMessage`,
      //   {
      //     chat_id: chatId,
      //     text: "✅ Telegram connected successfully!",
      //   }
      // );
    }
  }

  res.send("ok");
});

// Cloud function triggered every 3 hours (Alert for trivia question availability)
exports.sendTriviaAttemptNotifications = functions.pubsub
  .schedule("every 5 minutes") // or "every 5 minutes" for testing
  .timeZone("UTC")
  .onRun(async () => {
    const usersSnapshot = await admin.firestore().collection("users").get();

    const promises = [];

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      const attempts = user.dailyTriviaAttempts ?? 0;
      const chatId = user.telegramChatId;

      // ✅ Only send if user has telegramChatId
      if (chatId) {
        let message = "";
        if (attempts > 0) {
          message = `You have ${attempts} daily trivia attempts left. 🎯`;
        } else {
          message =
            "You have 0 attempts left. Please check again after midnight. ⏰";
        }

        promises.push(sendTelegramNotification(chatId, message));
      }
    });

    await Promise.all(promises);
    console.log(
      "Trivia attempt notifications sent to all users with Telegram."
    );
  });

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User UID is required"
    );
  }

  try {
    // Temporarily allow anyone to call this for the first admin
    // ⚠️ Remove this code after the first admin is created
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return { success: true, message: `Admin claim set for ${uid}` };
  } catch (error) {
    console.error("Error setting admin claim:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

const TIER_CONFIG = {
  tier_25: {
    amount: 25,
    name: "$25 Tier",
    telegramGroupId: "-1002279525248",
    payoutPercentage: 0.77,
  },
  tier_50: {
    amount: 50,
    name: "$50 Tier",
    telegramGroupId: "-1002862739955",
    payoutPercentage: 0.77,
  },
  tier_100: {
    amount: 100,
    name: "$100 Tier",
    telegramGroupId: "-1002749874729",
    payoutPercentage: 0.77,
  },
  tier_250: {
    amount: 250,
    name: "$250 Tier",
    telegramGroupId: "-1002554143674",
    payoutPercentage: 0.8,
  },
  tier_500: {
    amount: 500,
    name: "$500 Tier",
    telegramGroupId: "-1002477878800",
    payoutPercentage: 0.8,
  },
  tier_1000: {
    amount: 1000,
    name: "$1000 Tier",
    telegramGroupId: "-1002775562003",
    payoutPercentage: 0.8,
  },
};
exports.sendTelegramMessage = functions.https.onRequest(async (req, res) => {
  const TelegramBot = require("node-telegram-bot-api");

  try {
    console.log("Request body:", req.body);

    const { telegramUsername, tier } = req.body;

    if (!telegramUsername || !tier) {
      console.log("Missing parameters!");
      return res
        .status(400)
        .send({ error: "telegramUsername and tier are required" });
    }
    console.log(
      `Sending Telegram message to user: ${telegramUsername}, tier: ${tier}`
    );

    const bot = new TelegramBot(
      "7718801037:AAEV4HynXs0vdMTDFcVtVphzFU1PpaLooAQ"
      // { polling: false }
    );
    console.log("Telegram bot initialized");

    // Get your groupId from TIER_CONFIG
    const groupId = TIER_CONFIG[tier].telegramGroupId;
    console.log(`Using groupId: ${groupId}`);

    // Generate invite link
    const inviteLink = await bot.createChatInviteLink(groupId, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    });
    console.log("Invite link generated:", inviteLink.invite_link);

    // Optionally store in Firestore
    const docRef = await admin.firestore().collection("telegramInvites").add({
      telegramUsername,
      tier,
      inviteLink: inviteLink.invite_link,
      // createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
    });
    console.log("Invite link stored in Firestore with ID:", docRef.id);

    // Send DM
    try {
      await bot.sendMessage(
        `@${telegramUsername}`,
        `Welcome to Square Trivia ${TIER_CONFIG[tier].name}!\n\n` +
          `Click here to join: ${inviteLink.invite_link}\n\n` +
          `This link expires in 24 hours.`
      );
      console.log("Message sent to user via Telegram");
    } catch (dmError) {
      console.log(
        "Could not DM user, they need to start conversation with bot first"
      );
    }

    res.status(200).send({
      message: "Message sent (or invite generated)",
      inviteLink: inviteLink.invite_link,
    });
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    res.status(500).send({ error: error.message });
  }
});

async function updateUserProfile(userId, eventType, eventData) {
  const userRef = db.collection("users").doc(userId);

  switch (eventType) {
    case "game_played":
      await userRef.update({
        [`sportsEngagement.${eventData.sport}.gamesPlayed`]:
          admin.firestore.FieldValue.increment(1),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;

    case "donation_made":
      await userRef.update({
        totalDonations: admin.firestore.FieldValue.increment(eventData.amount),
        lastDonation: admin.firestore.FieldValue.serverTimestamp(),
        [`tierHistory.${eventData.tier}`]:
          admin.firestore.FieldValue.increment(1),
      });
      break;

    case "team_interest":
      await userRef.update({
        [`favoriteTeams.${eventData.sport}`]:
          admin.firestore.FieldValue.arrayUnion(eventData.team),
      });
      break;
  }

  // Run segmentation
  await updateUserSegments(userId);
}

// =====================================
// SEGMENTATION ENGINE
// =====================================

async function updateUserSegments(userId) {
  const userDoc = await db.collection("users").doc(userId).get();
  const user = userDoc.data();

  const segments = [];

  // Financial segments
  if (user.totalDonations >= 1000) segments.push("vip");
  else if (user.totalDonations >= 500) segments.push("high_roller");
  else if (user.totalDonations >= 200) segments.push("regular");
  else segments.push("casual");

  // Sport preference segments
  const sports = Object.entries(user.sportsEngagement || {});
  sports.forEach(([sport, data]) => {
    if (data.gamesPlayed > 20)
      segments.push(`${sport.toLowerCase()}_enthusiast`);
  });

  // Behavioral segments
  const daysSinceLastActive =
    (Date.now() - user.lastActive?.toMillis()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastActive > 30) segments.push("at_risk");
  if (daysSinceLastActive > 60) segments.push("churned");

  // Seasonal segments
  if (user.sportsEngagement?.NCAA_BB?.gamesPlayed > 5)
    segments.push("march_madness");
  if (user.sportsEngagement?.NFL?.gamesPlayed > 10)
    segments.push("nfl_playoff_ready");

  await userDoc.ref.update({ segments });

  // Check for monetization opportunities
  await checkMonetizationOpportunities(userId, segments);
}

// =====================================
// MONETIZATION AUTOMATION
// =====================================

async function checkMonetizationOpportunities(userId, segments) {
  const opportunities = [];

  // DraftKings/FanDuel eligibility
  if (segments.includes("high_roller") || segments.includes("vip")) {
    opportunities.push({
      partner: "draftkings",
      value: 100,
      message: "Exclusive $500 deposit match for Square Trivia VIPs",
    });
  }

  // Sports streaming for engaged users
  if (segments.filter((s) => s.includes("_enthusiast")).length >= 2) {
    opportunities.push({
      partner: "youtubetv",
      value: 50,
      message: "Get 2 months free YouTube TV to watch your squares live",
    });
  }

  // Merchandise for team fans
  const userDoc = await db.collection("users").doc(userId).get();
  const favoriteTeams = userDoc.data().favoriteTeams || {};

  Object.entries(favoriteTeams).forEach(([sport, teams]) => {
    if (teams.length > 0) {
      opportunities.push({
        partner: "fanatics",
        value: 20,
        message: `20% off ${teams[0]} gear at Fanatics`,
        metadata: { team: teams[0], sport },
      });
    }
  });

  // Store opportunities
  if (opportunities.length > 0) {
    await db.collection("monetizationQueue").add({
      userId,
      opportunities,
      segments,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
    });
  }
}

// =====================================
// MARKETING CAMPAIGN SYSTEM
// =====================================

exports.runTargetedCampaign = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { campaignType, filters, message } = data;

  // Build query based on filters
  let query = db.collection("users");

  if (filters.minDonation) {
    query = query.where("totalDonations", ">=", filters.minDonation);
  }

  if (filters.segment) {
    query = query.where("segments", "array-contains", filters.segment);
  }

  const targetUsers = await query.get();

  console.log(`Campaign targeting ${targetUsers.size} users`);

  // Queue campaign messages
  const batch = db.batch();

  targetUsers.forEach((doc) => {
    const user = doc.data();

    if (user.notificationPreferences?.marketing) {
      const campaignRef = db.collection("marketingQueue").doc();
      batch.set(campaignRef, {
        userId: doc.id,
        email: user.email,
        campaignType,
        message: personalizeMessage(message, user),
        scheduledFor: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
      });
    }
  });

  await batch.commit();

  return {
    success: true,
    targetedUsers: targetUsers.size,
    campaignType,
  };
});

function personalizeMessage(template, user) {
  return template
    .replace("{name}", user.email.split("@")[0])
    .replace("{tier}", user.preferredTiers?.[0] || "100")
    .replace(
      "{sport}",
      user.segments.find((s) => s.includes("_enthusiast"))?.split("_")[0] ||
        "NFL"
    )
    .replace("{totalSpent}", user.totalDonations || 0);
}

// =====================================
// ANALYTICS DASHBOARD DATA
// =====================================

exports.getBusinessAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const analytics = {
    userMetrics: await getUserMetrics(),
    revenueMetrics: await getRevenueMetrics(),
    engagementMetrics: await getEngagementMetrics(),
    monetizationMetrics: await getMonetizationMetrics(),
  };

  return analytics;
});

async function getUserMetrics() {
  const users = await db.collection("users").get();

  const segments = {};
  const tiers = {};
  let totalUsers = 0;
  let activeUsers = 0;

  users.forEach((doc) => {
    const user = doc.data();
    totalUsers++;

    // Active in last 30 days
    const daysSinceActive =
      (Date.now() - user.lastActive?.toMillis()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive <= 30) activeUsers++;

    // Segment counts
    (user.segments || []).forEach((segment) => {
      segments[segment] = (segments[segment] || 0) + 1;
    });

    // Tier preferences
    (user.preferredTiers || []).forEach((tier) => {
      tiers[tier] = (tiers[tier] || 0) + 1;
    });
  });

  return {
    totalUsers,
    activeUsers,
    churnRate: (((totalUsers - activeUsers) / totalUsers) * 100).toFixed(1),
    segments,
    tiers,
    avgLifetimeValue: await calculateAvgLTV(),
  };
}

async function calculateAvgLTV() {
  const result = await db.collection("users").aggregate([
    {
      $group: {
        _id: null,
        avgLTV: { $avg: "$totalDonations" },
      },
    },
  ]);

  return result[0]?.avgLTV || 0;
}

// =====================================
// PRIVACY COMPLIANT DATA EXPORT
// =====================================

exports.exportAnonymizedData = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { dataType } = data;

  switch (dataType) {
    case "market_research":
      return await exportMarketResearchData();
    case "behavioral_insights":
      return await exportBehavioralData();
    case "revenue_analysis":
      return await exportRevenueData();
  }
});

async function exportMarketResearchData() {
  // Aggregate data only - no PII
  const data = await db.collection("users").get();

  const insights = {
    sportPreferences: {},
    spendingPatterns: {},
    geographicDistribution: {},
    seasonalTrends: {},
  };

  data.forEach((doc) => {
    const user = doc.data();

    // Sport preferences by spending level
    const spendLevel = user.totalDonations > 500 ? "high" : "low";
    Object.entries(user.sportsEngagement || {}).forEach(([sport, data]) => {
      if (!insights.sportPreferences[sport]) {
        insights.sportPreferences[sport] = { high: 0, low: 0 };
      }
      insights.sportPreferences[sport][spendLevel] += data.gamesPlayed;
    });

    // Geographic distribution
    const state = user.location?.state || "Unknown";
    insights.geographicDistribution[state] =
      (insights.geographicDistribution[state] || 0) + 1;
  });

  return insights;
}

// =====================================
// REFERRAL TRACKING
// =====================================

exports.trackReferral = functions.https.onCall(async (data, context) => {
  if (!context.auth) return;

  const { referralCode } = data;
  const newUserId = context.auth.uid;

  // Find referrer
  const referrer = await db
    .collection("users")
    .where("referralCode", "==", referralCode)
    .limit(1)
    .get();

  if (!referrer.empty) {
    const referrerId = referrer.docs[0].id;

    // Credit referrer
    await referrer.docs[0].ref.update({
      referredUsers: admin.firestore.FieldValue.increment(1),
      referralCredits: admin.firestore.FieldValue.increment(25), // $25 credit
    });

    // Track relationship
    await db.collection("referrals").add({
      referrerId,
      referredId: newUserId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending", // Becomes 'completed' after first donation
      creditAmount: 25,
    });
  }
});

// =====================================
// PARTNER DATA SHARING
// =====================================

exports.generatePartnerDataFeed = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.token?.admin) {
      throw new functions.https.HttpsError("permission-denied", "Admin only");
    }

    const { partner, dataScope } = data;

    // Validate partner
    const validPartners = ["draftkings", "fanduel", "youtubetv", "fanatics"];
    if (!validPartners.includes(partner)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid partner"
      );
    }

    // Generate anonymized data feed based on scope
    const feed = await generateDataFeed(partner, dataScope);

    // Log data sharing for compliance
    await db.collection("dataSharing").add({
      partner,
      dataScope,
      recordCount: feed.length,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      generatedBy: context.auth.uid,
    });

    return feed;
  }
);

async function generateDataFeed(partner, scope) {
  const users = await db
    .collection("users")
    .where(`partnerOffers.${partner}.eligible`, "==", true)
    .get();

  const feed = [];

  users.forEach((doc) => {
    const user = doc.data();

    // Only share based on scope and consent
    if (user.notificationPreferences?.marketing) {
      feed.push({
        anonymousId: crypto.createHash("sha256").update(doc.id).digest("hex"),
        segments: user.segments,
        sportPreferences: Object.keys(user.sportsEngagement || {}),
        valueScore: calculateValueScore(user),
        region: user.location?.state || "Unknown",
      });
    }
  });

  return feed;
}

function calculateValueScore(user) {
  let score = 0;

  // Financial value
  if (user.totalDonations > 1000) score += 50;
  else if (user.totalDonations > 500) score += 30;
  else if (user.totalDonations > 200) score += 20;
  else score += 10;

  // Engagement value
  const totalGames = Object.values(user.sportsEngagement || {}).reduce(
    (sum, sport) => sum + sport.gamesPlayed,
    0
  );

  if (totalGames > 100) score += 30;
  else if (totalGames > 50) score += 20;
  else if (totalGames > 20) score += 10;

  // Referral value
  if (user.referredUsers > 5) score += 20;
  else if (user.referredUsers > 2) score += 10;

  return score;
}
