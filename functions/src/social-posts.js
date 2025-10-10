require("dotenv").config();
const axios = require("axios");

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { TwitterApi } = require("twitter-api-v2");

// Initialize Firebase Admin (safe re-init)
if (!admin.apps.length) admin.initializeApp();

// Load keys from env
const FB_PAGE_ID = process.env.FB_PAGE_ID || "103373862015603";
const FB_PAGE_ACCESS_TOKEN =
  process.env.FB_PAGE_ACCESS_TOKEN ||
  "EAAK3h4UAM2sBPnhZB0jLIYbCS0fTUXduFDe7WNVrCBz0l1uPkuZBaaLzLabzuuCaQdnnqcLhg57CbLN2ScudwMohk9ZBstfHIfWccGE36rFdu2XVMfzirfjaO8pFs6mTMZCdjKStGeo84Xe4Hf0CrOcZCFKywqHpUxh5tP3F9raxWWxDdQEfz9e9E1QFhqNAU34h63kDZBrJkv7TQVhDsZD";
// const FB_USER_ACCESS_TOKEN =
//   process.env.FB_USER_ACCESS_TOKEN ||
//   "EAAK3h4UAM2sBPpsWY1zAKk2PVRC2qsFyDr9RD5vDXIK4egcH8Ji8n9KN0PuWWSlvZBAi9BxUj9LenPZAIwAktLuU38cpJOZCxiTwJdHnteFF1x27ZCHA02HuPeHUi2lU9sCyS0I6CEYipyxuU4D3AYVDwiZAs4Js8LC3ULZC5dJmSBw3QEjXwukwwaBSQElOCbvKVdTdtNK27Q";
const IG_USER_ID = process.env.IG_USER_ID || "17841414682425711";
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  "8437839049:AAFW3qU7gDPxG_yH951oSMHt56aKz8xv_wM";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 1310589021;

const client = new TwitterApi({
  appKey: process.env.X_CONSUMER_KEY,
  appSecret: process.env.X_CONSUMER_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

// Unified logging helper
function logInfo(context, data) {
  console.log(`🟢 [INFO] ${context}:`, data);
  logger.info(`[${context}]`, data);
}
function logError(context, error) {
  console.error(
    `🔴 [ERROR] ${context}:`,
    error.response?.data || error.message
  );
  logger.error(`[${context}]`, error.response?.data || error.message);
}

// =============================
// Facebook Graph API Functions
// =============================

// Unified Facebook Post (Image, Video, Text, or Link)
async function fbPublish({ media, caption, link }) {
  const ext = media?.split(".").pop().toLowerCase();
  let url, data, type;

  try {
    // Determine endpoint & payload
    if (["jpg", "jpeg", "png"].includes(ext)) {
      // 🖼️ Image Post
      type = "Image";
      url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`;
      data = { url: media, caption, access_token: FB_PAGE_ACCESS_TOKEN };
    } else if (ext === "mp4") {
      // 🎥 Video Post
      type = "Video";
      url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/videos`;
      data = {
        file_url: media,
        description: caption,
        access_token: FB_PAGE_ACCESS_TOKEN,
      };
    } else if (link) {
      // 🔗 Link Post
      type = "Link";
      url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/feed`;
      data = { message: caption, link, access_token: FB_PAGE_ACCESS_TOKEN };
    } else if (!media && caption) {
      // 📝 Text-only Post
      type = "Text";
      url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/feed`;
      data = { message: caption, access_token: FB_PAGE_ACCESS_TOKEN };
    } else {
      throw new Error(`❌ Unsupported file type: ${ext || "unknown"}.`);
    }

    // Execute post
    logInfo(`Facebook ${type} Post`, { url, data });
    const res = await axios.post(url, data);
    logInfo(`Facebook ${type} Post Response`, res.data);

    return res.data;
  } catch (error) {
    logError("Facebook Publish", error.response?.data || error);
    throw error;
  }
}

// =============================
// Instagram Graph API Functions
// =============================

// Unified Instagram Media Upload + Publish Function
// Upload + Publish to Instagram (Image or Video)
async function igPublish({ media, caption, type = "IMAGE" }) {
  const createUrl = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media`;
  const publishUrl = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`;

  const data = {
    caption,
    access_token: FB_PAGE_ACCESS_TOKEN,
    ...(type === "VIDEO"
      ? { media_type: "VIDEO", video_url: media }
      : { image_url: media }),
  };

  try {
    // Step 1 — Create container
    logInfo(`Instagram ${type} Container`, { media, caption });
    const containerRes = await axios.post(createUrl, data);
    logInfo("Instagram Container Response", containerRes.data);

    const creationId = containerRes.data.id;
    if (!creationId)
      throw new Error("❌ No creation_id returned from Instagram.");

    // Step 2 — Publish media
    const publishData = {
      creation_id: creationId,
      access_token: FB_PAGE_ACCESS_TOKEN,
    };
    logInfo("Instagram Publish Media", { creationId });
    const publishRes = await axios.post(publishUrl, publishData);
    logInfo("Instagram Publish Media Response", publishRes.data);

    return publishRes.data;
  } catch (error) {
    logError("Instagram Publish Media", error.response?.data || error);
    throw error;
  }
}

// =============================
// Telegram Bot API Functions
// =============================

async function tgGetMe() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
  try {
    logInfo("Telegram GetMe", url);
    const res = await axios.post(url);
    logInfo("Telegram GetMe Response", res.data);
    return res.data;
  } catch (error) {
    logError("Telegram GetMe", error);
    throw error;
  }
}

async function tgGetUpdates() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
  try {
    logInfo("Telegram GetUpdates", url);
    const res = await axios.post(url);
    logInfo("Telegram GetUpdates Response", res.data);
    return res.data;
  } catch (error) {
    logError("Telegram GetUpdates", error);
    throw error;
  }
}
// Unified Telegram Post (Text, Photo, or Video)
async function tgPublish({ text, media, caption = "" }) {
  let url, data, type;
  const ext = media?.split(".").pop()?.toLowerCase();

  try {
    if (!media && text) {
      // 📝 Text message
      type = "Message";
      url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      data = { chat_id: TELEGRAM_CHAT_ID, text };
    } else if (["jpg", "jpeg", "png"].includes(ext)) {
      // 🖼️ Photo post
      type = "Photo";
      url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      data = { chat_id: TELEGRAM_CHAT_ID, photo: media, caption };
    } else if (ext === "mp4") {
      // 🎥 Video post
      type = "Video";
      url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
      data = { chat_id: TELEGRAM_CHAT_ID, video: media, caption };
    } else {
      throw new Error(`❌ Unsupported media type: ${ext || "unknown"}.`);
    }

    // Execute post
    logInfo(`Telegram Send${type}`, data);
    const res = await axios.post(url, data);
    logInfo(`Telegram Send${type} Response`, res.data);

    return res.data;
  } catch (error) {
    logError("Telegram Publish", error.response?.data || error);
    throw error;
  }
}

// =============================
// Firebase HTTPS Function Wrapper
// =============================

const CTA_VARIATIONS = [
  "Speed Wins. Always. Play now → {link}",
  "Your speed = Your winnings 💰",
  "NO FEES - Test your speed → {link}",
  "Think you’re fast? Prove it → {link}",
  "Join {activePlayerCount} winners. Speed Wins. Always.",
  "Next game in {time} - Get your square NOW",
  "The fastest finger wins. Always. → {link}",
  "Turn milliseconds into money → {link}",
];

/**
 * Replace placeholders with dynamic values.
 */
function replacePlaceholders(cta, { link, activePlayerCount, time }) {
  return cta
    .replace("{link}", link || "")
    .replace("{activePlayerCount}", activePlayerCount || "thousands of")
    .replace("{time}", time || "a few minutes");
}

/**
 * Generate a random CTA variation.
 * Only select CTAs that have required placeholders available.
 */
function getRandomCTA(context = {}) {
  const { link, activePlayerCount, time } = context;

  // Filter CTAs that can be filled
  const eligibleCTAs = CTA_VARIATIONS.filter((cta) => {
    if (cta.includes("{link}") && !link) return false;
    if (cta.includes("{activePlayerCount}") && !activePlayerCount) return false;
    if (cta.includes("{time}") && !time) return false;
    return true;
  });

  // Fallback: if none eligible, use a default CTA
  const finalCTAs = eligibleCTAs.length
    ? eligibleCTAs
    : ["Speed Wins. Always. Play now →"];

  const randomCTA = finalCTAs[Math.floor(Math.random() * finalCTAs.length)];
  return replacePlaceholders(randomCTA, context);
}

// ✅ Append CTA to post template
// const template = "🔥 The next trivia challenge is LIVE!";
// const content = `${template}\n\n\n${ctaText}`;

// ✅ Export reusable function
async function twPublish({ message, link, imagePath, videoPath }) {
  try {
    let text = message || "";
    if (link) text += `\n\n${link}`;

    let mediaIds = [];

    // ✅ Upload media if provided
    if (imagePath) {
      const mediaId = await client.v1.uploadMedia(imagePath);
      mediaIds.push(mediaId);
    } else if (videoPath) {
      const mediaId = await client.v1.uploadMedia(videoPath, { type: "video" });
      mediaIds.push(mediaId);
    }

    // ✅ Post tweet
    const payload = mediaIds.length
      ? { text, media: { media_ids: mediaIds } }
      : { text };

    const res = await client.v2.tweet(payload);
    console.log("✅ Tweet posted successfully:", res.data.id);

    return res;
  } catch (error) {
    console.error("❌ Failed to post tweet:", error);
    throw error;
  }
}

function getHashtags(context = {}) {
  const { category } = context; // e.g. "standard", "nfl", "bigwin"

  const HASHTAG_SETS = {
    standard: [
      "#SquareTrivia",
      "#SpeedWins",
      "#SpeedWinsAlways",
      "#NoFees",
      "#WinWithSpeed",
    ],
    nfl: ["#NFLSunday", "#SpeedWins", "#SundaySquares", "#FastestFingerWins"],
    bigwin: ["#BigWin", "#SpeedPays", "#TriviaMaster", "#SpeedWinsAlways"],
  };

  // Pick matching set (default = standard)
  const hashtags =
    HASHTAG_SETS[category?.toLowerCase()] || HASHTAG_SETS.standard;

  // Shuffle a bit for variation
  const shuffled = hashtags.sort(() => 0.5 - Math.random());

  // Return as joined string
  return shuffled.join(" ");
}

// =============================
// Exports for local use
// =============================

module.exports = {
  getRandomCTA,
  getHashtags,
  tgGetMe,
  tgGetUpdates,
  twPublish,
  fbPublish,
  igPublish,
  tgPublish,
};
