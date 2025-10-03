const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.handleGameEnd = functions.firestore
  .document("games/{gameId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when a game ends
    if (before.status !== "ENDED" && after.status === "ENDED") {
      console.log(`Game ${context.params.gameId} ended`);

      try {
        const { winner, runnerUp, prize, winTime, loseTime, teams, square } =
          after;

        let message = "";
        const diff =
          loseTime && winTime ? (loseTime - winTime).toFixed(2) : null;

        // --- Template Selection ---
        if (prize >= 100) {
          // Big Win
          message = `🚨 ${winner} just took home $${prize} with a blazing ${winTime}s answer! Think you're faster? 🏃‍♂️\n\n${teams[0]} vs ${teams[1]} - Square ${square}\nSpeed Wins. Always.\n#SquareTrivia #SpeedWins`;
        } else if (diff && diff < 1) {
          // Photo Finish
          message = `INSANE FINISH! 🏁 \n${winner} beats ${runnerUp} by just ${diff} seconds!\nWinner: ${winTime}s\nRunner-up: ${loseTime}s\n\nEvery millisecond counts!\nSpeed Wins. Always. 📸`;
        } else {
          // Standard Win
          message = `BOOM! 💥 $${prize} win for ${winner} on the ${teams[0]} vs ${teams[1]} board!\nAnswer time: ${winTime} seconds ⚡\n\nSpeed Wins. Always.`;
        }

        console.log("Generated Message:", message);

        // Save to Firestore for social queue / automation
        await admin.firestore().collection("socialQueue").add({
          gameId: context.params.gameId,
          type: "winner_announcement",
          message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {
        console.error("Error handling game end:", err);
      }
    }
  });


  function buildPromotionTemplate({ team1, team2, tiers, spotsLeft, hoursToStart }) {
  let message = "";

  // Upcoming Game: 2–3 days before kickoff
  if (hoursToStart >= 48 && hoursToStart <= 72) {
    const tierList = tiers
      .map((t) => `✅ $${t.price} tier - Win $${t.payout}/quarter`)
      .join("\n");

    message = `🏈 ${team1} vs ${team2} boards are LIVE!\n\n${tierList}\n\nNO FEES - Answer fast, win big!`;
  }

  // Last Chance: <3 hours or <20% squares left
  else if (hoursToStart <= 3 || (spotsLeft / (tiers.reduce((a, t) => a + t.total, 0))) < 0.2) {
    const highestTier = Math.max(...tiers.map((t) => t.price));
    message = `⏰ FINAL CALL: ${team1} vs ${team2} kicks off in ${hoursToStart} hours!\n\nStill ${spotsLeft} squares available\nBiggest tier still open: $${highestTier}\n\nDon't miss out! 🎯`;
  }

  return message || null;
}


upcomingGames.forEach((doc) => {
  const data = doc.data();

  const team1 = data.teams?.[0] || "Team A";
  const team2 = data.teams?.[1] || "Team B";
  const tiers = data.tiers || []; // e.g. [{ price:25, payout:200, total:100 }]
  const spotsLeft = data.spotsLeft || 0;
  const hoursToStart = Math.floor((data.gameDate.toDate() - Date.now()) / (1000*60*60));

  const promoMessage = buildPromotionTemplate({ team1, team2, tiers, spotsLeft, hoursToStart });

  if (promoMessage) {
    console.log("Generated Promotion:", promoMessage);
    db.collection("socialQueue").add({
      gameId: doc.id,
      type: "promotion",
      message: promoMessage,
      timestamp: getTimestamp(),
    });
  }
});


const trustBuildingMessages = functions.pubsub
  .schedule("every monday 10:00") // Weekly credibility push
  .timeZone("America/Denver")
  .onRun(async (context) => {
    const db = admin.firestore();

    try {
      // Weekly NO FEES emphasis
      const message = `Win $200? Get paid $200! NO FEES on Square Trivia!\n\n⚡ Express service: Get 96% today\n⏰ Standard service: Get 100% in 2-3 days\nYour choice, your money!`;

      console.log("Generated NO FEES reminder:", message);

      await db.collection("socialQueue").add({
        type: "trust_building",
        subtype: "no_fees_reminder",
        message,
        timestamp: getTimestamp(),
      });
    } catch (error) {
      logError(error, { context: "trustBuildingMessages" });
    }
  });

  async function handlePayoutProcessed(payout) {
  const db = admin.firestore();

  // NO FEES trust message after payout
  const message = `Win $${payout.amount}? Get paid $${payout.amount}! NO FEES on Square Trivia!\n\n⚡ Express service: Get 96% today\n⏰ Standard service: Get 100% in 2-3 days\nYour choice, your money!`;

  await db.collection("socialQueue").add({
    type: "trust_building",
    subtype: "payout_confirmation",
    message,
    payoutId: payout.id,
    timestamp: getTimestamp(),
  });
}


function buildSkillCelebration({ recentWinner, prize, time }) {
  return `What separates Square Trivia winners from everyone else?\n\nTraditional squares: 🎲 Hope for luck\nSquare Trivia winners: ⚡ Trust their speed\n\n${recentWinner} just proved it with a ${time}s answer for $${prize}!\nSpeed Wins. Always. 🧠💰`;
}

// Inside handleGameEnd:
if (winTime <= 2) {
  const skillMessage = buildSkillCelebration({
    recentWinner: winner,
    prize,
    time: winTime,
  });

  await admin.firestore().collection("socialQueue").add({
    gameId: context.params.gameId,
    type: "trust_building",
    subtype: "skill_celebration",
    message: skillMessage,
    timestamp: getTimestamp(),
  });
}


const milestoneMessages = functions.pubsub
  .schedule("every 12 hours") // Check twice a day
  .timeZone("America/Denver")
  .onRun(async (context) => {
    const db = admin.firestore();

    try {
      // Fetch system stats (assuming you track payouts + records in a stats collection)
      const statsDoc = await db.collection("systemStats").doc("global").get();
      if (!statsDoc.exists) return;

      const { totalPayouts, fastestAnswer } = statsDoc.data();

      let messages = [];

      // --- Milestone: total payouts ---
      const milestones = [10000, 50000, 100000, 500000, 1000000];
      const reachedMilestone = milestones.find(
        (m) => totalPayouts >= m && !statsDoc.data().[`milestone_${m}`]
      );

      if (reachedMilestone) {
        const msg = `🚀 PLATFORM MILESTONE!\n\nWe’ve officially paid out **$${reachedMilestone.toLocaleString()}+** to players! 🎉\n\nThank you for being part of Square Trivia.\n\nSpeed Wins. Always. 🏆`;
        messages.push({
          type: "milestone",
          subtype: "platform_payout",
          message: msg,
        });

        // mark milestone so we don’t repeat
        await db.collection("systemStats").doc("global").update({
          [`milestone_${reachedMilestone}`]: true,
        });
      }

      // --- Record Breaker: fastest answer ---
      const recordDoc = await db
        .collection("systemStats")
        .doc("records")
        .get();
      if (recordDoc.exists) {
        const { winner, prize, time } = recordDoc.data();
        const msg = `⚡ RECORD BREAKER!\n\n${winner} just set a new fastest-answer record: **${time}s** for $${prize}! 🧠💰\n\nSkill > Luck. Speed Wins. Always.`;
        messages.push({
          type: "milestone",
          subtype: "record_breaker",
          message: msg,
        });
      }

      // Save all milestone messages to social queue
      for (const m of messages) {
        await db.collection("socialQueue").add({
          ...m,
          timestamp: getTimestamp(),
        });
      }
    } catch (error) {
      logError(error, { context: "milestoneMessages" });
    }
  });


  const engagementMessages = functions.pubsub
  .schedule("every sunday 23:00") // Sunday night for referral leaderboard
  .timeZone("America/Denver")
  .onRun(async (context) => {
    const db = admin.firestore();

    try {
      let messages = [];

      // --- Referral Leaderboard ---
      // Assume you keep referral stats in a "referrals" or "leaderboard" collection
      const referralSnapshot = await db
        .collection("referrals")
        .orderBy("weeklyEarnings", "desc")
        .limit(3)
        .get();

      if (!referralSnapshot.empty) {
        const top3 = referralSnapshot.docs.map((d, i) => {
          const data = d.data();
          return `${i + 1}. ${data.username}: $${data.weeklyEarnings} won from ${data.weeklyReferrals} referrals`;
        });

        const referralMessage = `🏆 This Week's Referral Winners:\n\n${top3.join(
          "\n"
        )}\n\nThese players win on the board AND off the board.\nSpeed Wins. Always. 💰`;

        messages.push({
          type: "engagement",
          subtype: "referral_leaderboard",
          message: referralMessage,
        });
      }

      // --- Team Rivalry (mid-week check) ---
      // Trigger separately on Wednesday for hype
      const now = new Date();
      if (now.getDay() === 3) {
        // Example: Cowboys vs Eagles
        const rivalryStats = await db
          .collection("rivalries")
          .doc("cowboys_eagles_week")
          .get();

        if (rivalryStats.exists) {
          const { cowboysWins, eaglesWins } = rivalryStats.data();

          const rivalryMessage = `Battle of the Fanbases! 🏈\n\nCowboys fans: ${cowboysWins} wins this week\nEagles fans: ${eaglesWins} wins this week\n\nWho knows their team better? Prove it on Sunday!`;

          messages.push({
            type: "engagement",
            subtype: "team_rivalry",
            message: rivalryMessage,
          });
        }
      }

      // Save all engagement messages to queue
      for (const m of messages) {
        await db.collection("socialQueue").add({
          ...m,
          timestamp: getTimestamp(),
        });
      }

    } catch (error) {
      logError(error, { context: "engagementMessages" });
    }
  });
