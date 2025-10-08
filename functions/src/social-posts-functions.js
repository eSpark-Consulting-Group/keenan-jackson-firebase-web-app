const { getRandomCTA, tgSendMessage } = require("./social-posts");

// Platform-Specific Variations (Discussion Needed):

// Twitter (Short) → Auto-adapt from Winner/Recap templates, compressed.
// Instagram (Visual) → Use Winner Announcement + image card designs.
// Telegram (Rich) → Winner templates expanded with Markdown formatting.
// Platform-Specific Winner Post Generators
const cta = getRandomCTA({
  link: "https://example.com/play",
  activePlayerCount: "ESPN Trivia",
  time: "5 minutes",
});

const WinnerPostTwitter = async ({ winnerName, prize, gameName, time }) => {
  const template = `
${winnerName} ➡️ $${prize}${time ? ` ⚡ ${time}s` : ""}

${gameName}: Where speed pays 🏁

#SkillNotLuck #${gameName.replace(/\s+/g, "")}

${cta}
  `;

  return template.trim();
};

const WinnerPostInstagram = async ({
  winnerName,
  team,
  prize,
  time,
  imageUrl,
}) => {
  const template = `
[IMAGE: ${imageUrl || "Winner card with stats 🏆"}]

When your ESPN addiction finally pays off 💰

${winnerName} turned their ${team} knowledge into $${prize} with a lightning-fast ${time}s answer!

NO FEES. Just skill. Just speed. Just win. ⚡

Link in bio to start playing 🎯

${cta}
  `;

  await tgSendMessage(template);

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
  // Export platform-specific functions
  WinnerPostTwitter,
  WinnerPostInstagram,
  WinnerPostTelegram,
};
