import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Trophy,
  StepBack,
} from "lucide-react";
import {
  db,
  collections,
  TIERS,
  formatCurrency,
  callFunction,
  functions,
} from "../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import UpdateScoreModal from "../../components/game/update-score-modal";

export default function AdminGames() {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedGame, setSelectedGame] = useState(null);
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [searchedGames, setSearchedGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [createGameLoading, setCreateGameLoading] = useState(false);
  const [openUpdateScoreModal, setOpenUpdateScoreModal] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Form state for creating new game
  const [gameForm, setGameForm] = useState({
    sport: "",
    homeTeam: "",
    awayTeam: "",
    startTime: "",
    apiGameId: "",
    selectedTiers: [],
    gameType: "",
    week: "",
  });

  const [sportsForm, setSportsForm] = useState({
    sport: "",
    week: "",
    teamName: "",
    gameType: "regular",
  });

  useEffect(() => {
    loadGames();
  }, [filterStatus]);

  const loadGames = async () => {
    try {
      setLoading(true);

      // 1. Fetch games
      let q = query(
        collection(db, collections.games),
        orderBy("gameDate", "desc"),
        limit(50)
      );

      if (filterStatus !== "all") {
        q = query(
          collection(db, collections.games),
          where("status", "==", filterStatus),
          orderBy("gameDate", "desc"),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const gamesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Fetch ALL boards at once for these games
      const gameIds = gamesData.map((g) => g.id);
      if (gameIds.length > 0) {
        const boardsQ = query(
          collection(db, collections.boards),
          where("gameId", "in", gameIds) // get all in one go
        );
        const boardsSnap = await getDocs(boardsQ);

        // 3. Group boards by game + board
        const boardCountsMap = {};
        boardsSnap.forEach((bdoc) => {
          const { gameId, tierId } = bdoc.data();
          if (!boardCountsMap[gameId]) boardCountsMap[gameId] = {};
          boardCountsMap[gameId][tierId] =
            (boardCountsMap[gameId][tierId] || 0) + 1;
        });

        // 4. Attach board counts
        gamesData.forEach((game) => {
          game.boardCounts = boardCountsMap[game.id] || {};
        });
      }
      setGames(gamesData);
    } catch (error) {
      console.error("Error loading games:", error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const createGame = async (e) => {
    e.preventDefault();

    if (gameForm.selectedTiers.length === 0) {
      toast.error("Please select at least one board");
      return;
    }

    try {
      setCreateGameLoading(true);

      const result = await callFunction("createGame", {
        sport: gameForm.sport,
        teams: {
          home: gameForm.homeTeam,
          away: gameForm.awayTeam,
        },
        // homeTeam: gameForm.homeTeam,
        // awayTeam: gameForm.awayTeam,
        gameDate: new Date(gameForm.startTime).toISOString(),
        externalGameId: gameForm.apiGameId,
        enabledTiers: gameForm.selectedTiers,
        gameType: gameForm.gameType,
        week: gameForm?.week,
      });

      if (result.success) {
        toast.success("Game created successfully!");
        setShowCreateModal(false);
        setGameForm({
          sport: "NFL",
          homeTeam: "",
          awayTeam: "",
          startTime: "",
          apiGameId: "",
          selectedTiers: [],
          week: "",
        });
        setTimeout(() => loadGames(), 500);
      } else {
        toast.error(result.error || "Failed to create game");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setCreateGameLoading(false);
    }
  };

  const updateGameStatus = async (gameId, newStatus) => {
    try {
      await updateDoc(doc(db, collections.games, gameId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      toast.success(`Game status updated to ${newStatus}`);
      loadGames();
    } catch (error) {
      console.error("Error updating game status:", error);
      toast.error("Failed to update game status");
    }
  };

  const updateScore = async (gameId, score) => {
    setScoreLoading(true);
    try {
      const markQuarterWinners = httpsCallable(functions, "markQuarterWinners");

      const result = await markQuarterWinners({
        gameId,
        quarter: score.quarter,
        homeScore: Number(score.homeScore),
        awayScore: Number(score.awayScore),
      });
      setOpenUpdateScoreModal(null);
      setScoreLoading(false);
      // await updateDoc(doc(db, collections.games, gameId), {
      //   currentScore: {
      //     home: parseInt(homeScore),
      //     away: parseInt(awayScore),
      //   },
      //   lastScoreUpdate: new Date(),
      // });

      toast.success("Score updated successfully");
      loadGames();
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    }
  };

  const deleteGame = async (gameId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this game? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, collections.games, gameId));
      toast.success("Game deleted successfully");
      loadGames();
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Failed to delete game");
    }
  };

  const filteredGames = games.filter((game) => {
    const matchesSearch =
      searchTerm === "" ||
      game?.teams?.home?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game?.teams?.away?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { color: "bg-blue-100 text-blue-800", icon: Clock },
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      completed: { color: "bg-gray-100 text-gray-800", icon: Trophy },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const badge = badges[status] || badges.scheduled;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status === "scheduled" ? "upcoming" : status}
      </span>
    );
  };

  useEffect(() => {
    if (selectedGame && Object.keys(selectedGame)?.length > 0) {
      console.log(selectedGame);
      setGameForm({
        ...gameForm,
        sport: selectedGame?.sport,
        homeTeam: selectedGame?.homeTeam,
        awayTeam: selectedGame?.awayTeam,
        startTime: selectedGame?.startTime,
        apiGameId: selectedGame?.apiGameId,
        gameType: selectedGame?.gameType,
        week: selectedGame?.week,
      });
    }
  }, [selectedGame]);

  useEffect(() => {
    if (!sportsForm?.sport) return;

    const searchGames = async () => {
      setGamesLoading(true);
      try {
        const searchApiSportsGames = httpsCallable(
          functions,
          "searchApiSportsGames"
        );

        const getMinWeek = (sport) => {
          if (sport === "NFL") return 1;
          if (sport === "CFB") return 1;
          return 0;
        };

        // Only add week when gameType is "regular"
        const payload = {
          sport: sportsForm.sport,
          teamName: sportsForm?.teamName,
          gameType: sportsForm?.gameType, // include gameType
          ...(sportsForm?.gameType === "regular" && {
            week: sportsForm?.week
              ? sportsForm?.week
              : getMinWeek(sportsForm?.sport),
          }),
        };

        const result = await searchApiSportsGames(payload);

        const data = result.data?.games?.map((game) => ({
          sport: sportsForm?.sport,
          homeTeam: game?.homeTeam,
          awayTeam: game?.awayTeam,
          startTime: game?.startTime,
          apiGameId: game?.apiSportsId,
          gameType: sportsForm?.gameType,
          week: game?.week,
        }));

        setSearchedGames(data);
      } catch (error) {
        console.error("Error calling searchApiSportsGames:", error);
      } finally {
        setGamesLoading(false);
      }
    };

    searchGames();
  }, [
    sportsForm.teamName,
    sportsForm.sport,
    sportsForm.week,
    sportsForm.gameType,
  ]);

  useEffect(() => {
    if (!gameForm?.gameType) return;

    let invalidTiers = [];

    if (gameForm.gameType === "regular") {
      invalidTiers = ["tier_250", "tier_500", "tier_1000"];
    } else if (gameForm.gameType === "playoff") {
      invalidTiers = ["tier_1000"];
    }

    setGameForm((prev) => ({
      ...prev,
      selectedTiers: prev.selectedTiers.filter(
        (tierId) => !invalidTiers.includes(tierId)
      ),
    }));
  }, [gameForm?.gameType]);

  useEffect(() => {
    console.log(sportsForm);
  }, [sportsForm]);

  if ((loading && games.length === 0) || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Games Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage Square Trivia games
            </p>
          </div>
          <button
            // onClick={() => setShowCreateModal(true)}
            onClick={() => setShowFetchModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Game
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              title="search by team name"
              type="text"
              placeholder="Search by team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={loadGames}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Games Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boards
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                    <tr key={game.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {game?.teams?.away || "TBA"} @
                            {game?.teams?.home || "TBA"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {game.sport}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {game.gameDate?.toDate?.().toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {game.gameDate?.toDate?.().toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(game.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-medium">
                            {game?.scores?.away || 0}
                          </span>
                          <span className="mx-1">-</span>
                          <span className="font-medium">
                            {game?.scores?.home || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(game.boardCounts || {}).map(
                            ([tierId, count]) => {
                              if (count === 0) return null;
                              const tier = TIERS[tierId.toUpperCase()];
                              return (
                                <span
                                  key={tierId}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${tier?.color || "bg-gray-600"}`}
                                >
                                  {count}
                                </span>
                              );
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {game.status === "active" && (
                            <button
                              onClick={() => setOpenUpdateScoreModal(game.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Update Score"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}

                          {game.status === "scheduled" && (
                            <button
                              onClick={() =>
                                updateGameStatus(game.id, "active")
                              }
                              className="text-green-600 hover:text-green-900"
                              title="Start Game"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {game.status === "active" && (
                            <button
                              onClick={() =>
                                updateGameStatus(game.id, "completed")
                              }
                              className="text-gray-600 hover:text-gray-900"
                              title="Complete Game"
                            >
                              <Trophy className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteGame(game.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Game"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No games found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Game Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Create New Game</h2>
                {selectedGame && Object.keys(selectedGame)?.length > 0 && (
                  <div
                    className="flex gap-x-2 items-center mb-2 w-fit cursor-pointer"
                    onClick={() => {
                      setGameForm({
                        ...gameForm,
                        sport: "",
                        homeTeam: "",
                        awayTeam: "",
                        startTime: "",
                        apiGameId: "",
                        selectedTiers: [],
                        gameType: "",
                        week: "",
                      });
                      setShowCreateModal(false);
                      setShowFetchModal(true);
                    }}
                  >
                    <StepBack />
                    <p className="text-sm font-medium">Go Back</p>
                  </div>
                )}

                <form onSubmit={createGame}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sport
                      </label>
                      <select
                        value={gameForm.sport}
                        onChange={(e) =>
                          setGameForm({ ...gameForm, sport: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled
                      >
                        <option value="" disabled>
                          Please select sport
                        </option>
                        <option value="NFL">NFL</option>
                        <option value="NBA">NBA</option>
                        <option value="CFB">NCAA Football</option>
                        <option value="NCAA_BB">NCAA Basketball</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Away Team
                        </label>
                        <input
                          title="Enter away team name"
                          type="text"
                          value={gameForm.awayTeam}
                          onChange={(e) =>
                            setGameForm({
                              ...gameForm,
                              awayTeam: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Home Team
                        </label>
                        <input
                          title="Enter home team name"
                          type="text"
                          value={gameForm.homeTeam}
                          onChange={(e) =>
                            setGameForm({
                              ...gameForm,
                              homeTeam: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Game Type
                      </label>
                      <select
                        value={gameForm.gameType}
                        onChange={(e) =>
                          setGameForm({ ...gameForm, gameType: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled
                      >
                        <option value="regular">Regular</option>
                        <option value="playoff">Playoff</option>
                        <option value="championship">Championship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        title="Select game start time"
                        type="datetime-local"
                        value={
                          gameForm.startTime
                            ? new Date(gameForm.startTime)
                                .toISOString()
                                .slice(0, 16) // "2021-09-12T23:30"
                            : ""
                        }
                        onChange={(e) =>
                          setGameForm({
                            ...gameForm,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Game ID (optional)
                      </label>
                      <input
                        title="Enter external API game ID"
                        type="text"
                        value={gameForm.apiGameId}
                        onChange={(e) =>
                          setGameForm({
                            ...gameForm,
                            apiGameId: e.target.value,
                          })
                        }
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="For automatic score updates"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Boards
                      </label>
                      <div className="space-y-2">
                        {Object.values(TIERS).map((tier) => (
                          <label key={tier.id} className="flex items-center">
                            <input
                              title="Select board tier"
                              type="checkbox"
                              value={tier.id}
                              checked={gameForm.selectedTiers.includes(tier.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGameForm({
                                    ...gameForm,
                                    selectedTiers: [
                                      ...gameForm.selectedTiers,
                                      tier.id,
                                    ],
                                  });
                                } else {
                                  setGameForm({
                                    ...gameForm,
                                    selectedTiers:
                                      gameForm.selectedTiers.filter(
                                        (t) => t !== tier.id
                                      ),
                                  });
                                }
                              }}
                              disabled={
                                (gameForm?.gameType === "regular" &&
                                  tier?.id === "tier_250") ||
                                (gameForm?.gameType === "regular" &&
                                  tier?.id === "tier_500") ||
                                ((gameForm?.gameType === "regular" ||
                                  gameForm?.gameType === "playoff") &&
                                  tier?.id === "tier_1000")
                              }
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium text-white ${tier.color}`}
                            >
                              {tier.name} -{" "}
                              {formatCurrency(tier.prizePerQuarter)}/quarter
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowFetchModal(false);
                        setSportsForm({
                          sport: "",
                          startTime: "",
                          teamName: "",
                          week: "",
                          gameType: "regular",
                        });
                        setGameForm({
                          sport: "",
                          homeTeam: "",
                          awayTeam: "",
                          startTime: "",
                          apiGameId: "",
                          selectedTiers: [],
                          gameType: "",
                          week: "",
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createGameLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 hover:text-white"
                    >
                      {createGameLoading ? "Creating..." : "Create Game"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
        {showFetchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Search Games</h2>

                <form onSubmit={() => {}}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sport
                      </label>
                      <select
                        value={sportsForm.sport}
                        onChange={(e) =>
                          setSportsForm({
                            ...sportsForm,
                            sport: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="" disabled>
                          Please select sport
                        </option>
                        <option value="NFL">NFL</option>
                        {/* <option value="NBA">NBA</option> */}
                        <option value="CFB">NCAA Football</option>
                        {/* <option value="NCAA_BB">NCAA Basketball</option> */}
                      </select>
                    </div>

                    <div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Team
                        </label>
                        <input
                          title="Enter team name"
                          type="text"
                          value={sportsForm.teamName}
                          onChange={(e) =>
                            setSportsForm({
                              ...sportsForm,
                              teamName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    {sportsForm?.gameType === "regular" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Week Number
                        </label>
                        <input
                          title="Enter week number"
                          type="number"
                          value={sportsForm.week || ""}
                          disabled={
                            sportsForm?.sport !== "NFL" &&
                            sportsForm?.sport !== "CFB"
                          }
                          onChange={(e) => {
                            let value = parseInt(e.target.value, 10);

                            if (sportsForm?.sport === "NFL") {
                              if (value < 1) value = 1;
                              if (value > 17) value = 17;
                            } else if (sportsForm?.sport === "CFB") {
                              if (value < 0) value = 0;
                              if (value > 15) value = 15;
                            }

                            setSportsForm({
                              ...sportsForm,
                              week: value,
                            });
                          }}
                          min={
                            sportsForm?.sport === "NFL"
                              ? 1
                              : sportsForm?.sport === "CFB"
                                ? 0
                                : undefined
                          }
                          max={
                            sportsForm?.sport === "NFL"
                              ? 17
                              : sportsForm?.sport === "CFB"
                                ? 15
                                : undefined
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                          defaultValue={
                            sportsForm?.sport === "NFL"
                              ? 1
                              : sportsForm?.sport === "CFB"
                                ? 0
                                : undefined
                          }
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Game Type
                      </label>
                      <select
                        value={sportsForm?.gameType}
                        onChange={(e) =>
                          setSportsForm({
                            ...sportsForm,
                            gameType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="regular">Regular</option>
                        <option value="playoff">Playoff</option>
                        <option value="championship">Championship</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-y-2 mt-5 flex-col">
                    <h3 className="text-xl font-bold mb-6">Games Results</h3>
                    <div className="max-h-[300px] overflow-auto p-2 space-y-2">
                      {sportsForm?.sport === "" ? (
                        <h3 className="text-xl font-medium text-center text-gray-600">
                          Select sports
                        </h3>
                      ) : gamesLoading ? (
                        // Loader
                        <div className="w-full">
                          <div className="h-2 bg-gray-200 rounded overflow-hidden">
                            <div className="h-full bg-blue-500 animate-pulse w-1/2"></div>
                          </div>
                          <p className="text-center text-gray-500 text-sm mt-2">
                            Loading games...
                          </p>
                        </div>
                      ) : !searchedGames || searchedGames.length === 0 ? (
                        <h3 className="text-xl font-medium text-center text-gray-600">
                          No games available
                        </h3>
                      ) : (
                        <>
                          <h3 className="text-xl font-medium text-gray-600">
                            Select Any Game
                          </h3>
                          {searchedGames.map((game, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white shadow-md rounded-xl px-4 py-2 cursor-pointer hover:bg-gray-50 transition"
                              onClick={() => {
                                setSelectedGame(game);
                                setShowFetchModal(false);
                                setShowCreateModal(true);
                              }}
                            >
                              {/* Teams */}
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-800">
                                  {game.homeTeam}
                                </span>
                                <span className="text-sm text-gray-500">
                                  VS
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {game.awayTeam}
                                </span>
                              </div>

                              {/* Time */}
                              <span className="text-sm text-gray-600">
                                {game.startTime}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFetchModal(false);
                        setSportsForm({
                          sport: "",
                          teamName: "",
                          startTime: "",
                          week: "",
                          gameType: "regular",
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <UpdateScoreModal
        open={openUpdateScoreModal}
        onClose={() => setOpenUpdateScoreModal(null)}
        onSuccess={updateScore}
        loading={scoreLoading}
      />
    </div>
  );
}
