import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Grid3X3,
  Calendar,
  Clock,
  ChevronRight,
  Search,
  AlertCircle,
  Shield,
  Plus,
  Lock,
  Check,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext";
import { db, collections, TIERS, formatCurrency } from "../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import toast from "react-hot-toast";
import EligibilityGate from "../components/eligibility-gate";

export default function Games() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupedGames, setGroupedGames] = useState({});
  const [userTierAccess, setUserTierAccess] = useState([]);
  useEffect(() => {
    loadGames();
    const unsubscribe = setupRealtimeListeners();
    return () => unsubscribe?.();
  }, [userData]);

  useEffect(() => {
    console.log(userData);
    if (!userData?.id) return;

    const loadPlayedTiers = async () => {
      try {
        // 1. Get all boards
        const boardsSnap = await getDocs(collection(db, "boards"));

        // 2. Extract boards where this user has played
        const playedTiers = new Set();

        boardsSnap.forEach((boardDoc) => {
          const boardData = { id: boardDoc.id, ...boardDoc.data() };

          const squares = boardData.squares || {};

          // loop through each square
          Object.values(squares).forEach((square) => {
            const claims = square.claims || [];

            claims.forEach((claim) => {
              if (claim.userId === userData.id) {
                if (boardData?.id) {
                  playedTiers.add(boardData?.id);
                }
              }
            });
          });
        });

        setUserTierAccess(Array.from(playedTiers));
      } catch (err) {
        console.error("Error loading played boards:", err);
      }
    };

    loadPlayedTiers();
  }, [userData]);

  useEffect(() => {
    console.log(userTierAccess, "TIER ACCESS");
  }, [userTierAccess]);

  const loadGames = async () => {
    try {
      setLoading(true);

      // 1. Fetch all games
      const gamesQuery = query(
        collection(db, collections.games),
        where("status", "in", ["scheduled", "active"]),
        orderBy("gameDate", "asc")
      );

      const gamesSnapshot = await getDocs(gamesQuery);
      const gamesData = gamesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Fetch all boards for these games in one go
      const gameIds = gamesData.map((g) => g.id);
      let boardsSnap = [];
      if (gameIds.length > 0) {
        const boardsQuery = query(
          collection(db, collections.boards),
          where("gameId", "in", gameIds),
          where("isActive", "==", true)
        );
        boardsSnap = await getDocs(boardsQuery);
      }

      // 3. Group boards by game
      const boardsMap = {};
      boardsSnap.forEach((boardDoc) => {
        const boardData = { id: boardDoc.id, ...boardDoc.data() };

        // Count filled squares
        const filledSquares = Object.values(boardData.squares || {}).filter(
          (square) => square.claims && square.claims.length > 0
        ).length;

        boardData.filledSquares = filledSquares;
        boardData.totalSquares = 50;
        boardData.fillPercentage = (filledSquares / 50) * 100;

        if (!boardsMap[boardData.gameId]) boardsMap[boardData.gameId] = [];
        boardsMap[boardData.gameId].push(boardData);
      });

      // 4. Attach boards to games
      gamesData.forEach((game) => {
        game.boards = boardsMap[game.id] || [];
      });

      setGames(gamesData);

      // 5. Group games by date
      const grouped = gamesData.reduce((acc, game) => {
        const date = new Date(game.gameDate?.toDate?.() || game.gameDate);
        const dateKey = date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(game);

        return acc;
      }, {});

      setGroupedGames(grouped);
    } catch (error) {
      console.error("Error loading games:", error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for game updates
    const gamesQuery = query(
      collection(db, collections.games),
      where("status", "in", ["scheduled", "active"])
    );

    return onSnapshot(gamesQuery, (snapshot) => {
      loadGames(); // Reload when games change
    });
  };

  const filteredGames = () => {
    let filtered = games;

    // Filter by sport
    if (selectedSport !== "all") {
      filtered = filtered.filter((game) => game.sport === selectedSport);
    }

    // Filter by boards
    if (selectedTier !== "all") {
      filtered = filtered.filter((game) =>
        game.boards.some((board) => board.tierId === selectedTier)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((game) => {
        const searchLower = searchTerm?.toLowerCase();
        return (
          game.teams?.home?.toLowerCase().includes(searchLower) ||
          game?.teams?.away?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const getTimeUntilGame = (gameDate) => {
    const now = new Date();
    const gameTime = gameDate?.toDate ? gameDate.toDate() : new Date(gameDate);
    const diff = gameTime - now;

    if (diff < 0) return "In progress";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 48) {
      const days = Math.floor(hours / 24);
      return `${days} days`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const sports = [
    { value: "all", label: "All Sports" },
    { value: "NFL", label: "NFL" },
    // { value: "NBA", label: "NBA" },
    { value: "CFB", label: "College Football" },
    // { value: "NCAAB", label: "College Basketball" },
  ];

  if (loading && Object.keys(groupedGames)?.length === 0) {
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Available Games
            </h1>
            {(!userData?.currentTiers ||
              userData.currentTiers.length === 0) && (
              <button
                onClick={() => navigate("/tiers")}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Choose a Board
              </button>
            )}
          </div>

          <p className="text-gray-600">
            Browse upcoming games and claim your squares
          </p>
        </motion.div>

        {/* User's Active Boards */}
        {userData?.currentTiers && userData.currentTiers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Your Active Boards
            </h3>
            <div className="flex flex-wrap gap-3">
              {userData.currentTiers.map((tierId) => {
                const tier = TIERS[tierId.toUpperCase()];
                return tier ? (
                  <div
                    key={tierId}
                    className={`px-4 py-2 rounded-lg text-white ${tier.color}`}
                  >
                    <div className="font-semibold">{tier.name}</div>
                    <div className="text-sm opacity-90">
                      Win {formatCurrency(tier.prizePerQuarter)}/quarter
                    </div>
                  </div>
                ) : null;
              })}
              <button
                onClick={() => navigate("/tiers")}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sport filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {sports.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Board filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Boards</option>
                {Object.values(TIERS).map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Teams
              </label>
              <div className="relative">
                <input
                  title="search teams"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search teams..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </motion.div>
        {/* Games List */}
        {Object.keys(groupedGames).length > 0 ? (
          Object.entries(groupedGames).map(([date, dateGames]) => {
            const filteredDateGames = dateGames.filter((game) =>
              filteredGames().includes(game)
            );

            if (filteredDateGames.length === 0) return null;

            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {date}
                </h2>

                <EligibilityGate>
                  <div className="grid gap-4">
                    {filteredDateGames.map((game) => {
                      return (
                        <motion.div
                          key={game.id}
                          whileHover={{ scale: 1.01 }}
                          className="bg-white rounded-lg shadow-md overflow-hidden"
                        >
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                              {/* Game Info */}
                              <div className="mb-4 lg:mb-0">
                                <div className="flex items-center mb-2">
                                  <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full mr-3">
                                    {game.sport}
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {getTimeUntilGame(game.gameDate)}
                                  </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                  {game?.teams?.away || "TBA"} @{" "}
                                  {game.teams?.home || "TBA"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    game.gameDate?.toDate?.() || game.gameDate
                                  ).toLocaleString()}
                                </p>
                              </div>

                              {/* Boards */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {game.boards.map((board) => {
                                  const tier =
                                    TIERS[board.tierId.toUpperCase()];
                                  const isUserTier =
                                    userData?.currentTiers?.includes(
                                      board.tierId
                                    );
                                  const hasAccess = userTierAccess.includes(
                                    board.id
                                  );
                                  const quarters = ["q1", "q2", "q3", "q4"];
                                  const isComplete = quarters.every(
                                    (q) => board?.[q]?.processed === true
                                  );
                                  return (
                                    <div
                                      key={board.id}
                                      className={`
                                      relative p-4 rounded-lg border-2 text-center
                                      ${
                                        isUserTier
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 bg-gray-50"
                                      }
                                    `}
                                    >
                                      {isUserTier && (
                                        <div className="absolute -top-2 -right-2">
                                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                            Your Board
                                          </span>
                                        </div>
                                      )}

                                      <div
                                        className={`text-sm font-semibold mb-1 ${tier.color} text-white px-2 py-1 rounded`}
                                      >
                                        {tier.name}
                                      </div>

                                      <div className="text-lg font-bold text-gray-900">
                                        {formatCurrency(tier.prizePerQuarter)}
                                      </div>
                                      <div className="text-xs text-gray-600 mb-2">
                                        per quarter
                                      </div>

                                      <div className="flex items-center justify-center text-xs text-gray-600 mb-3">
                                        <Grid3X3 className="h-4 w-4 mr-1" />
                                        <span>{board.filledSquares}/50</span>
                                      </div>

                                      {isUserTier ? (
                                        <Link
                                          to={`/game/${board.id}`}
                                          className="block w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors hover:text-white"
                                        >
                                          Play Now
                                        </Link>
                                      ) : hasAccess ? (
                                        <Link
                                          to={`/game/${board.id}?view=true`}
                                          className="block w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors hover:text-white"
                                        >
                                          View Board
                                        </Link>
                                      ) : isComplete ? (
                                        <Link
                                          to={`/game/${board.id}/results`}
                                          className="block w-full bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700 transition-colors hover:text-white"
                                        >
                                          <Check className="h-4 w-4 inline mr-1" />
                                          View Results
                                        </Link>
                                      ) : (
                                        <button
                                          disabled
                                          className="block w-full bg-gray-300 text-gray-500 py-2 px-3 rounded text-sm font-medium cursor-not-allowed"
                                        >
                                          <Lock className="h-4 w-4 inline mr-1" />
                                          Locked
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </EligibilityGate>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Games Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedSport !== "all" || selectedTier !== "all"
                ? "Try adjusting your filters"
                : "Check back soon for upcoming games"}
            </p>
            {(!userData?.currentTiers ||
              userData.currentTiers.length === 0) && (
              <button
                onClick={() => navigate("/tiers")}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:text-white"
              >
                Choose a Board to Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-lg p-8 md:p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Test Your Skills?
          </h2>
          <p className="text-xl mb-4 text-blue-100">
            Join thousands of players winning real money with their sports
            knowledge
          </p>

          {/* Taglines */}
          <div className="mb-8 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 text-blue-100 text-lg font-medium">
            <span className="italic">Speed Wins Always</span>
            <span className="italic">•</span>
            <span className="italic">Be the Fastest</span>
            <span className="italic">•</span>
            <span className="italic">Board Champion = Fastest Overall</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              Start Playing Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>

            <Link
              to="/games"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-800 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all duration-200 hover:text-white"
            >
              View Active Games
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
