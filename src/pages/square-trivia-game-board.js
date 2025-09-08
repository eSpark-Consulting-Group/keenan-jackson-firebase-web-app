import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  Trophy,
  Timer,
  Brain,
  EyeOff,
  AlertCircle,
  Clock,
  Info,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext";
import {
  db,
  collections,
  TIERS,
  formatCurrency,
  GAME_CONFIG,
  callFunction,
} from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import TriviaModal from "../components/game/triviamodal";
import SquareGrid from "../components/game/squaregrid";
import GameScore from "../components/game/gamescore";
import toast from "react-hot-toast";

export default function GameBoard() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [winners, setWinners] = useState([]);

  const [board, setBoard] = useState(null);
  const [game, setGame] = useState(null);
  const [userSquares, setUserSquares] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [triviaToken, setTriviaToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({ home: 0, away: 0 });
  const [winningSquares, setWinningSquares] = useState([]);
  const [revealedSquares, setRevealedSquares] = useState(new Set());

  useEffect(() => {
    if (!boardId || !user) return;

    loadBoardData();
    const unsubscribe = setupRealtimeListeners();

    return () => unsubscribe?.();
  }, [boardId, user]);

  const loadBoardData = async () => {
    try {
      setLoading(true);

      // Load board data
      const boardDoc = await getDoc(doc(db, collections.boards, boardId));
      if (!boardDoc.exists()) {
        toast.error("Board not found");
        navigate("/games");
        return;
      }

      const boardData = { id: boardDoc.id, ...boardDoc.data() };
      setBoard(boardData);

      // Check if user has access to this tier
      // if (!userData?.currentTiers?.includes(boardData.tierId)) {
      //   toast.error("You need access to this tier to view this board");
      //   navigate("/games");
      //   return;
      // }

      // Load game data
      if (boardData.gameId) {
        const gameDoc = await getDoc(
          doc(db, collections.games, boardData.gameId)
        );
        if (gameDoc.exists()) {
          const gameData = { id: gameDoc.id, ...gameDoc.data() };
          console.log(gameData, "GAME DATA");
          setGame(gameData);

          // Set current scores
          if (gameData?.currentQuarter) {
            // Map quarter number or OT string to key
            const quarterMap = {
              1: "q1",
              2: "q2",
              3: "q3",
              4: "q4",
              ot: "ot",
            };

            // Resolve key from currentQuarter
            const currentKey = quarterMap[gameData.currentQuarter] || "q1";

            // Get score for that quarter (fallback to 0,0)
            const score = gameData.quarterScores?.[currentKey] || {
              home: 0,
              away: 0,
            };

            // Set scores
            setScores(score);

            // Update winning squares if needed
            updateWinningSquares(score);
          }
        }
      }

      // Load user's squares on this board
      const userSquaresData = [];
      if (boardData.squares) {
        Object.entries(boardData.squares).forEach(([position, squareData]) => {
          const userClaim = squareData.claims?.find(
            (claim) => claim.userId === user.uid
          );
          if (userClaim) {
            userSquaresData.push({
              position: parseInt(position),
              claimData: userClaim,
              isWinning: false, // Will be updated based on scores
            });
          }
        });
      }
      setUserSquares(userSquaresData);
    } catch (error) {
      console.error("Error loading board data:", error);
      toast.error("Failed to load game board");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for board updates
    const boardRef = doc(db, collections.boards, boardId);
    const unsubscribeBoard = onSnapshot(boardRef, (doc) => {
      if (doc.exists()) {
        setBoard({ id: doc.id, ...doc.data() });
      }
    });

    // Listen for game updates if we have a game ID
    let unsubscribeGame;
    if (board?.gameId) {
      const gameRef = doc(db, collections.games, board.gameId);
      unsubscribeGame = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
          const gameData = { id: doc.id, ...doc.data() };
          const order = ["q1", "q2", "q3", "q4", "ot"];
          const latest = order.filter((q) => game?.processedQuarters[q]).pop();
          setGame(gameData);

          // Update scores and winning squares
          if (gameData.quarterScores[latest]) {
            // console.log("REAL TIME CALLED");
            setScores(gameData.quarterScores[latest]);
            updateWinningSquares(gameData.quarterScores[latest]);
          }
        }
      });
    }

    return () => {
      unsubscribeBoard();
      unsubscribeGame?.();
    };
  };

  const updateWinningSquares = (currentScores) => {
    const homeLastDigit = (currentScores.home || 0) % 10;
    const awayLastDigit = (currentScores.away || 0) % 10;
    // console.log(homeLastDigit, "HOME");
    // console.log(awayLastDigit, "AWAY");

    const winningPositions = [];

    // Orientation 1: raw digits
    const pos1 = getPositionFromDigits(awayLastDigit, homeLastDigit, true);
    if (pos1 !== null) winningPositions.push(pos1);

    // Orientation 2: mirrored raw digits
    if (homeLastDigit !== awayLastDigit) {
      const pos2 = getPositionFromDigits(homeLastDigit, awayLastDigit, true);
      if (pos2 !== null) winningPositions.push(pos2);
    }
    // console.log(winningPositions);

    setWinningSquares(winningPositions);
  };

  const getPositionFromDigits = (rowDigit, colDigit, useRaw = false) => {
    const rowMap = {
      0: 0,
      5: 0,
      1: 1,
      6: 1,
      2: 2,
      7: 2,
      3: 3,
      8: 3,
      4: 4,
      9: 4,
    };

    const row = useRaw ? rowDigit : rowMap[rowDigit];
    const col = colDigit;

    if (row === undefined || col === undefined) return null;

    return row * 10 + col;
  };

  const handleSquareClick = async (position) => {
    if (!board || !userData) return;

    const squareData = board.squares?.[position];

    // Check if square is full
    if (squareData?.claims?.length >= 2) {
      toast.error("This square is full");
      return;
    }

    // Check if user already has this square
    if (squareData?.claims?.some((claim) => claim.userId === user.uid)) {
      toast.error("You already have this square");
      return;
    }

    // Check if user has reached max squares
    const userSquareCount = Object.values(board.squares || {}).filter((sq) =>
      sq.claims?.some((claim) => claim.userId === user.uid)
    ).length;

    if (userSquareCount >= GAME_CONFIG.MAX_SQUARES_PER_USER) {
      toast.error(
        `You can only have ${GAME_CONFIG.MAX_SQUARES_PER_USER} squares per board`
      );
      return;
    }

    // Check if user has daily attempts left
    if (userData.dailyTriviaAttempts <= 0) {
      toast.error("No daily attempts left. Come back tomorrow!");
      return;
    }

    // Set selected square and show trivia modal
    setSelectedSquare(position);
    setShowTriviaModal(true);
  };

  const handleTriviaComplete = async (success, answerTime, token) => {
    if (!success || !token) {
      setSelectedSquare(null);
      return;
    }

    // Store the token for square claim
    setTriviaToken(token);

    try {
      // Call cloud function to claim square
      const result = await callFunction("claimSquare", {
        boardId: board.id,
        squarePosition: selectedSquare,
        tokenId: token,
        answerTime,
      });

      if (result.success) {
        toast.success(
          `Square ${selectedSquare} claimed! Answer time: ${answerTime}s`
        );
        setShowTriviaModal(false);
        setSelectedSquare(null);

        // Reload board data to show updated square
        await loadBoardData();
      } else {
        setShowTriviaModal(false);
        setSelectedSquare(null);
        toast.error(result.error || "Failed to claim square");
      }
    } catch (error) {
      setShowTriviaModal(false);
      setSelectedSquare(null);
      console.error("Error claiming square:", error);
      toast.error("Failed to claim square");
    } finally {
      setSelectedSquare(null);
      setTriviaToken(null);
    }
  };

  const handleRevealSquare = (position) => {
    // Toggle reveal state for winning squares
    if (winningSquares.includes(position)) {
      setRevealedSquares((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(position)) {
          newSet.delete(position);
        } else {
          newSet.add(position);
        }
        return newSet;
      });
    }
  };

  const total = userData.hasTelegram ? 10 : 5;
  const remaining = Math.min(Math.max(userData.dailyTriviaAttempts, 0), total);
  const percentRemaining = total === 0 ? 0 : (remaining / total) * 100;

  useEffect(() => {
    if (!boardId) return;

    // Query winners by boardId
    const q = query(collection(db, "winners"), where("boardId", "==", boardId));

    // Real-time listener
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tempWinners = [];

      for (const docSnap of snapshot.docs) {
        const winnerData = docSnap.data();
        const userId = winnerData.userId;

        // fetch user details
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        let displayName;
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.displayName) {
            displayName = userData.displayName;
          } else if (userData.email) {
            displayName = `User ${userData.email}`;
          } else {
            displayName = "Unknown User";
          }
        } else {
          displayName = "Unknown User";
        }

        tempWinners.push({
          id: docSnap.id,
          ...winnerData,
          displayName,
        });
      }

      // setWinners(tempWinners);
    });

    // cleanup on unmount
    return () => unsubscribe();
  }, [boardId]);

  useEffect(() => {
    console.log(winners);
  }, [winners]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!board || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Board Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            This game board doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/games")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors hover:text-white"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const tier = TIERS[board.tierId.toUpperCase()];
  const isGameActive = game.status === "active" || game.status === "scheduled";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {game?.teams.away || "TBA"} @ {game?.teams?.home || "TBA"}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span
                  className={`px-3 py-1 rounded-full font-medium text-white ${tier.color}`}
                >
                  {tier.name}
                </span>
                <span className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                  {formatCurrency(tier.prizePerQuarter)} per quarter
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(
                    game.gameDate?.toDate?.() || game.gameDate
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {isGameActive && (
              <GameScore
                homeTeam={game?.teams?.home || "TBA"}
                awayTeam={game?.teams?.away || "TBA"}
                homeScore={scores.home}
                awayScore={scores.away}
                quarter={game.currentQuarter || 1}
                timeRemaining={game.timeRemaining}
              />
            )}
          </div>

          {/* Info Banner */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How to Win:</p>
                <p>
                  When the score's last digits match your square, the player
                  with the fastest trivia answer time wins! Answer times are
                  hidden until squares win to ensure fair competition.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Square Grid - Takes up 2 columns on large screens */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <SquareGrid
              game={game}
              board={board}
              currentUserId={user.uid}
              onSquareClick={handleSquareClick}
              winningSquares={winningSquares}
              revealedSquares={revealedSquares}
              onRevealSquare={handleRevealSquare}
              allowSelection={isGameActive && userData.dailyTriviaAttempts > 0}
            />
          </motion.div>

          {/* Side Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                Board Winners
              </h3>

              {winners && winners.length > 0 ? (
                <ul className="space-y-3">
                  {winners.map((win) => {
                    const formattedPosition =
                      win.position?.toString().split("").join("-") || "";

                    return (
                      <li
                        key={win.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium text-gray-800 text-lg">
                            {formattedPosition && (
                              <span className="mr-2 text-indigo-600 font-semibold">
                                {formattedPosition}
                              </span>
                            )}
                            {win.displayName}
                          </p>
                          <p className="text-sm text-gray-500">{win.email}</p>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {win.isFastest ? (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                              🏆 Board Winner
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                              Quarter {win.quarter}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500">No winners yet.</p>
              )}
            </div>

            {/* Your Squares */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Grid3X3 className="h-5 w-5 mr-2 text-blue-600" />
                Your Squares ({userSquares.length})
              </h3>

              {userSquares.length > 0 ? (
                <div className="space-y-3">
                  {userSquares.map((square) => {
                    const isWinning = winningSquares.includes(square.position);
                    const isRevealed = revealedSquares.has(square.position);

                    return (
                      <div
                        key={square.position}
                        className={`
                          p-3 rounded-lg border-2 transition-all cursor-pointer
                          ${
                            isWinning
                              ? "border-yellow-400 bg-yellow-50"
                              : "border-gray-200 bg-gray-50"
                          }
                        `}
                        onClick={() =>
                          isWinning && handleRevealSquare(square.position)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold">
                              Square #{square.position}
                            </span>
                            {isWinning && (
                              <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">
                                WINNING!
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm">
                            {isRevealed ? (
                              <>
                                <Timer className="h-4 w-4 mr-1 text-green-600" />
                                <span className="font-medium text-green-600">
                                  {square.claimData.answerTimeSeconds}s
                                </span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="text-gray-500">Hidden</span>
                              </>
                            )}
                          </div>
                        </div>

                        {isWinning && !isRevealed && (
                          <p className="text-xs text-gray-600 mt-2">
                            Click to reveal answer times
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Grid3X3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">
                    You don't have any squares yet
                  </p>
                  {userData.dailyTriviaAttempts > 0 ? (
                    <p className="text-sm text-blue-600">
                      Click on an available square to play trivia and claim it!
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No daily attempts left. Come back tomorrow!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Daily Attempts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                Daily Attempts
              </h3>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Remaining today</span>
                  <span>
                    {userData.hasTelegram
                      ? `${userData.dailyTriviaAttempts} / 10`
                      : `${userData.dailyTriviaAttempts} / 5`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentRemaining}%`,
                    }}
                  />
                </div>
              </div>

              {!userData.hasTelegram && (
                <div className="bg-purple-50 rounded-md p-3 text-sm">
                  <p className="text-purple-800 font-medium mb-1">
                    Get 10 daily attempts!
                  </p>
                  <p className="text-purple-700">
                    Add Telegram to double your plays
                  </p>
                </div>
              )}
            </div>

            {/* Game Rules */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-gray-600" />
                Quick Rules
              </h3>

              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Each square can hold up to 2 players</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Answer trivia correctly to claim squares</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Fastest answer time wins when squares match scores
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Losers get free squares for next game</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Answer times hidden until squares win</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Trivia Modal */}
        <AnimatePresence>
          {showTriviaModal && (
            <TriviaModal
              isOpen={showTriviaModal}
              onClose={() => {
                setShowTriviaModal(false);
                setSelectedSquare(null);
              }}
              onComplete={handleTriviaComplete}
              tierId={board.tierId}
              sport={game.sport}
              boardId={board?.id}
              squarePosition={selectedSquare}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
