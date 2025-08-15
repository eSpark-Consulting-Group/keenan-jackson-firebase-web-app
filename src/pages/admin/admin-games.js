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
} from "lucide-react";
import {
  db,
  collections,
  TIERS,
  formatCurrency,
  callFunction,
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

export default function AdminGames() {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedGame, setSelectedGame] = useState(null);

  // Form state for creating new game
  const [gameForm, setGameForm] = useState({
    sport: "NFL",
    homeTeam: "",
    awayTeam: "",
    startTime: "",
    apiGameId: "",
    selectedTiers: [],
    gameType: "regular",
  });

  useEffect(() => {
    loadGames();
  }, [filterStatus]);

  const loadGames = async () => {
    try {
      setLoading(true);

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
      const gamesData = [];

      for (const doc of snapshot.docs) {
        const gameData = { id: doc.id, ...doc.data() };

        // Get board counts for each tier
        const boardCounts = {};
        for (const tierId of Object.keys(TIERS)) {
          const boardQuery = query(
            collection(db, collections.boards),
            where("gameId", "==", doc.id),
            where("tierId", "==", tierId.toLowerCase())
          );
          const boardSnapshot = await getDocs(boardQuery);
          boardCounts[tierId.toLowerCase()] = boardSnapshot.size;
        }

        gameData.boardCounts = boardCounts;
        gamesData.push(gameData);
      }

      setGames(gamesData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading games:", error);
      toast.error("Failed to load games");
      setLoading(false);
    }
  };

  const createGame = async (e) => {
    e.preventDefault();

    if (gameForm.selectedTiers.length === 0) {
      toast.error("Please select at least one tier");
      return;
    }

    try {
      setLoading(true);

      const result = await callFunction("createGame", {
        sport: gameForm.sport,
        teams: {
          home: gameForm.homeTeam,
          away: gameForm.awayTeam,
        },
        startTime: new Date(gameForm.startTime).toISOString(),
        apiGameId: gameForm.apiGameId,
        tiers: gameForm.selectedTiers,
        gameType: gameForm.gameType,
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
        });
        loadGames();
      } else {
        toast.error(result.error || "Failed to create game");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setLoading(false);
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

  const updateScore = async (gameId) => {
    const homeScore = prompt("Enter home team score:");
    const awayScore = prompt("Enter away team score:");

    if (homeScore === null || awayScore === null) return;

    try {
      await updateDoc(doc(db, collections.games, gameId), {
        currentScore: {
          home: parseInt(homeScore),
          away: parseInt(awayScore),
        },
        lastScoreUpdate: new Date(),
      });

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
      game?.homeTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game?.awayTeam?.toLowerCase().includes(searchTerm.toLowerCase());

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
        {status}
      </span>
    );
  };

  if (loading && games.length === 0) {
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
                            {game?.awayTeam} @ {game?.homeTeam}
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
                            {game.awayScore}
                          </span>
                          <span className="mx-1">-</span>
                          <span className="font-medium">
                            {game.homeScore}
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
                              onClick={() => updateScore(game.id)}
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
                        required
                      >
                        <option value="NFL">NFL</option>
                        <option value="NBA">NBA</option>
                        <option value="NCAA_FOOTBALL">NCAA Football</option>
                        <option value="NCAA_BASKETBALL">NCAA Basketball</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Away Team
                        </label>
                        <input
                          type="text"
                          value={gameForm.awayTeam}
                          onChange={(e) =>
                            setGameForm({
                              ...gameForm,
                              awayTeam: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Home Team
                        </label>
                        <input
                          type="text"
                          value={gameForm.homeTeam}
                          onChange={(e) =>
                            setGameForm({
                              ...gameForm,
                              homeTeam: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
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
                        required
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
                        type="datetime-local"
                        value={gameForm.startTime}
                        onChange={(e) =>
                          setGameForm({
                            ...gameForm,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Game ID (optional)
                      </label>
                      <input
                        type="text"
                        value={gameForm.apiGameId}
                        onChange={(e) =>
                          setGameForm({
                            ...gameForm,
                            apiGameId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="For automatic score updates"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Tiers
                      </label>
                      <div className="space-y-2">
                        {Object.values(TIERS).map((tier) => (
                          <label key={tier.id} className="flex items-center">
                            <input
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
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create Game"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
