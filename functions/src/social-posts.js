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

// 1. Facebook Image Post
async function fbImagePost(imageUrl, caption) {
  const url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`;
  const data = { url: imageUrl, caption, access_token: FB_PAGE_ACCESS_TOKEN };

  try {
    logInfo("Facebook Image Post", { url, caption });
    const res = await axios.post(url, data);
    logInfo("Facebook Image Post Response", res.data);
    return res.data;
  } catch (error) {
    logError("Facebook Image Post", error);
    throw error;
  }
}

// 2. Facebook Video Post
async function fbVideoPost(videoUrl, description) {
  const url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/videos`;
  const data = {
    file_url: videoUrl,
    description,
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  try {
    logInfo("Facebook Video Post", { url, description });
    const res = await axios.post(url, data);
    logInfo("Facebook Video Post Response", res.data);
    return res.data;
  } catch (error) {
    logError("Facebook Video Post", error);
    throw error;
  }
}

// 3. Facebook Text + Link Post
async function fbFeedPost(message, link) {
  const url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/feed`;
  const data = {
    message,
    ...(link ? { link } : {}), // Only include link if provided
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  try {
    logInfo("Facebook Feed Post", { message, link });
    const res = await axios.post(url, data);
    logInfo("Facebook Feed Post Response", res.data);
    return res.data;
  } catch (error) {
    logError("Facebook Feed Post", error);
    throw error;
  }
}

// =============================
// Instagram Graph API Functions
// =============================

// 1. Instagram Create Image Media Container
async function igImageContainer(imageUrl, caption) {
  const url = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media`;
  const data = {
    image_url: imageUrl,
    caption,
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  try {
    logInfo("Instagram Image Container", { imageUrl, caption });
    const res = await axios.post(url, data);
    logInfo("Instagram Image Container Response", res.data);
    return res.data;
  } catch (error) {
    logError("Instagram Image Container", error);
    throw error;
  }
}

// 2. Instagram Create Video Media Container
async function igVideoContainer(videoUrl, caption) {
  const url = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media`;
  const data = {
    media_type: "VIDEO",
    video_url: videoUrl,
    caption,
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  try {
    logInfo("Instagram Video Container", { videoUrl, caption });
    const res = await axios.post(url, data);
    logInfo("Instagram Video Container Response", res.data);
    return res.data;
  } catch (error) {
    logError("Instagram Video Container", error);
    throw error;
  }
}

// 3. Instagram Publish Container
async function igPublishMedia(creationId) {
  const url = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`;
  const data = { creation_id: creationId, access_token: FB_PAGE_ACCESS_TOKEN };

  try {
    logInfo("Instagram Publish Media", { creationId });
    const res = await axios.post(url, data);
    logInfo("Instagram Publish Media Response", res.data);
    return res.data;
  } catch (error) {
    logError("Instagram Publish Media", error);
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

async function tgSendMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const data = { chat_id: TELEGRAM_CHAT_ID, text };

  try {
    logInfo("Telegram SendMessage", { text });
    const res = await axios.post(url, data);
    logInfo("Telegram SendMessage Response", res.data);
    return res.data;
  } catch (error) {
    logError("Telegram SendMessage", error);
    throw error;
  }
}

async function tgSendPhoto(photoUrl, caption = "") {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const data = { chat_id: TELEGRAM_CHAT_ID, photo: photoUrl, caption };

  try {
    logInfo("Telegram SendPhoto", { photoUrl, caption });
    const res = await axios.post(url, data);
    logInfo("Telegram SendPhoto Response", res.data);
    return res.data;
  } catch (error) {
    logError("Telegram SendPhoto", error);
    throw error;
  }
}

async function tgSendVideo(videoUrl, caption = "") {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
  const data = { chat_id: TELEGRAM_CHAT_ID, video: videoUrl, caption };

  try {
    logInfo("Telegram SendVideo", { videoUrl, caption });
    const res = await axios.post(url, data);
    logInfo("Telegram SendVideo Response", res.data);
    return res.data;
  } catch (error) {
    logError("Telegram SendVideo", error);
    throw error;
  }
}

// =============================
// Firebase HTTPS Function Wrapper
// =============================

exports.apiTest = functions.https.onRequest(async (req, res) => {
  try {
    logInfo("API Test Triggered", req.query || req.body);
    // SAMPLE CALLS (uncomment one at a time to test)

    // Facebook;
    // const result = await fbImagePost(
    //   "https://yourdomain.com/photo.jpg",
    //   "Hello FB!"
    // );

    // Instagram
    // const container = await igImageContainer("https://yourdomain.com/photo.jpg", "Hello IG!");
    // const result = await igPublishMedia(container.id);

    // const container = await igVideoContainer("https://yourdomain.com/video.jpg", "Hello IG!");
    // const result = await igPublishMedia(container.id);

    // Telegram
    // const result = await tgSendMessage("Hello from Firebase Functions!");
    // const result = await tgGetMe();
    // const result = await tgGetUpdates();

    res.json({
      success: true,
      message: "API call success",
      // data: result,
    });
  } catch (error) {
    logError("API Test Handler", error);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

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
async function postTweet({ message, link, imagePath, videoPath }) {
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
// Tweets can be posted in several formats:

//Text only
// await postTweet({ message: "Speed Wins. Always. ⚡" });

// Text + Link
// await postTweet({
//   message: "Think you’re fast? Prove it →",
//   link: "https://squaretrivia.com",
// });

//  Text + Image
// await postTweet({
//   message: "Big win today 🏆 #SquareTrivia",
//   imagePath: "./media/winner.jpg",
// });

// Text + Video
// await postTweet({
//   message: "Watch how speed wins ⚡",
//   videoPath: "./media/highlight.mp4",
// });

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

// getHashtags({ category: "nfl" });
// → "#SpeedWins #SundaySquares #FastestFingerWins #NFLSunday"

// getHashtags({ category: "bigwin" });
// → "#TriviaMaster #SpeedPays #BigWin #SpeedWinsAlways"

// getHashtags();
// → "#NoFees #SquareTrivia #SpeedWins #SpeedWinsAlways #WinWithSpeed"

// =============================
// Exports for local use
// =============================

module.exports = {
  getRandomCTA,
  getHashtags,
  postTweet,
  fbImagePost,
  fbVideoPost,
  fbFeedPost,
  igImageContainer,
  igVideoContainer,
  igPublishMedia,
  tgGetMe,
  tgGetUpdates,
  tgSendMessage,
  tgSendPhoto,
  tgSendVideo,
};
