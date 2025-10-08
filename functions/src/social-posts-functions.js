const {
  getRandomCTA,
  postTweet,
  fbImagePost,
  fbVideoPost,
  fbFeedPost,
  igImageContainer,
  igVideoContainer,
  igPublishMedia,
  tgSendMessage,
  getHashtags,
  // tgGetMe,
  // tgGetUpdates,
  // tgSendPhoto,
  // tgSendVideo,
} = require("./social-posts");

const hashTags = getHashtags();
const link = "https://squaretrivia.com/games";

// ==========================================================
// Handles all platforms automatically based on media type
// ==========================================================

async function postToAllPlatforms({ media, caption, link }) {
  const ext = media?.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png"].includes(ext)) {
    await fbImagePost(media, caption);
    const container = await igImageContainer(media, caption);
    await igPublishMedia(container.id);
  } else if (ext === "mp4") {
    await fbVideoPost(media, caption);
    const container = await igVideoContainer(media, caption);
    await igPublishMedia(container.id);
  } else if (link) {
    await fbFeedPost(caption, link);
  } else {
    throw new Error(`❌ Unsupported file type: .${ext}. Use JPG, PNG, or MP4.`);
  }

  await postTweet(caption);
  await tgSendMessage(caption);
  return caption.trim();
}

// ==========================================================
// Builds post text with CTA + hashTags
// ==========================================================
function buildTemplate(body, cta) {
  return `${body.trim()}

${cta}

${hashTags}`;
}

// ==========================================================
// Post Templates
// ==========================================================

// =======================================================================================
// =======================================================================================
// Platform Milestone Post Generator
// =======================================================================================
// =======================================================================================

// Trigger: Platform growth milestones or record events.
// Platform Milestone → When total payouts cross a big milestone ($10k, $50k, $100k).
// Record Breaker → When someone sets a new fastest-answer record.

// ==========================================================
// No Fees Post Generator
// ==========================================================

async function NoFeesPost({ mediaToUpload, captionLink }) {
  const cta = getRandomCTA({ link });
  const options = [
    { icon: "⚡", title: "Express service", detail: "Get 96% today" },
    { icon: "⏰", title: "Standard service", detail: "Get 100% in 2–3 days" },
  ]
    .map((o) => `${o.icon} ${o.title}: ${o.detail}`)
    .join("\n");

  const body = `
NO FEES Emphasis:
Win $200? Get paid $200! NO FEES on Square Trivia!  

${options}

Your choice, your money!
  `;

  return postToAllPlatforms({
    media: mediaToUpload,
    caption: buildTemplate(body, cta),
    link: captionLink,
  });
}

// ==========================================================
// Skill Celebration Post Generator
// ==========================================================

async function SkillCelebration({
  recentWinner,
  time,
  prize,
  mediaToUpload,
  captionLink,
}) {
  const cta = getRandomCTA({ link, time });
  const comparisons = [
    { icon: "🎲", label: "Traditional squares", desc: "Hope for luck" },
    { icon: "⚡", label: "Square Trivia winners", desc: "Trust their speed" },
  ]
    .map((c) => `${c.label}: ${c.icon} ${c.desc}`)
    .join("\n");

  const body = `
Skill Celebration
What separates Square Trivia winners from everyone else?

${comparisons}

${recentWinner} just proved it with a ${time}s answer for $${prize}!
  `;

  return postToAllPlatforms({
    media: mediaToUpload,
    caption: buildTemplate(body, cta),
    link: captionLink,
  });
}

// =======================================================================================
// =======================================================================================
// Engagement Builders
// =======================================================================================
// =======================================================================================

// Trigger: Weekly, to drive conversation and competition.
// Referral Leaderboard → Weekly (Sunday night / Monday morning).
// Team Rivalry → Post mid-week OR before a major rivalry game (Cowboys vs Eagles, Chiefs vs Bills, etc.).

// ==========================================================
// Team Rivalry Post Generator
// ==========================================================

async function TeamRivalryPost({
  teamA,
  teamB,
  teamAWins,
  teamBWins,
  mediaToUpload,
  captionLink,
}) {
  const cta = getRandomCTA({ link });
  const body = `
Team Rivalry
Battle of the Fanbases! 🏈

${teamA} fans: ${teamAWins} wins this week  
${teamB} fans: ${teamBWins} wins this week  

Who knows their team better? Prove it on Sunday!
  `;

  return postToAllPlatforms({
    media: mediaToUpload,
    caption: buildTemplate(body, cta),
    link: captionLink,
  });
}

// ==========================================================
// Referral Leaderboard Post Generator
// ==========================================================

async function ReferralLeaderboard({
  winners = [],
  mediaToUpload,
  captionLink,
}) {
  const cta = getRandomCTA({ link });
  const leaderboard = winners
    .map(
      (w, i) =>
        `${i + 1}. ${w.name}: $${w.amount} won from ${w.referrals} referrals`
    )
    .join("\n");

  const body = `
Referral Leaderboard
🏆 This Week's Referral Winners:

${leaderboard}

These players win on the board AND off the board.
  `;

  return postToAllPlatforms({
    media: mediaToUpload,
    caption: buildTemplate(body, cta),
    link: captionLink,
  });
}

// =======================================================================================
// =======================================================================================
// Platform-Specific Variations (Discussion Needed):
// =======================================================================================
// =======================================================================================

// Twitter (Short) → Auto-adapt from Winner/Recap templates, compressed.
// Instagram (Visual) → Use Winner Announcement + image card designs.
// Telegram (Rich) → Winner templates expanded with Markdown formatting.
// Platform-Specific Winner Post Generators

// ==========================================================
// Twitter (Short) Winner Post Generator
// ==========================================================

async function WinnerPostTwitter({ winnerName, prize, gameName, time }) {
  const cta = getRandomCTA({ link, time });
  const body = `
${winnerName} ➡️ $${prize}${time ? ` ⚡ ${time}s` : ""}

${gameName}: Where speed pays 🏁

#SkillNotLuck #${gameName.replace(/\s+/g, "")}
  `;

  const post = buildTemplate(body, cta);
  await postTweet(post);
  return post;
}

// ==========================================================
// Instagram (Visual) Winner Post Generator
// ==========================================================

async function WinnerPostInstagram({
  winnerName,
  team,
  prize,
  time,
  mediaToUpload,
  imageUrl,
}) {
  const cta = getRandomCTA({ link, time });
  const body = `
[IMAGE: ${imageUrl || "Winner card 🏆"}]

When your ESPN addiction finally pays off 💰

${winnerName} turned their ${team} knowledge into $${prize} with a lightning-fast ${time}s answer!

NO FEES. Just skill. Just speed. Just win. ⚡
  `;

  return postToAllPlatforms({
    media: mediaToUpload,
    caption: buildTemplate(body, cta),
  });
}

// ==========================================================
// Telegram (Rich) Winner Post Generator
// ==========================================================

async function WinnerPostTelegram({
  winnerName,
  prize,
  time,
  team1,
  team2,
  square,
  triviaQuestion,
  answer,
}) {
  const cta = getRandomCTA({ link, time });
  const body = `
🔥 *WINNER ALERT* 🔥

*Player:* ${winnerName}
*Prize:* $${prize}
*Answer Time:* ⚡ ${time}s
*Game:* ${team1} vs ${team2}
*Square:* ${square}

_"${triviaQuestion}"_
Answer: *${answer}*

Think you could’ve been faster? Join now - NO FEES!
  `;

  const post = buildTemplate(body, cta);
  await tgSendMessage(post);
  return post;
}

// =======================================================================================
// =======================================================================================
// Exports
// =======================================================================================
// =======================================================================================

module.exports = {
  // Milestone / Special Events
  NoFeesPost,
  SkillCelebration,
  // Export Engagement Builders
  ReferralLeaderboard,
  TeamRivalryPost,
  // Export platform-specific functions
  WinnerPostTwitter,
  WinnerPostInstagram,
  WinnerPostTelegram,
};
