import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Grid3X3,
  Trophy,
  DollarSign,
  Brain,
  ChevronRight,
  Zap,
  Clock,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext";
import { db, collections, TIERS, formatCurrency } from "../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSquares: 0,
    totalWins: 0,
    totalPrizeAmount: 0,
    averageAnswerTime: 0,
    activeTiers: [],
    recentGames: [],
    upcomingGames: [],
  });
  const [activeBoards, setActiveBoards] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [dailyAttempts, setDailyAttempts] = useState({
    used: 0,
    total: userData?.hasTelegram ? 10 : 5,
  });

  useEffect(() => {
    if (!user) return;

    loadDashboardData();

    // Set up real-time listeners
    const unsubscribeBoards = setupBoardListener();
    const unsubscribeWins = setupWinsListener();

    return () => {
      unsubscribeBoards?.();
      unsubscribeWins?.();
    };
  }, [user, userData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user statistics
      const [squares, wins] = await Promise.all([
        getDocs(
          query(
            collection(db, collections.squareClaims),
            where("userId", "==", user.uid)
          )
        ),
        getDocs(
          query(
            collection(db, collections.winners),
            where("userId", "==", user.uid)
          )
        ),
      ]);

      let totalPrizeAmount = 0;
      wins.forEach((doc) => {
        totalPrizeAmount += doc.data().prizeAmount || 0;
      });

      // Get active boards for user's tiers
      if (userData?.currentTiers?.length > 0) {
        const boardsQuery = query(
          collection(db, collections.boards),
          where("tierId", "in", userData.currentTiers),
          where("isActive", "==", true),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const boardsSnapshot = await getDocs(boardsQuery);

        const boards = [];
        for (const boardDoc of boardsSnapshot.docs) {
          const boardData = boardDoc.data();

          // Get game info
          if (boardData.gameId) {
            const gameRef = doc(db, collections.games, boardData.gameId); // now this is the firestore "doc" function
            const gameDoc = await getDoc(gameRef);

            if (gameDoc.exists()) {
              boardData.gameInfo = gameDoc.data();
            }
          }

          boards.push({
            id: boardDoc.id,
            ...boardData,
          });
        }
        setActiveBoards(boards);
      }

      setStats({
        totalSquares: squares.size,
        totalWins: wins.size,
        totalPrizeAmount,
        averageAnswerTime: userData?.averageAnswerTime || 0,
        activeTiers: userData?.currentTiers || [],
      });

      // Update daily attempts
      setDailyAttempts({
        used: userData?.dailyTriviaAttempts || 0,
        total: userData?.hasTelegram ? 10 : 5,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const setupBoardListener = () => {
    if (!userData?.currentTiers?.length) return;

    const boardsQuery = query(
      collection(db, collections.boards),
      where("tierId", "in", userData.currentTiers),
      where("isActive", "==", true)
    );

    return onSnapshot(boardsQuery, (snapshot) => {
      const boards = [];
      snapshot.forEach((doc) => {
        boards.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setActiveBoards(boards);
    });
  };

  const setupWinsListener = () => {
    const winsQuery = query(
      collection(db, collections.winners),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    return onSnapshot(winsQuery, (snapshot) => {
      const wins = [];
      snapshot.forEach((doc) => {
        wins.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setRecentWins(wins);
    });
  };

  const getSquareCount = (boardId) => {
    // In real app, this would count user's squares on specific board
    return Math.floor(Math.random() * 3) + 1;
  };

  const getTimeUntilGame = (startTime) => {
    if (!startTime) return "";

    // Convert Firestore timestamp or raw object
    const gameTime = startTime?.toDate
      ? startTime.toDate()
      : new Date(startTime.seconds * 1000 + (startTime.nanoseconds || 0) / 1e6);

    // Format as MM-DD-YYYY
    const month = String(gameTime.getMonth() + 1).padStart(2, "0");
    const day = String(gameTime.getDate()).padStart(2, "0");
    const year = gameTime.getFullYear();

    return `${month}-${day}-${year}`;
  };

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
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userData?.displayName || user?.email?.split("@")[0]}!
          </h1>
          <p className="text-gray-600 mt-2">
            Your skill-based sports competition dashboard
          </p>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Daily Trivia Attempts */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">Daily Attempts</h3>
              </div>
              {!userData?.hasTelegram && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  +5 with Telegram
                </span>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Used today</span>
                <span>
                  {dailyAttempts.used} / {dailyAttempts.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(dailyAttempts.used / dailyAttempts.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {dailyAttempts.used < dailyAttempts.total ? (
              <Link
                to="/games"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center hover:text-white hover:bg-blue-700 transition-colors"
              >
                Play Trivia
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <div className="text-center text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Resets at midnight
              </div>
            )}
          </motion.div>

          {/* Active Tiers */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold">Your Tiers</h3>
            </div>

            {stats.activeTiers.length > 0 ? (
              <div className="space-y-2">
                {stats.activeTiers.map((tierId) => {
                  const tier = TIERS[tierId.toUpperCase()];
                  return tier ? (
                    <div
                      key={tierId}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-sm text-green-600">
                        Win {formatCurrency(tier.prizePerQuarter)}/qtr
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No active tiers</p>
                <Link
                  to="/games"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Choose a tier to start playing
                </Link>
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center mb-4">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold">Your Stats</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Squares</span>
                <span className="font-semibold">{stats.totalSquares}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wins</span>
                <span className="font-semibold text-green-600">
                  {stats.totalWins}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Won</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.totalPrizeAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Speed</span>
                <span className="font-semibold">
                  {stats.averageAnswerTime.toFixed(1)}s
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Active Games
            </h2>
            <Link
              to="/games"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View all games
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {activeBoards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBoards.map((board) => (
                <motion.div
                  key={board.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                  onClick={() => (window.location.href = `/game/${board.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                          TIERS[board.tierId.toUpperCase()]?.color ||
                          "bg-gray-600"
                        }`}
                      >
                        {TIERS[board.tierId.toUpperCase()]?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getTimeUntilGame(board?.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">
                      {board.gameInfo?.teams?.away || "TBA"} @{" "}
                      {board.gameInfo?.teams?.home || "TBA"}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Grid3X3 className="h-4 w-4 mr-1" />
                        <span>{getSquareCount(board.id)} squares</span>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                        <span>
                          {formatCurrency(
                            TIERS[board.tierId.toUpperCase()]?.prizePerQuarter
                          )}
                          /qtr
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 bg-blue-50 rounded-md p-3 text-sm">
                      <div className="flex items-center text-blue-700">
                        <Zap className="h-4 w-4 mr-2" />
                        <span>Answer times hidden until squares win</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Grid3X3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Active Games
              </h3>
              <p className="text-gray-600 mb-4">
                {stats.activeTiers.length > 0
                  ? "No games available for your tiers right now"
                  : "Choose a tier to see available games"}
              </p>
              <Link
                to="/games"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:text-white"
              >
                Browse Games
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Wins */}
        {recentWins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recent Wins
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="divide-y divide-gray-200">
                {recentWins.map((win) => (
                  <div
                    key={win.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                      <div>
                        <p className="font-semibold">
                          Won {formatCurrency(win.prizeAmount)}!
                        </p>
                        <p className="text-sm text-gray-600">
                          {win.game} • Square {win.squarePosition}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {win.answerTime}s
                      </p>
                      <p className="text-xs text-gray-500">
                        {win.createdAt?.toDate?.().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Call to Action */}
        {!userData?.hasTelegram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Double Your Daily Plays!
                </h3>
                <p className="text-blue-100">
                  Add Telegram to get 10 daily trivia attempts instead of 5,
                  plus instant win notifications
                </p>
              </div>
              <Link
                to="/profile"
                className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Add Telegram
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
