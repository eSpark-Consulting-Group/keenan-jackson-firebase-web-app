import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, TIERS, formatCurrency, collections } from "../firebase/config";
import { Trophy, Star, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function GameResults() {
  const { boardId, gameId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [game, setGame] = useState(null);
  const [winners, setWinners] = useState([]);
  const [champion, setChampion] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeBoardId = boardId || gameId;

  useEffect(() => {
    if (!activeBoardId) return;
    loadBoardData(activeBoardId);
    listenWinners(activeBoardId);
  }, [activeBoardId]);
  const temp = [];
  // Load Board + Game Info
  const loadBoardData = async (id) => {
    try {
      const boardDoc = await getDoc(doc(db, collections.boards, id));
      if (!boardDoc.exists()) {
        toast.error("Board not found");
        navigate("/games");
        return;
      }

      const boardData = { id: boardDoc.id, ...boardDoc.data() };
      setBoard(boardData);

      if (boardData.gameId) {
        const gameDoc = await getDoc(
          doc(db, collections.games, boardData.gameId)
        );
        if (gameDoc.exists()) {
          setGame({ id: gameDoc.id, ...gameDoc.data() });
        }
      }
    } catch (err) {
      console.error("Error loading board/game:", err);
      toast.error("Failed to load board info");
    }
  };

  // Real-time Winners Listener (same logic as GameBoard)
  const listenWinners = (id) => {
    setLoading(true);
    const q = query(collection(db, "winners"), where("boardId", "==", id));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const docSnap of snapshot.docs) {
        const winnerData = docSnap.data();
        const userId = winnerData.userId;

        // fetch user details
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        let displayName = "Unknown User";
        if (userDoc.exists()) {
          const u = userDoc.data();
          displayName = u.displayName || u.username || u.email || "Unknown";
        }

        temp.push({
          id: docSnap.id,
          ...winnerData,
          displayName,
          square: `${winnerData.row ?? 0}-${winnerData.col ?? 0}`,
          answerTime: winnerData.answerTime,
          prizeAmount: winnerData.prizeAmount,
        });
      }

      if (temp.length === 0) {
        // fallback: check squareClaims if winners not found
        await loadFromSquareClaims(id, temp);
      }

      console.log("Winners loaded:", temp);
      setChampion(temp[1]);
      setWinners(temp);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  // fallback to squareClaims (if "winners" collection empty)
  const loadFromSquareClaims = async (boardId, existingArray) => {
    const q = query(
      collection(db, "squareClaims"),
      where("boardId", "==", boardId),
      where("isWinner", "==", true)
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const data = d.data();
      const userRef = doc(db, "users", data.userId);
      const userDoc = await getDoc(userRef);

      let displayName = "Unknown User";
      if (userDoc.exists()) {
        const u = userDoc.data();
        displayName = u.displayName || u.username || u.email || "Unknown";
      }

      existingArray.push({
        id: d.id,
        displayName,
        username: displayName,
        quarter: data.winningQuarter,
        square: `${data.row}-${data.col}`,
        answerTime: data.triviaAnswerTimeSeconds,
        prizeAmount: data.prizeAmount,
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-600">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );

  if (!board)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Board Not Found</h2>
          <button
            onClick={() => navigate("/games")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Back to Games
          </button>
        </div>
      </div>
    );

  const tier = TIERS[board.tierId?.toUpperCase()] || {
    prizePerQuarter: 200,
    championPrize: 250,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Game Complete!</h1>
          {game && (
            <p className="text-gray-600 mb-3">
              {game?.teams?.home} {game?.finalScores?.home} -{" "}
              {game?.finalScores?.away} {game?.teams?.away}
            </p>
          )}
          <p className="text-gray-500">
            All {winners.length} quarters finished — here are your winners!
          </p>
        </motion.div>

        {/* Contest Winners */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-md p-6 mb-6"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
            <Trophy className="text-yellow-500 h-6 w-6" /> Contest Winners
          </h2>
          <h3 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2 text-green-600">
            Speed Wins Always
          </h3>

          {winners.length > 0 ? (
            <div className="space-y-3">
              {winners.slice(0.4).map((win, i) => (
                <div
                  key={win.id}
                  className="flex justify-between items-center border rounded-lg p-3 text-gray-800"
                >
                  <span className="font-medium">
                    {win.winningQuarter?.toUpperCase() ||
                      win.quarter?.toUpperCase()}
                    :
                  </span>
                  <span className="text-blue-700 font-semibold">
                    @{win.displayName}
                  </span>
                  <span>Square "{win.square}"</span>
                  {win.answerTime && (
                    <span>{win.answerTime.toFixed(2) * 1000}s</span>
                  )}
                  <span className="font-bold text-green-700">
                    {formatCurrency(win.prizeAmount || tier.prizePerQuarter)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No winners found yet.
            </p>
          )}
        </motion.div>

        {/* Champion Section */}
        {champion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-50 border border-yellow-300 rounded-xl shadow-sm p-6 text-center"
          >
            <h2 className="text-2xl font-bold text-yellow-800 mb-2 flex justify-center items-center gap-2">
              <Star className="text-yellow-500 h-6 w-6" /> BOARD CHAMPION
            </h2>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              @{champion.displayName} - Square "{champion.square}" -{" "}
              {champion.answerTime?.toFixed(2) * 1000}s -{" "}
              {formatCurrency(tier.championPrize || 250)} BONUS
            </p>
            <p className="text-sm text-gray-700">
              Fastest trivia answer across all quarters wins extra $
              {tier.championPrize}!
            </p>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={() => navigate("/payouts")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            <ArrowLeft className="h-4 w-4" /> View My Results
          </button>
          <button
            onClick={() => navigate("/games")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Play Another Game
          </button>
        </div>
      </div>
    </div>
  );
}
