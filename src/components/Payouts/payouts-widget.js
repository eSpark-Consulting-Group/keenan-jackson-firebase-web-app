import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Clock,
  Zap,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, collections, formatCurrency } from '../../firebase/config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function PayoutsWidget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    totalPending: 0,
    lastWin: null
  });

  useEffect(() => {
    if (user) {
      loadPayoutsSummary();
    }
  }, [user]);

  const loadPayoutsSummary = async () => {
    try {
      // Get pending payouts
      const pendingQuery = query(
        collection(db, collections.payouts),
        where('userId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      
      const pendingSnapshot = await getDocs(pendingQuery);
      const pending = [];
      let totalPending = 0;
      
      pendingSnapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        pending.push(data);
        totalPending += data.amount;
      });
      
      // Get last completed payout
      const completedQuery = query(
        collection(db, collections.payouts),
        where('userId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(1)
      );
      
      const completedSnapshot = await getDocs(completedQuery);
      let lastWin = null;
      
      if (!completedSnapshot.empty) {
        lastWin = completedSnapshot.docs[0].data();
      }
      
      setPendingPayouts(pending);
      setStats({
        pending: pending.length,
        totalPending,
        lastWin
      });
      
    } catch (error) {
      console.error('Error loading payouts summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Payouts
        </h3>
        <Link
          to="/payouts"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {/* Pending Amount */}
      {stats.totalPending > 0 ? (
        <>
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.totalPending)}
              </span>
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Pending
              </span>
            </div>
            
            <Link
              to="/payouts"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Zap className="h-4 w-4 mr-2" />
              Get Instant Payout
            </Link>
          </div>

          {/* Recent Pending */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Recent Winnings</h4>
            {pendingPayouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payout.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payout.gameInfo?.teams 
                      ? `${payout.gameInfo.teams.away} @ ${payout.gameInfo.teams.home}`
                      : 'Game Win'
                    }
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-1">No pending payouts</p>
          {stats.lastWin ? (
            <p className="text-sm text-gray-500">
              Last win: {formatCurrency(stats.lastWin.amount)}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Win games to earn payouts!
            </p>
          )}
          <Link
            to="/games"
            className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Browse Games
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}

      {/* Info Text */}
      {stats.totalPending > 0 && (
        <p className="text-xs text-gray-500 mt-4">
          Standard payouts process in 2-3 days. Instant payouts available with 4% fee.
        </p>
      )}
    </motion.div>
  );
}