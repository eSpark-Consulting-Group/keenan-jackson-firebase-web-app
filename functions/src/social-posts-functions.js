const {
  getRandomCTA,
  tgSendMessage,
  fbImagePost,
  igImageContainer,
  igPublishMedia,
  fbVideoPost,
  igVideoContainer,
  fbFeedPost,
  postTweet,
} = require("./social-posts");

// 7. Engagement Builders (New PUB SUB NEEDED)
// Trigger: Weekly, to drive conversation and competition.
// Referral Leaderboard → Weekly (Sunday night / Monday morning).
// Team Rivalry → Post mid-week OR before a major rivalry game (Cowboys vs Eagles, Chiefs vs Bills, etc.).

const link = "https://squaretrivia.com/games";

// Team Rivalry Post Generator
const TeamRivalryPost = async ({
  teamA = "Cowboys", // Example teams
  teamB = "Eagles", // Example teams
  teamAWins = 0, // Example win counts
  teamBWins = 0, // Example win counts
  mediaToUpload,
  captionLink,
}) => {
  const cta = getRandomCTA({
    link: link,
  });

  const template = `
Team Rivalry
Battle of the Fanbases! 🏈

${teamA} fans: ${teamAWins} wins this week  
${teamB} fans: ${teamBWins} wins this week  

Who knows their team better? Prove it on Sunday!

${cta}
  `;
  const ext = mediaToUpload.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png"].includes(ext)) {
    // Facebook Video
    await fbImagePost(mediaToUpload, template); // or you can handle specific image types if needed
    // Instagram
    const container = await igImageContainer(mediaToUpload, template);
    await igPublishMedia(container.id);
  } else if (ext === "mp4") {
    // Facebook
    await fbVideoPost(mediaToUpload, template);
    // Instagram
    const container = await igVideoContainer(mediaToUpload, template);
    await igPublishMedia(container.id);
  } else if (captionLink && captionLink !== "") {
    // Facebook Link
    await fbFeedPost(template, captionLink);
  } else {
    throw new Error(
      `❌ Unsupported file type: .${ext}. Only JPG, PNG, or MP4 allowed.`
    );
  }
  // Tweeter post
  await postTweet(template);
  // Telegram post with formatting
  await tgSendMessage(template);

  return template.trim();
};

// Referral Leaderboard Post Generator
const ReferralLeaderboard = async ({
  winners = [],
  mediaToUpload,
  captionLink,
}) => {
  const cta = getRandomCTA({
    link: link,
  });

  // Each winner object should look like:
  // { name: "Ali", amount: 120, referrals: 8 }

  const leaderboard = winners
    .map(
      (w, i) =>
        `${i + 1}. ${w.name}: $${w.amount} won from ${w.referrals} referrals`
    )
    .join("\n");

  const template = `
Referral Leaderboard
🏆 This Week's Referral Winners:

${leaderboard}

These players win on the board AND off the board.

${cta}
  `;

  const ext = mediaToUpload.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png"].includes(ext)) {
    // Facebook Video
    await fbImagePost(mediaToUpload, template); // or you can handle specific image types if needed
    // Instagram
    const container = await igImageContainer(mediaToUpload, template);
    await igPublishMedia(container.id);
  } else if (ext === "mp4") {
    // Facebook
    await fbVideoPost(mediaToUpload, template);
    // Instagram
    const container = await igVideoContainer(mediaToUpload, template);
    await igPublishMedia(container.id);
  } else if (captionLink && captionLink !== "") {
    // Facebook Link
    await fbFeedPost(template, captionLink);
  } else {
    throw new Error(
      `❌ Unsupported file type: .${ext}. Only JPG, PNG, or MP4 allowed.`
    );
  }
  // Tweeter post
  await postTweet(template);
  // Telegram post with formatting
  await tgSendMessage(template);

  return template.trim();
};

// Platform-Specific Variations (Discussion Needed):

// Twitter (Short) → Auto-adapt from Winner/Recap templates, compressed.
// Instagram (Visual) → Use Winner Announcement + image card designs.
// Telegram (Rich) → Winner templates expanded with Markdown formatting.
// Platform-Specific Winner Post Generators

const WinnerPostTwitter = async ({ winnerName, prize, gameName, time }) => {
  const cta = getRandomCTA({
    link: link,
    time: time,
  });
  const template = `
${winnerName} ➡️ $${prize}${time ? ` ⚡ ${time}s` : ""}

${gameName}: Where speed pays 🏁

#SkillNotLuck #${gameName.replace(/\s+/g, "")}

${cta}
  `;

  // Tweeter post
  await postTweet(template);

  return template.trim();
};

const WinnerPostInstagram = async ({
  winnerName,
  team,
  prize,
  time,
  imageUrl,
  mediaToUpload,
}) => {
  const cta = getRandomCTA({
    link: link,
    time: time,
  });
  const template = `
[IMAGE: ${imageUrl || "Winner card with stats 🏆"}]

When your ESPN addiction finally pays off 💰

${winnerName} turned their ${team} knowledge into $${prize} with a lightning-fast ${time}s answer!

NO FEES. Just skill. Just speed. Just win. ⚡

Link in bio to start playing 🎯

${cta}
  `;

  const ext = mediaToUpload.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png"].includes(ext)) {
    // Facebook Video
    await fbImagePost(mediaToUpload, template); // or you can handle specific image types if needed
    // Instagram
    const container = await igImageContainer(mediaToUpload, template);
    await igPublishMedia(container.id);
  } else if (ext === "mp4") {
    // Facebook
    await fbVideoPost(mediaToUpload, template);
    // Instagram
    const container = await igVideoContainer(mediaToUpload, template);
    await igPublishMedia(container.id);
  } else {
    throw new Error(
      `❌ Unsupported file type: .${ext}. Only JPG, PNG, or MP4 allowed.`
    );
  }

  return template.trim();
};

const WinnerPostTelegram = async ({
  winnerName,
  prize,
  time,
  team1,
  team2,
  square,
  triviaQuestion,
  answer,
  tgSendMessage, // callback function to send message
}) => {
  const cta = getRandomCTA({
    link: link,
    time: time,
  });
  const template = `
🔥 *WINNER ALERT* 🔥

*Player:* ${winnerName}
*Prize:* $${prize}
*Answer Time:* ⚡ ${time} seconds
*Game:* ${team1} vs ${team2}
*Square:* ${square}

_"${triviaQuestion}"_
Answer: *${answer}*

Think you could've been faster? Join now - NO FEES!

${cta}
  `.trim();

  await tgSendMessage(template);

  return template;
};

module.exports = {
  // Export Engagement Builders
  ReferralLeaderboard,
  TeamRivalryPost,
  // Export platform-specific functions
  WinnerPostTwitter,
  WinnerPostInstagram,
  WinnerPostTelegram,
};
