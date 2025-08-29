import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/authcontext";
import { db, collections, } from "../firebase/config";
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

export default function Tier() {
  const {  userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showTierSelection, setShowTierSelection] = useState(false);
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

        // 2. Extract tiers where this user has played
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
        console.error("Error loading played tiers:", err);
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

  if (loading && Object.keys(groupedGames)?.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <TierSelection
        isOpen={showTierSelection}
        onClose={() => setShowTierSelection(false)}
        onComplete={() => {
          setShowTierSelection(false);
          loadGames();
        }}
      />
    </>
  );
}
