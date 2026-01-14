import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, callFunction } from '../firebase/config';
import { useAuth } from './authcontext';
import toast from 'react-hot-toast';

const GameContext = createContext({});

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

export function GameProvider({ children }) {
  const { user } = useAuth();
  
  // Game state
  const [activeGames, setActiveGames] = useState([]);
  const [myGames, setMyGames] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trivia state
  const [triviaModal, setTriviaModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [pendingSquareToken, setPendingSquareToken] = useState(null);

  // Real-time listeners for active games
  useEffect(() => {
    let unsubscribeActiveGames;
    let unsubscribeMyGames;

    const setupListeners = async () => {
      try {
        // Listen to active games
        const activeGamesQuery = query(
          collection(db, 'gameBoards'),
          where('status', '==', 'active'),
          orderBy('gameDate', 'asc')
        );

        unsubscribeActiveGames = onSnapshot(activeGamesQuery, (snapshot) => {
          const games = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setActiveGames(games);
          setLoading(false);
        }, (error) => {
          console.error('Active games listener error:', error);
          setError(error.message);
          setLoading(false);
        });

        // If user is logged in, listen to their games
        if (user) {
          const myGamesQuery = query(
            collection(db, 'gameBoards'),
            where('players', 'array-contains', user.uid),
            orderBy('gameDate', 'desc'),
            limit(10)
          );

          unsubscribeMyGames = onSnapshot(myGamesQuery, (snapshot) => {
            const userGames = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMyGames(userGames);
          });
        }
      } catch (error) {
        console.error('Setup listeners error:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      if (unsubscribeActiveGames) unsubscribeActiveGames();
      if (unsubscribeMyGames) unsubscribeMyGames();
    };
  }, [user]);

  // Get games by board
  const getGamesByTier = (tier) => {
    return activeGames.filter(game => game.tier === tier);
  };

  // Get user's squares on a board
  const getUserSquares = async (boardId) => {
    if (!user) return [];

    try {
      const squaresQuery = query(
        collection(db, 'squareClaims'),
        where('boardId', '==', boardId),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(squaresQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Get user squares error:', error);
      return [];
    }
  };

  // Load board data
  const loadBoard = async (boardId) => {
    try {
      const boardDoc = await getDoc(doc(db, 'gameBoards', boardId));
      if (boardDoc.exists()) {
        const boardData = {
          id: boardDoc.id,
          ...boardDoc.data()
        };
        setCurrentBoard(boardData);
        return boardData;
      } else {
        throw new Error('Board not found');
      }
    } catch (error) {
      console.error('Load board error:', error);
      toast.error('Failed to load game board');
      return null;
    }
  };

  // Request trivia question
  const requestTrivia = async (tier, sport) => {
    if (!user) {
      toast.error('Please login to play trivia');
      return null;
    }

    try {
      const result = await callFunction('getTriviaQuestion', {
        tier,
        sport
      });

      if (result.success) {
        setCurrentQuestion(result.question);
        setQuestionStartTime(Date.now());
        setTriviaModal(true);
        return result.question;
      } else {
        throw new Error(result.error || 'Failed to get trivia question');
      }
    } catch (error) {
      console.error('Request trivia error:', error);
      toast.error(error.message);
      return null;
    }
  };

  // Submit trivia answer
  const submitAnswer = async (answer) => {
    if (!currentQuestion || !questionStartTime) {
      toast.error('No active question');
      return null;
    }

    const answerTime = Date.now() - questionStartTime;

    try {
      const result = await callFunction('submitTriviaAnswer', {
        questionId: currentQuestion.id,
        answer,
        answerTime
      });

      if (result.success) {
        if (result.correct) {
          toast.success(`Correct! Time: ${(answerTime / 1000).toFixed(2)}s`);
          setPendingSquareToken(result.squareToken);
        } else {
          toast.error('Incorrect answer. Try again!');
        }
        
        setTriviaModal(false);
        setCurrentQuestion(null);
        setQuestionStartTime(null);
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      toast.error(error.message);
      return null;
    }
  };

  // Claim square on board
  const claimSquare = async (boardId, position) => {
    if (!user || !pendingSquareToken) {
      toast.error('No valid square token');
      return null;
    }

    try {
      const result = await callFunction('claimSquare', {
        boardId,
        position,
        squareToken: pendingSquareToken
      });

      if (result.success) {
        toast.success('Square claimed successfully!');
        setPendingSquareToken(null);
        
        // Reload board to show updated squares
        await loadBoard(boardId);
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to claim square');
      }
    } catch (error) {
      console.error('Claim square error:', error);
      toast.error(error.message);
      return null;
    }
  };

  // Purchase donation board
  const purchaseTier = async (tier) => {
    if (!user) {
      toast.error('Please login to purchase');
      return null;
    }

    try {
      const result = await callFunction('createCheckoutSession', {
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      });

      if (result.success && result.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Purchase board error:', error);
      toast.error(error.message);
      return null;
    }
  };

  // Get available board for user
  const getAvailableTiers = () => {
    const allTiers = [
      { 
        id: 'tier_25', 
        amount: 25, 
        prizePerQuarter: 200,
        totalPrizes: 800,
        displayName: '$25 Board - Win $200/Quarter!',
        color: 'green',
        available: true
      },
      { 
        id: 'tier_50', 
        amount: 50, 
        prizePerQuarter: 450,
        totalPrizes: 1800,
        displayName: '$50 Board - Win $450/Quarter!',
        color: 'blue',
        available: true
      },
      { 
        id: 'tier_100', 
        amount: 100, 
        prizePerQuarter: 900,
        totalPrizes: 3600,
        displayName: '$100 Board - Win $900/Quarter!',
        color: 'yellow',
        available: true
      },
      { 
        id: 'tier_250', 
        amount: 250, 
        prizePerQuarter: 2250,
        totalPrizes: 9000,
        displayName: '$250 Board - Win $2,250/Quarter!',
        color: 'purple',
        available: activeGames.some(g => g.gameType === 'playoff')
      },
      { 
        id: 'tier_500', 
        amount: 500, 
        prizePerQuarter: 4500,
        totalPrizes: 18000,
        displayName: '$500 Board - Win $4,500/Quarter!',
        color: 'orange',
        available: activeGames.some(g => g.gameType === 'playoff')
      },
      { 
        id: 'tier_1000', 
        amount: 1000, 
        prizePerQuarter: 9000,
        totalPrizes: 36000,
        displayName: '$1000 Board - Win $9,000/Quarter!',
        color: 'red',
        available: activeGames.some(g => g.gameType === 'championship')
      }
    ];

    return allTiers;
  };

  const value = {
    // State
    activeGames,
    myGames,
    currentBoard,
    selectedTier,
    loading,
    error,
    triviaModal,
    currentQuestion,
    pendingSquareToken,
    
    // Functions
    getGamesByTier,
    getUserSquares,
    loadBoard,
    requestTrivia,
    submitAnswer,
    claimSquare,
    purchaseTier,
    getAvailableTiers,
    
    // Setters
    setSelectedTier,
    setTriviaModal
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}