require("dotenv").config();
const axios = require("axios");

// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const { logger } = require("firebase-functions");

// Initialize Firebase Admin
// admin.initializeApp();

// Load keys from env
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// =============================
// Facebook Graph API Functions
// =============================

// 1. Facebook Image Post
async function fbImagePost(imageUrl, caption) {
  const url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`;
  const data = {
    url: imageUrl,
    caption,
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  const res = await axios.post(url, data, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

// 2. Facebook Video Post
async function fbVideoPost(videoUrl, description) {
  const url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/videos`;
  const data = {
    file_url: videoUrl,
    description,
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  const res = await axios.post(url, data, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

// 3. Facebook Text + Link Post
async function fbFeedPost(message, link) {
  const url = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/feed`;
  const data = {
    message,
    link,
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  const res = await axios.post(url, data, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
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

  const res = await axios.post(url, data);
  return res.data; // returns "id" (creation_id)
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

  const res = await axios.post(url, data);
  return res.data;
}

// 3. Instagram Publish Container
async function igPublishMedia(creationId) {
  const url = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`;
  const data = {
    creation_id: creationId,
    access_token: FB_PAGE_ACCESS_TOKEN,
  };

  const res = await axios.post(url, data);
  return res.data;
}

// =============================
// Telegram Bot API Functions
// =============================

// 1. Get Bot Info
async function tgGetMe() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
  const res = await axios.post(url);
  return res.data;
}

// 2. Get Updates
async function tgGetUpdates() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
  const res = await axios.post(url);
  return res.data;
}

// 3. Send Text Message
async function tgSendMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const data = { chat_id: TELEGRAM_CHAT_ID, text };

  const res = await axios.post(url, data);
  return res.data;
}

// 4. Send Image (Photo)
async function tgSendPhoto(photoUrl, caption = "") {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const data = {
    chat_id: TELEGRAM_CHAT_ID,
    photo: photoUrl, // must be a valid URL or file_id
    caption: caption,
  };

  const res = await axios.post(url, data);
  return res.data;
}

// 5. Send Video
async function tgSendVideo(videoUrl, caption = "") {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
  const data = {
    chat_id: TELEGRAM_CHAT_ID,
    video: videoUrl, // must be a valid URL or file_id
    caption: caption,
  };

  const res = await axios.post(url, data);
  return res.data;
}

// =============================
// Firebase HTTPS Function Wrapper
// =============================

// exports.apiTest = functions.https.onRequest(async (req, res) => {
//   try {
//     SAMPLE CALLS (uncomment one at a time to test)

//     Facebook
//     const result = await fbImagePost("https://yourdomain.com/photo.jpg", "Hello FB!");

//     Instagram
//     const container = await igImageContainer("https://yourdomain.com/photo.jpg", "Hello IG!");
//     const result = await igPublishMedia(container.id);

//     const container = await igVideoContainer("https://yourdomain.com/video.jpg", "Hello IG!");
//     const result = await igPublishMedia(container.id);

//     Telegram
//     const result = await tgSendMessage("Hello from Firebase Functions!");
//     const result = await tgGetMe();
//     const result = await tgGetUpdates();

//     res.json({
//       success: true,
//       message: "API call success",
//       // result,  // uncomment when testing
//     });
//   } catch (error) {
//     logger.error("API Error", error.response?.data || error.message);
//     res.status(500).json({
//       success: false,
//       error: error.response?.data || error.message,
//     });
//   }
// });

module.exports = {
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
