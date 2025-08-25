import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  X,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, collections, formatCurrency } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function PayoutNotification() {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [newPayout, setNewPayout] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Listen for new pending payouts
    const q = query(
      collection(db, collections.payouts),
      where('userId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const payout = { id: change.doc.id, ...change.doc.data() };
          
          // Check if this payout was already dismissed
          if (!dismissed.includes(payout.id)) {
            // Check if payout is less than 5 minutes old
            const createdAt = payout.createdAt?.toDate?.() || new Date(payout.createdAt);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            if (createdAt > fiveMinutesAgo) {
              setNewPayout(payout);
              setShowNotification(true);
              
              // Auto-hide after 10 seconds
              setTimeout(() => {
                setShowNotification(false);
              }, 10000);
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, dismissed]);

  const handleDismiss = () => {
    if (newPayout) {
      setDismissed([...dismissed, newPayout.id]);
    }
    setShowNotification(false);
  };

  if (!showNotification || !newPayout) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 right-4 z-50 max-w-md"
      >
        <div className="bg-white rounded-lg shadow-xl border-2 border-green-500 overflow-hidden">
          {/* Header */}
          <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              <span className="font-semibold">You Won!</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-green-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-3">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(newPayout.amount)}
              </p>
              <p className="text-sm text-gray-600">
                {newPayout.gameInfo?.teams 
                  ? `${newPayout.gameInfo.teams.away} @ ${newPayout.gameInfo.teams.home}`
                  : 'Game Winnings'
                }
              </p>
              {newPayout.quarter && (
                <p className="text-xs text-gray-500">
                  Quarter {newPayout.quarter} • Square ({newPayout.square?.row},{newPayout.square?.col})
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <Link
                to="/payouts"
                onClick={handleDismiss}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Zap className="h-4 w-4 mr-1" />
                Get Instant
              </Link>
              
              <Link
                to="/payouts"
                onClick={handleDismiss}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Standard payout in 2-3 days or get instant with 4% fee
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}