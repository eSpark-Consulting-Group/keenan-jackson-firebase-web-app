import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Trophy } from 'lucide-react';

export default function GameScore({ 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  quarter,
  timeRemaining,
  isLive = true
}) {
  const getQuarterDisplay = () => {
    if (!quarter) return 'Pre-Game';
    
    switch (quarter) {
      case 1: return '1st Quarter';
      case 2: return '2nd Quarter';
      case 3: return '3rd Quarter';
      case 4: return '4th Quarter';
      case 5: return 'Overtime';
      case 'F': return 'Final';
      case 'HT': return 'Halftime';
      default: return quarter;
    }
  };

  const getLastDigit = (score) => {
    return score % 10;
  };

  const getWinningPositions = () => {
    const homeDigit = getLastDigit(homeScore);
    const awayDigit = getLastDigit(awayScore);
    
    const positions = [];
    positions.push(`(${awayDigit}, ${homeDigit})`);
    
    if (homeDigit !== awayDigit) {
      positions.push(`(${homeDigit}, ${awayDigit})`);
    }
    
    return positions;
  };

  const winningPositions = getWinningPositions();

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 min-w-[300px]">
      {/* Quarter and time */}
      <div className="text-center mb-3">
        <div className="text-sm text-gray-400 mb-1">{getQuarterDisplay()}</div>
        {timeRemaining && (
          <div className="flex items-center justify-center text-sm">
            <Clock className="h-4 w-4 mr-1" />
            <span>{timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-4 items-center mb-4">
        {/* Away team */}
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-1">Away</div>
          <div className="font-semibold">{awayTeam}</div>
        </div>

        {/* Score display */}
        <div className="text-center">
          <motion.div 
            className="text-3xl font-bold flex items-center justify-center space-x-2"
            key={`${awayScore}-${homeScore}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span>{awayScore}</span>
            <span className="text-gray-500">-</span>
            <span>{homeScore}</span>
          </motion.div>
          
          {/* Last digits */}
          <div className="flex items-center justify-center space-x-2 mt-1 text-sm">
            <span className="text-gray-400">Last digits:</span>
            <span className="font-mono bg-gray-800 px-2 py-1 rounded">
              {getLastDigit(awayScore)}-{getLastDigit(homeScore)}
            </span>
          </div>
        </div>

        {/* Home team */}
        <div className="text-left">
          <div className="text-sm text-gray-400 mb-1">Home</div>
          <div className="font-semibold">{homeTeam}</div>
        </div>
      </div>

      {/* Winning squares indicator */}
      <div className="border-t border-gray-800 pt-3">
        <div className="flex items-center justify-center text-sm">
          <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
          <span className="text-gray-400 mr-1">Winning squares:</span>
          <span className="font-mono text-yellow-500">
            {winningPositions.join(' & ')}
          </span>
        </div>
        
        {isLive && (
          <motion.div 
            className="mt-2 text-center"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
              LIVE
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}