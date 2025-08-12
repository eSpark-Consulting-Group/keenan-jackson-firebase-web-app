import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Lock, Zap, Trophy, Timer, Eye, EyeOff } from 'lucide-react';
import { GAME_CONFIG } from '../../firebase/config';

const GRID_CONFIG = {
  ROWS: 5,
  COLS: 10,
  ROW_DIGITS: [
    [0, 5],  // Row 0: represents digits 0 and 5
    [1, 6],  // Row 1: represents digits 1 and 6
    [2, 7],  // Row 2: represents digits 2 and 7
    [3, 8],  // Row 3: represents digits 3 and 8
    [4, 9],  // Row 4: represents digits 4 and 9
  ],
  COL_DIGITS: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
};

export default function SquareGrid({ 
  board, 
  currentUserId, 
  onSquareClick, 
  winningSquares = [],
  revealedSquares = new Set(),
  onRevealSquare,
  allowSelection = true 
}) {
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);

  const getSquareStatus = (position) => {
    const squareData = board.squares?.[position];
    if (!squareData || !squareData.claims || squareData.claims.length === 0) {
      return 'available';
    }
    
    // Check if current user has this square
    const userClaim = squareData.claims.find(claim => claim.userId === currentUserId);
    if (userClaim) {
      return 'mine';
    }
    
    // Check occupancy
    if (squareData.claims.length === 1) {
      return 'partial'; // 1/2 occupied
    } else {
      return 'full'; // 2/2 occupied
    }
  };

  const getSquareColor = (position, status) => {
    const isWinning = winningSquares.includes(position);
    
    if (isWinning) {
      if (status === 'mine') return 'bg-yellow-300 border-yellow-500 ring-4 ring-yellow-400 ring-opacity-50';
      return 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300';
    }
    
    switch (status) {
      case 'available': 
        return 'bg-white hover:bg-blue-50 border-gray-300 hover:border-blue-400';
      case 'mine': 
        return 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600';
      case 'partial': 
        return 'bg-orange-100 border-orange-400 hover:bg-orange-200';
      case 'full': 
        return 'bg-gray-200 border-gray-400 cursor-not-allowed';
      default: 
        return 'bg-gray-100';
    }
  };

  const getSquareContent = (position, status) => {
    const squareData = board.squares?.[position];
    const isWinning = winningSquares.includes(position);
    const isRevealed = revealedSquares.has(position);
    
    // Empty square
    if (!squareData || !squareData.claims || squareData.claims.length === 0) {
      return (
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{position}</div>
          {hoveredSquare === position && (
            <div className="text-xs text-gray-500 mt-1">Click to claim</div>
          )}
        </div>
      );
    }

    const claims = squareData.claims;
    const userClaim = claims.find(claim => claim.userId === currentUserId);

    // Winning square with revealed times
    if (isWinning && isRevealed) {
      return (
        <div className="text-center">
          <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
          <div className="space-y-1">
            {claims.map((claim, index) => (
              <div key={index} className="text-xs">
                <span className={claim.userId === currentUserId ? 'font-bold' : ''}>
                  {claim.userName || 'Player'}: {claim.answerTimeSeconds}s
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // User's square
    if (userClaim) {
      return (
        <div className="text-center">
          <div className="text-xl font-bold">YOU</div>
          {isWinning ? (
            <div className="text-xs mt-1 flex items-center justify-center">
              <Trophy className="h-3 w-3 mr-1" />
              WINNING
            </div>
          ) : (
            <div className="text-xs mt-1 opacity-75">
              {claims.length}/2 players
            </div>
          )}
        </div>
      );
    }

    // Other players' square
    return (
      <div className="text-center">
        <Users className={`h-6 w-6 mx-auto ${status === 'full' ? 'text-gray-500' : 'text-orange-500'}`} />
        <div className="text-xs mt-1">
          {claims.length}/2 players
        </div>
        {status === 'partial' && hoveredSquare === position && (
          <div className="text-xs text-blue-600 mt-1">Click to join</div>
        )}
      </div>
    );
  };

  const handleSquareClick = (position) => {
    const status = getSquareStatus(position);
    const isWinning = winningSquares.includes(position);
    
    // If it's a winning square, handle reveal
    if (isWinning && board.squares?.[position]?.claims?.length > 0) {
      onRevealSquare?.(position);
      return;
    }
    
    // Otherwise handle normal square selection
    if (allowSelection && (status === 'available' || status === 'partial')) {
      onSquareClick?.(position);
    } else if (status === 'full') {
      setSelectedInfo({ position, message: 'This square is full (2/2 players)' });
      setTimeout(() => setSelectedInfo(null), 3000);
    } else if (!allowSelection) {
      setSelectedInfo({ position, message: 'No daily attempts remaining' });
      setTimeout(() => setSelectedInfo(null), 3000);
    }
  };

  const getPositionDigits = (position) => {
    const row = Math.floor(position / GRID_CONFIG.COLS);
    const col = position % GRID_CONFIG.COLS;
    const rowDigits = GRID_CONFIG.ROW_DIGITS[row];
    const colDigit = GRID_CONFIG.COL_DIGITS[col];
    return { rowDigits, colDigit };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Board</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Click on available squares to claim them with trivia
          </p>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded mr-1"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-400 rounded mr-1"></div>
              <span>1/2 Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded mr-1"></div>
              <span>Yours</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-300 border-2 border-yellow-500 rounded mr-1"></div>
              <span>Winning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Labels */}
      <div className="mb-2 grid grid-cols-11 gap-1">
        <div></div> {/* Empty corner */}
        <div className="col-span-10 text-center text-sm font-semibold text-gray-700">
          {board.gameInfo?.teams?.home || 'Home Team'} →
        </div>
      </div>

      {/* Grid */}
      <div className="relative">
        {/* Column headers */}
        <div className="grid grid-cols-11 gap-1 mb-1">
          <div></div> {/* Empty corner */}
          {GRID_CONFIG.COL_DIGITS.map(digit => (
            <div key={digit} className="text-center text-sm font-bold text-gray-700 bg-gray-100 rounded py-1">
              {digit}
            </div>
          ))}
        </div>

        {/* Grid with row headers */}
        {GRID_CONFIG.ROW_DIGITS.map((rowDigits, row) => (
          <div key={row} className="grid grid-cols-11 gap-1 mb-1">
            {/* Row header */}
            <div className="flex items-center justify-center text-sm font-bold text-gray-700 bg-gray-100 rounded px-2">
              {rowDigits.join('/')}
            </div>
            
            {/* Squares */}
            {GRID_CONFIG.COL_DIGITS.map(col => {
              const position = row * GRID_CONFIG.COLS + col;
              const status = getSquareStatus(position);
              const isClickable = allowSelection && (status === 'available' || status === 'partial');
              const isWinning = winningSquares.includes(position);
              const isRevealed = revealedSquares.has(position);
              
              return (
                <motion.div
                  key={position}
                  whileHover={isClickable || isWinning ? { scale: 1.05 } : {}}
                  whileTap={isClickable || isWinning ? { scale: 0.95 } : {}}
                  onClick={() => handleSquareClick(position)}
                  onMouseEnter={() => setHoveredSquare(position)}
                  onMouseLeave={() => setHoveredSquare(null)}
                  className={`
                    relative aspect-square border-2 rounded-lg flex items-center justify-center
                    transition-all duration-200 
                    ${getSquareColor(position, status)}
                    ${(isClickable || isWinning) ? 'cursor-pointer' : 'cursor-default'}
                    ${selectedInfo?.position === position ? 'ring-2 ring-red-400' : ''}
                  `}
                >
                  {getSquareContent(position, status)}
                  
                  {/* Winning indicator */}
                  {isWinning && (
                    <div className="absolute top-0 right-0 -mt-1 -mr-1">
                      <div className="relative">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                        {!isRevealed && (
                          <div className="absolute inset-0 animate-ping">
                            <Trophy className="h-4 w-4 text-yellow-400 opacity-75" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Privacy indicator */}
                  {status !== 'available' && !isWinning && (
                    <div className="absolute bottom-0 right-0 -mb-1 -mr-1">
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Away team label */}
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-gray-700">
          ← {board.gameInfo?.teams?.away || 'Away Team'}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How squares win:</p>
            <p>When the last digit of each team's score matches a square's position, that square wins! 
            Example: If the score is 17-23, squares at positions (7,3) and (3,7) both win. 
            The player with the fastest trivia answer time takes the prize.</p>
          </div>
        </div>
      </div>

      {/* Selected square info tooltip */}
      {selectedInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm"
        >
          {selectedInfo.message}
        </motion.div>
      )}
    </div>
  );
}