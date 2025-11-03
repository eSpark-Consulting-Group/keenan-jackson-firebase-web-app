# 🧠 Square Trivia - Social Media Automation System

This document describes the **Firebase Cloud Functions** responsible for **automated social media posts**, updates, and engagement triggers for **Square Trivia**.

It explains:

- The **purpose** of each function
- **How** it works
- **Why** it’s important
- Key **data sources and triggers**

---

## 📌 Overview

Square Trivia’s social media automation system is designed to keep players engaged and the community active by **automatically posting achievements, milestones, and updates**.

These Cloud Functions integrate directly with **Firestore** data, generating posts based on **game results**, **user achievements**, and **upcoming game activity**.

They run via **scheduled Pub/Sub triggers** - meaning posts are published **automatically based on time or game state**, without manual input.

---

## ⚙️ Core Structure

All posts are implemented inside `social-posts-functions.js`, and each is imported into the main function entry file:

```js
const {
  DailyRecapPost,
  WeeklyChampionPost,
  NoFeesPost,
  SkillCelebration,
  RecordBreakerPost,
  PlatformMilestonePost,
  ReferralLeaderboard,
  TeamRivalryPost,
  MultiGameUpdatePost,
} = require("./social-posts-functions");
```

Each post function handles generating and publishing a social post across integrated platforms (Facebook, Instagram, Twitter/X, Telegram).

---

## 🗓️ Scheduled Post Functions

### 1. **Daily Recap Trigger**

**File:** `dailyRecapTrigger`  
**Schedule:** Every day at **11:59 PM (America/Denver)**

**Purpose:**  
Summarizes the day’s total winners, total prizes awarded, fastest answer, and biggest win.

**Logic:**

- Queries the `winners` collection for all winners created today.
- Calculates total prize money, number of winners, fastest time & user, biggest single win.
- Sends a summary post via `DailyRecapPost()`.

**Why:**  
Keeps the community updated daily with key highlights and boosts user engagement.

---

### 2. **Weekly Champion Trigger**

**File:** `weeklyChampionTrigger`  
**Schedule:** Every **Sunday at 11:59 PM**

**Purpose:**  
Celebrates top players of the week (based on total winnings).

**Logic:**

- Fetches all `winners` from the last 7 days.
- Groups data by user → counts total wins and prize amounts.
- Ranks the top 3.
- Publishes a post via `WeeklyChampionPost()`.

**Why:**  
Rewards consistency, motivates repeat play, and drives user recognition.

---

### 3. **No Fees Reminder**

**File:** `noFeesTrigger`  
**Schedule:** Every **Friday at 6 PM**

**Purpose:**  
Promotes the “No Fees” policy for the weekend.

**Logic:**  
Runs `NoFeesPost()` - a simple promotional template.

**Why:**  
Encourages weekend gameplay and highlights value-driven messaging.

---

### 4. **Skill Celebration**

**File:** `skillCelebrationTrigger`  
**Schedule:** Every **3 hours**

**Purpose:**  
Spotlights players who answered in **under 1 second**.

**Logic:**

- Fetches last 20 winners.
- Finds the fastest win under 1 second.
- Posts using `SkillCelebration()`.

**Why:**  
Rewards precision and highlights player skill moments.

---

### 5. **Record Breaker**

**File:** `recordBreakerTrigger`  
**Schedule:** Every **hour**

**Purpose:**  
Announces new fastest-answer world records.

**Logic:**

- Checks lowest `answerTime` in all winners.
- Compares with stored fastest time in `system/recordTracker`.
- Posts if a new record is achieved.
- Updates Firestore tracker.

**Why:**  
Gamifies the experience by tracking records and driving competition.

---

### 6. **Platform Milestone**

**File:** `platformMilestoneTrigger`  
**Schedule:** Every **12 hours**

**Purpose:**  
Celebrates major payout milestones (e.g., $10K, $50K, $1M).

**Logic:**

- Sums all prizes in `winners`.
- Checks if the total has crossed any defined thresholds.
- If yes, posts via `PlatformMilestonePost()`.
- Updates `system/milestoneTracker`.

**Why:**  
Publicly showcases growth and trust to attract new players.

---

### 7. **Referral Leaderboard**

**File:** `referralLeaderboardTrigger`  
**Schedule:** Every **Monday at 9 AM**

**Purpose:**  
Recognizes top referrers of the week.

**Logic:**

- Fetches all users with `referrals > 0`.
- Sorts by number of referrals.
- Posts top 5 via `ReferralLeaderboard()`.

**Why:**  
Boosts word-of-mouth marketing and player acquisition.

---

### 8. **Team Rivalry Post**

**File:** `teamRivalryTrigger`  
**Schedule:** Every **Wednesday at 11 AM**

**Purpose:**  
Creates a mid-week rivalry post between two popular teams.

**Logic:**

- Selects a random rivalry pair.
- Counts wins for each team over the past week.
- Posts comparison via `TeamRivalryPost()`.

**Why:**  
Adds sports-style rivalry drama and mid-week engagement.

---

### 9. **Multi-Game Update**

**File:** `multiGameUpdateTrigger`  
**Schedule:** Daily at **11:50 PM**

**Purpose:**  
Previews next-day games when multiple games are scheduled.

**Logic:**

- Fetches `games` scheduled for tomorrow.
- If 2+ games found → posts via `MultiGameUpdatePost()`.

**Why:**  
Builds anticipation and helps users plan upcoming gameplay.

---

## 🔁 Event-Based Posting Functions

### 🏆 `processWinner(winnerData)`

**Purpose:**  
Handles logic after a game quarter ends and a winner is determined.

**Steps:**

1. Calculate **prize amount** based on tier.
2. Fetch winner and loser data from `users`.
3. Fetch game info (`teams`, etc.).
4. Create a `winner` record in Firestore.
5. Update user stats (`totalWins`, `totalWinnings`).
6. Trigger **social post**.

**Why:**  
Automates public celebration for every win, builds excitement, and reinforces transparency.

---

## ⚡ Dynamic Monitoring Function

### 🧩 `checkBoardsFillingFast`

**Schedule:** Every **5 minutes**

**Purpose:**  
Monitors **board activity** to detect fast-filling, low participation, or upcoming game alerts - and trigger relevant social updates.

**Checks include:**

| Condition                     | Description               | Triggered Post              |
| ----------------------------- | ------------------------- | --------------------------- |
| 100% full                     | Board completely sold out | `BoardFullAnnouncementPost` |
| 70–99% filled                 | Fast filling board        | `BoardGoingFastPost`        |
| <20% filled, 2–3h before game | “Last chance” alert       | `LastChancePost`            |
| Game in 2–3 days              | Upcoming reminder         | `UpcomingGamePost`          |
| 1–2h before start             | Final call alert          | `FinalCallPost`             |
| Premium tiers 70–99%          | Tier status update        | `TierStatusUpdatePost`      |

**Why:**  
Keeps momentum by reminding users of open squares, last-minute chances, and full board celebrations - all automatically.

---

## 🧩 Supporting Posts

Each post type (`BoardFullAnnouncementPost`, `LastChancePost`, etc.) contains its own **caption templates**, **media assets**, and **platform publishing logic** (for Facebook, Instagram, Twitter, Telegram).

---

## 🧠 Summary of Purpose

| Function                     | Frequency   | Primary Goal              |
| ---------------------------- | ----------- | ------------------------- |
| `dailyRecapTrigger`          | Daily       | Showcase day’s winners    |
| `weeklyChampionTrigger`      | Weekly      | Highlight top players     |
| `noFeesTrigger`              | Weekly      | Promote no-fee weekend    |
| `skillCelebrationTrigger`    | Every 3h    | Celebrate skill plays     |
| `recordBreakerTrigger`       | Hourly      | Announce records          |
| `platformMilestoneTrigger`   | 12h         | Celebrate platform growth |
| `referralLeaderboardTrigger` | Weekly      | Promote referrals         |
| `teamRivalryTrigger`         | Weekly      | Mid-week team hype        |
| `multiGameUpdateTrigger`     | Daily       | Pre-game announcements    |
| `processWinner()`            | Event-based | Post individual wins      |
| `checkBoardsFillingFast`     | 5m          | Dynamic engagement posts  |

---

## 🚀 Why We Built It

- **✅ Fully Automated Engagement**
- **🏆 Real-Time Transparency**
- **📈 Growth Engine**
- **🎯 Scalability**

---

## 🧩 Tech Stack

- **Firebase Cloud Functions**
- **Firestore**
- **Node.js + Admin SDK**
- **Social APIs (Meta, X, Telegram)**
- **Timezone:** America/Denver

---

## ✅ Example Firestore Collections

| Collection      | Purpose                   |
| --------------- | ------------------------- |
| `games`         | Game data                 |
| `boards`        | Board/tier progress       |
| `winners`       | Winner records            |
| `users`         | Player profiles           |
| `system`        | Global trackers           |
| `fastFillPosts` | Prevents duplicate alerts |

---

## 🧭 Future Improvements

- 🎨 Add **image/video generation**
- 📢 Expand to **TikTok & Shorts**
- 🧮 Add **AI summary generator**
- 🕓 Move to **event-driven posting**

---

**Author:** Square Trivia DevOps Team  
**Maintained By:** Head Developer - Social & Engagement Automation  
**Last Updated:** October 2025
