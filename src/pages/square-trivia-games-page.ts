import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Grid3X3,
  Calendar,
  Clock,
  Users,
  Trophy,
  ChevronRight,
  Filter,
  Search,
  DollarSign,
  AlertCircle,
  Zap,
  TrendingUp,
  Shield,
  Plus,
  Lock,
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
import TierSelection from "../components/game/tierselection";

export default function Games() {
  const { user, userData } = useAuth();
  const [games, setGames] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTierSelection, setShowTierSelection] = useState(false);
  const [groupedGames, setGroupedGames] = useState({});

  useEffect(() => {
    loadGames();
    const unsubscribe = setupRealtimeListeners();
    return () => unsubscribe?.();
  }, [userData]);

  const loadGames = async () => {
    try {
      setLoading(true);

      // Load all active games
      const gamesQuery = query(
        collection(db, collections.games),
        where("status", "in", ["upcoming", "active"]),
        orderBy("startTime", "asc")
      );

      const gamesSnapshot = await getDocs(gamesQuery);
      const gamesData = [];

      for (const doc of gamesSnapshot.docs) {
        const gameData = { id: doc.id, ...doc.data() };

        // Load boards for this game
        const boardsQuery = query(
          collection(db, collections.boards),
          where("gameId", "==", doc.id),
          where("isActive", "==", true)
        );

        const boardsSnapshot = await getDocs(boardsQuery);
        const gameBoards = [];

        boardsSnapshot.forEach((boardDoc) => {
          const boardData = { id: boardDoc.id, ...boardDoc.data() };

          // Count filled squares
          const filledSquares = Object.values(boardData.squares || {}).filter(
            (square) => square.claims && square.claims.length > 0
          ).length;

          boardData.filledSquares = filledSquares;
          boardData.totalSquares = 50;
          boardData.fillPercentage = (filledSquares / 50) * 100;

          gameBoards.push(boardData);
        });

        gameData.boards = gameBoards;
        gamesData.push(gameData);
      }

      setGames(gamesData);

      // Group games by date
      const grouped = gamesData.reduce((acc, game) => {
        const date = new Date(game.startTime?.toDate?.() || game.startTime);
        const dateKey = date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }

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
      where("status", "in", ["upcoming", "active"])
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

    // Filter by tier
    if (selectedTier !== "all") {
      filtered = filtered.filter((game) =>
        game.boards.some((board) => board.tierId === selectedTier)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((game) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          game.teams.home.toLowerCase().includes(searchLower) ||
          game.teams.away.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const getTimeUntilGame = (startTime) => {
    const now = new Date();
    const gameTime = startTime?.toDate
      ? startTime.toDate()
      : new Date(startTime);
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

  const getUserBoardForGame = (game) => {
    // Find board that matches user's tier
    return game.boards.find((board) =>
      userData?.currentTiers?.includes(board.tierId)
    );
  };

  const sports = [
    { value: "all", label: "All Sports" },
    { value: "NFL", label: "NFL" },
    { value: "NBA", label: "NBA" },
    { value: "NCAAF", label: "College Football" },
    { value: "NCAAB", label: "College Basketball" },
  ];

  if (loading) {
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
                onClick={() => setShowTierSelection(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Choose a Tier
              </button>
            )}
          </div>

          <p className="text-gray-600">
            Browse upcoming games and claim your squares
          </p>
        </motion.div>

        {/* User's Active Tiers */}
        {userData?.currentTiers && userData.currentTiers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Your Active Tiers
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
                onClick={() => setShowTierSelection(true)}
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

            {/* Tier filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tiers</option>
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

                <div className="grid gap-4">
                  {filteredDateGames.map((game) => {
                    const userBoard = getUserBoardForGame(game);
                    const hasAccess = userBoard !== undefined;

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
                                  {getTimeUntilGame(game.startTime)}
                                </span>
                              </div>

                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {game.teams.away} @ {game.teams.home}
                              </h3>

                              <p className="text-sm text-gray-600">
                                {new Date(
                                  game.startTime?.toDate?.() || game.startTime
                                ).toLocaleString()}
                              </p>
                            </div>

                            {/* Boards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {game.boards.map((board) => {
                                const tier = TIERS[board.tierId.toUpperCase()];
                                const isUserTier =
                                  userData?.currentTiers?.includes(
                                    board.tierId
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
                                          Your Tier
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
                                        className="block w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                                      >
                                        Play Now
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
                onClick={() => setShowTierSelection(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose a Tier to Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* Tier Selection Modal */}
        {showTierSelection && (
          <TierSelection
            isOpen={showTierSelection}
            onClose={() => setShowTierSelection(false)}
            onComplete={() => {
              setShowTierSelection(false);
              loadGames();
            }}
          />
        )}
      </div>
    </div>
  );
}
