import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  Grid3X3,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Brain
} from 'lucide-react';
import { db, collections, formatCurrency } from '../../firebase/config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeGames: 0,
    pendingPayouts: 0,
    totalPrizesPaid: 0,
    questionsAnswered: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [trends, setTrends] = useState({
    userGrowth: 0,
    revenueGrowth: 0,
    gameActivity: 0
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now.setDate(now.getDate() - 7));

      // Load various stats
      const [
        usersSnapshot,
        activeUsersSnapshot,
        donationsSnapshot,
        todayDonationsSnapshot,
        activeGamesSnapshot,
        pendingPayoutsSnapshot,
        completedPayoutsSnapshot,
        recentActivitySnapshot
      ] = await Promise.all([
        getDocs(collection(db, collections.users)),
        getDocs(query(
          collection(db, collections.users),
          where('lastActive', '>=', weekAgo)
        )),
        getDocs(collection(db, collections.donations)),
        getDocs(query(
          collection(db, collections.donations),
          where('createdAt', '>=', todayStart)
        )),
        getDocs(query(
          collection(db, collections.games),
          where('status', '==', 'active')
        )),
        getDocs(query(
          collection(db, collections.payouts),
          where('status', '==', 'pending')
        )),
        getDocs(query(
          collection(db, collections.payouts),
          where('status', '==', 'completed')
        )),
        getDocs(query(
          collection(db, collections.notifications),
          orderBy('createdAt', 'desc'),
          limit(10)
        ))
      ]);

      // Calculate stats
      let totalRevenue = 0;
      let todayRevenue = 0;
      donationsSnapshot.forEach(doc => {
        totalRevenue += doc.data().amount || 0;
      });
      todayDonationsSnapshot.forEach(doc => {
        todayRevenue += doc.data().amount || 0;
      });

      let totalPrizesPaid = 0;
      completedPayoutsSnapshot.forEach(doc => {
        totalPrizesPaid += doc.data().amount || 0;
      });

      let pendingPayoutAmount = 0;
      pendingPayoutsSnapshot.forEach(doc => {
        pendingPayoutAmount += doc.data().amount || 0;
      });

      // Set stats
      setStats({
        totalUsers: usersSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        totalRevenue,
        todayRevenue,
        activeGames: activeGamesSnapshot.size,
        pendingPayouts: pendingPayoutAmount,
        totalPrizesPaid,
        questionsAnswered: Math.floor(Math.random() * 50000) // In real app, query trivia attempts
      });

      // Calculate trends (mock data - in real app, compare to previous period)
      setTrends({
        userGrowth: 12.5,
        revenueGrowth: 8.3,
        gameActivity: -2.1
      });

      // Format recent activity
      const activity = [];
      recentActivitySnapshot.forEach(doc => {
        const data = doc.data();
        activity.push({
          id: doc.id,
          type: data.type,
          message: data.message,
          timestamp: data.createdAt,
          status: data.status
        });
      });
      setRecentActivity(activity);

      setLoading(false);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color, prefix = '', suffix = '' }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {prefix}{value}{suffix}
      </p>
    </motion.div>
  );

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Platform overview and real-time metrics</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend={trends.userGrowth}
            color="bg-blue-600"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            trend={trends.revenueGrowth}
            color="bg-green-600"
            prefix=""
          />
          <StatCard
            title="Active Games"
            value={stats.activeGames}
            icon={Grid3X3}
            trend={trends.gameActivity}
            color="bg-purple-600"
          />
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(stats.todayRevenue)}
            icon={TrendingUp}
            color="bg-yellow-600"
            prefix=""
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Payouts</h3>
              <Link to="/admin/payouts" className="text-blue-600 hover:text-blue-700 text-sm">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">
                  {formatCurrency(stats.pendingPayouts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.totalPrizesPaid)}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Activity</h3>
              <Link to="/admin/users" className="text-blue-600 hover:text-blue-700 text-sm">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Active (7d)</span>
                <span className="font-semibold">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Questions Answered</span>
                <span className="font-semibold">{stats.questionsAnswered.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <Link
                to="/admin/games"
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Create Game
              </Link>
              <Link
                to="/admin/trivia"
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <Brain className="h-4 w-4 mr-2" />
                Add Questions
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      activity.status === 'success' ? 'bg-green-100' :
                      activity.status === 'warning' ? 'bg-yellow-100' :
                      activity.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {activity.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                       activity.status === 'warning' ? <AlertCircle className="h-5 w-5 text-yellow-600" /> :
                       activity.status === 'error' ? <AlertCircle className="h-5 w-5 text-red-600" /> :
                       <Activity className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}