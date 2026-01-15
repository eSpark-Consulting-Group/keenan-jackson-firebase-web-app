const functions = require("firebase-functions");
const axios = require("axios");
const { logger } = require("firebase-functions");
const { requireAdmin,  } = require(".");

const {API_SPORTS_CONFIG } = require("../constants");

/**
 * Search for games in API-Sports
 */
exports.searchApiSportsGames = functions.https.onCall(async (data, context) => {
  const adminId = requireAdmin(context);
  const {
    sport,
    teamName,
    week,
    gameType = "regular", // new
    year = new Date().getFullYear(),
  } = data;

  if (!sport) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Sport is required"
    );
  }

  try {
    let games = [];

    if (sport === "NFL") {
      // --- NFL via API-Sports ---
      const config = API_SPORTS_CONFIG[sport];
      const url = `https://v1.american-football.api-sports.io/games`;
      const response = await axios.get(url, {
        params: { league: config.leagueId, season: year },
        headers: { "x-apisports-key": process.env.REACT_APP_APISPORTS_KEY },
      });
      logger.info("GOT NFL GAMES: ", { data: response?.data?.response });
      games = response.data?.response || [];

      // games = DUMMY_GAMES || [];

      // ✅ handle gameType filtering
      if (gameType === "regular") {
        games = games.filter((g) => g.game.stage === "Regular Season");
      } else if (gameType === "playoff") {
        games = games.filter(
          (g) => g.game.stage === "Post Season" && g.game.week !== "Super Bowl" // exclude SB from playoffs
        );
      } else if (gameType === "championship") {
        games = games.filter(
          (g) => g.game.stage === "Post Season" && g.game.week === "Super Bowl"
        );
      }

      const now = Math.floor(Date.now() / 1000);

      const completedStatuses = ["Finished", "Final", "Match Finished"];
      games = games.filter(
        (item) =>
          item?.game?.date?.timestamp > now ||
          !completedStatuses.includes(item?.game?.status?.long)
      );
    }

    if (sport === "CFB") {
      // --- CFB via ESPN ---
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`;

      // ✅ map gameType -> ESPN seasontype
      const seasonTypeMap = {
        regular: 2, // regular season
        playoff: 3, // postseason / bowls
        championship: 4, // playoff / championship
      };

      const params = {
        year,
        seasontype: seasonTypeMap[gameType] ?? 2,
      };

      // ✅ week only for regular
      if (gameType === "regular" && week) {
        params.week = week;
      }

      const response = await axios.get(url, {
        params,
        headers: { accept: "application/json" },
      });

      const now = Math.floor(Date.now() / 1000);

      games = response.data.events
        .map((event) => {
          const competition = event.competitions[0];
          const status = competition.status.type;
          const venue = competition.venue || {};
          const home = competition.competitors.find(
            (t) => t.homeAway === "home"
          );
          const away = competition.competitors.find(
            (t) => t.homeAway === "away"
          );

          const timestamp = Math.floor(
            new Date(competition.date).getTime() / 1000
          );

          return {
            game: {
              id: event.id,
              stage: gameType, // reflect requested type
              week:
                gameType === "regular"
                  ? `Week ${response.data.week.number}`
                  : null,
              date: {
                timezone: "UTC",
                date: competition.date.split("T")[0],
                time: competition.date.split("T")[1].slice(0, 5),
                timestamp,
              },
              venue: {
                name: venue.fullName || null,
                city: venue.address?.city || null,
              },
              status: {
                short: status.state === "post" ? "FT" : status.name,
                long: status.description,
                timer: null,
              },
            },
            league: {
              id: "cfb",
              name: "College Football",
              season: String(year),
              logo: "https://a.espncdn.com/redesign/assets/img/logos/espn/college-football.png",
              country: {
                name: "USA",
                code: "US",
                flag: "https://media.api-sports.io/flags/us.svg",
              },
            },
            teams: {
              home: {
                id: home.team.id,
                name: home.team.displayName,
                logo: home.team.logo,
              },
              away: {
                id: away.team.id,
                name: away.team.displayName,
                logo: away.team.logo,
              },
            },
            scores: {
              home: {
                total: Number(home.score) || 0,
              },
              away: {
                total: Number(away.score) || 0,
              },
            },
          };
        })
        .filter(
          (g) => g.game.date.timestamp >= now || g.game.status.short !== "FT"
        );
    }

    // ✅ Week filter (apply only if regular)
    if (week && gameType === "regular") {
      games = games.filter((g) => {
        const weekStr = g.game.week;
        const weekNum = weekStr
          ? parseInt(weekStr.replace("Week", "").trim())
          : null;
        return weekNum === parseInt(week);
      });
    }

    // ✅ Team filter
    if (teamName) {
      const searchTerm = teamName.toLowerCase();
      games = games.filter(
        (game) =>
          game.teams.home?.name?.toLowerCase().includes(searchTerm) ||
          game.teams.away?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // ✅ Normalize
    const formattedGames = games.map((game) => {
      const weekStr = game.game.week || null;
      const weekNum = weekStr
        ? parseInt(weekStr.replace("Week", "").trim())
        : null;

      let startTime = null;
      if (game?.game?.date?.timestamp) {
        startTime = new Date(game.game.date.timestamp * 1000).toISOString();
      } else if (game?.game?.date?.date && game?.game?.date?.time) {
        startTime = new Date(
          `${game.game.date.date}T${game.game.date.time}:00Z`
        ).toISOString();
      }

      const homeName = game.teams.home?.name || "TBD";
      const awayName = game.teams.away?.name || "TBD";
      const homeLogo =
        game.teams.home?.logo ||
        "https://media.api-sports.io/american-football/teams/0.png";
      const awayLogo =
        game.teams.away?.logo ||
        "https://media.api-sports.io/american-football/teams/0.png";

      return {
        apiSportsId: game.game.id?.toString(),
        homeTeam: homeName || "TBD",
        awayTeam: awayName || "TBD",
        homeLogo,
        awayLogo,
        startTime,
        status: game.game.status?.long,
        venue: game.game.venue?.name || "TBA",

        // ✅ Regular = number | Playoff/Championship = string
        week: gameType === "regular" ? weekNum : weekStr,

        gameType,
        scores: {
          home: game.scores.home?.total ?? null,
          away: game.scores.away?.total ?? null,
        },
      };
    });

    console.log(`Admin ${adminId} searched ${sport} games`, {
      gameType,
      week: week || "ALL",
      total: formattedGames.length,
    });

    return {
      success: true,
      games: formattedGames,
      total: formattedGames.length,
    };
  } catch (error) {
    console.error(
      `${sport.toUpperCase()} search error:`,
      error?.response?.data || error
    );
    throw new functions.https.HttpsError(
      "internal",
      `Failed to search ${sport} games`
    );
  }
});
module.exports = {
  searchApiSportsGames: exports.searchApiSportsGames,
};