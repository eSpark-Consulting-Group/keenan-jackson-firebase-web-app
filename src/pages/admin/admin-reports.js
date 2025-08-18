import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Users,
  Download,
  RefreshCw,
  Activity,
  Trophy,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Grid3X3,
  Clock,
  Target,
  CheckCircle,
} from "lucide-react";
import { db, collections, TIERS, formatCurrency } from "../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("overview");

  // Overview stats
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalGames: 0,
    totalSquaresClaimed: 0,
    totalPrizesPaid: 0,
    averageRevenuePerUser: 0,
    conversionRate: 0,
    retentionRate: 0,
  });

  // Revenue data
  const [revenueData, setRevenueData] = useState({
    byTier: {},
    byDay: [],
    byMonth: [],
    projectedRevenue: 0,
    growthRate: 0,
  });

  // User analytics
  const [userAnalytics, setUserAnalytics] = useState({
    newUsers: [],
    activeUsers: [],
    churnRate: 0,
    lifetimeValue: 0,
    topPlayers: [],
    usersByTier: {},
  });

  // Game performance
  const [gamePerformance, setGamePerformance] = useState({
    popularGames: [],
    fillRate: 0,
    averageSquaresPerGame: 0,
    gamesByTier: {},
    completionRate: 0,
  });

  // Trivia stats
  const [triviaStats, setTriviaStats] = useState({
    totalQuestions: 0,
    totalAttempts: 0,
    correctRate: 0,
    averageAnswerTime: 0,
    popularQuestions: [],
    questionsByDifficulty: {},
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case "7days":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Load all necessary data
      const [
        usersSnapshot,
        donationsSnapshot,
        gamesSnapshot,
        squaresSnapshot,
        payoutsSnapshot,
        winnersSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, collections.users)),
        getDocs(
          query(
            collection(db, collections.donations),
            where("createdAt", ">=", startDate),
            orderBy("createdAt", "desc")
          )
        ),
        getDocs(
          query(
            collection(db, collections.games),
            where("createdAt", ">=", startDate)
          )
        ),
        getDocs(
          query(
            collection(db, collections.squareClaims),
            where("createdAt", ">=", startDate)
          )
        ),
        getDocs(
          query(
            collection(db, collections.payouts),
            where("status", "==", "completed"),
            where("completedAt", ">=", startDate)
          )
        ),
        getDocs(
          query(
            collection(db, collections.winners),
            where("createdAt", ">=", startDate)
          )
        ),
      ]);

      // Process overview stats
      let totalRevenue = 0;
      let revenueByTier = {};
      let revenueByDay = {};

      donationsSnapshot.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data?.stripeChargeId?.amount / 100 || 0;

        // By tier
        const tier = data.tierId || data?.tier || "unknown";
        revenueByTier[tier] =
          (revenueByTier[tier] || 0) + data?.stripeChargeId?.amount / 100;

        // By day
        const day = data.createdAt?.toDate?.().toDateString() || "Unknown";
        revenueByDay[day] =
          (revenueByDay[day] || 0) + data?.stripeChargeId?.amount / 100;
      });

      let totalPrizesPaid = 0;
      payoutsSnapshot.forEach((doc) => {
        totalPrizesPaid += doc.data().amount || 0;
      });

      // Calculate user metrics
      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter((doc) => {
        const lastActive = doc.data().lastActive?.toDate?.();
        return lastActive && lastActive >= startDate;
      }).length;

      // Mock some calculated metrics (in real app, would be more complex)
      const conversionRate =
        totalUsers > 0 ? donationsSnapshot.size / totalUsers : 0;
      const retentionRate = totalUsers > 0 ? activeUsers / totalUsers : 0;
      const averageRevenuePerUser =
        totalUsers > 0 ? totalRevenue / totalUsers : 0;

      // Process revenue trends
      const dailyRevenue = Object.entries(revenueByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30); // Last 30 days

      // console.log(revenueByDay);

      // Calculate growth rate
      const previousPeriodRevenue = totalRevenue * 0.8; // Mock previous period
      const growthRate =
        previousPeriodRevenue > 0
          ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) *
            100
          : 0;

      // Process game performance
      const gamesByTier = {};
      const gameCompletions = {};

      gamesSnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || "scheduled";
        gameCompletions[status] = (gameCompletions[status] || 0) + 1;
      });

      const completionRate =
        gamesSnapshot.size > 0
          ? (gameCompletions.completed || 0) / gamesSnapshot.size
          : 0;

      // Get top players by winnings
      const userWinnings = {};
      winnersSnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        userWinnings[userId] =
          (userWinnings[userId] || 0) + (data.prizeAmount || 0);
      });

      const topPlayers = Object.entries(userWinnings)
        .map(([userId, totalWon]) => ({ userId, totalWon }))
        .sort((a, b) => b.totalWon - a.totalWon)
        .slice(0, 10);

      // Set all state
      setOverview({
        totalRevenue,
        totalUsers,
        totalGames: gamesSnapshot.size,
        totalSquaresClaimed: squaresSnapshot.size,
        totalPrizesPaid,
        averageRevenuePerUser,
        conversionRate,
        retentionRate,
      });

      setRevenueData({
        byTier: revenueByTier,
        byDay: dailyRevenue,
        projectedRevenue: totalRevenue * 1.2, // Simple projection
        growthRate,
      });

      setUserAnalytics({
        newUsers: usersSnapshot.docs.filter(
          (doc) => doc.data().createdAt?.toDate?.() >= startDate
        ).length,
        activeUsers: activeUsers,
        churnRate: 1 - retentionRate,
        lifetimeValue: averageRevenuePerUser * 12, // Projected annual
        topPlayers,
        usersByTier: {}, // Would calculate from user data
      });

      setGamePerformance({
        fillRate: 0.75, // Mock data
        averageSquaresPerGame:
          squaresSnapshot.size / Math.max(gamesSnapshot.size, 1),
        gamesByTier,
        completionRate,
      });

      // Mock trivia stats
      setTriviaStats({
        totalQuestions: 1250,
        totalAttempts: 45000,
        correctRate: 0.65,
        averageAnswerTime: 8.5,
        popularQuestions: [],
        questionsByDifficulty: {
          easy: 300,
          medium: 500,
          hard: 350,
          expert: 100,
        },
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Failed to load report data");
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      dateRange,
      generatedAt: new Date().toISOString(),
      overview,
      revenue: revenueData,
      users: userAnalytics,
      games: gamePerformance,
      trivia: triviaStats,
    };

    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `square-trivia-report-${dateRange}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    toast.success("Report exported successfully");
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    prefix = "",
    suffix = "",
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {change >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {prefix}
        {typeof value === "number" && value % 1 !== 0
          ? value.toFixed(2)
          : value}
        {suffix}
      </p>
    </motion.div>
  );

  const RevenueChart = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
      <div className="h-64 flex items-end justify-between gap-2">
        {revenueData.byDay.slice(-14).map((day, index) => {
          const maxAmount = Math.max(...revenueData.byDay.map((d) => d.amount));
          const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
          // console.log(maxAmount, "MAX_AMOUNT");
          // console.log(revenueData, "REVENUE_DATA");
          // console.log(day, "DAY");
          // console.log(height, "HEIGHT");

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-200 rounded-t"
                style={{ height: `${height}px` }}
              >
                <div className="text-xs text-center mt-1 font-medium">
                  {formatCurrency(day.amount)}
                </div>
              </div>
              <div className="text-xs mt-2 rotate-45 origin-left">
                {new Date(day.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const TierBreakdown = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue by Tier</h3>
      <div className="space-y-3">
        {Object.entries(revenueData.byTier).map(([tierId, amount]) => {
          const tier = TIERS[tierId.toUpperCase()];
          const percentage =
            overview.totalRevenue > 0
              ? (amount / overview.totalRevenue) * 100
              : 0;
          return (
            <div key={tierId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  {tier?.name || tierId}
                </span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${tier?.color || "bg-gray-600"}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics & Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Platform performance metrics and insights
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={exportReport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={loadReportData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="mb-6 flex space-x-1 bg-gray-100 rounded-lg p-1">
          {["overview", "revenue", "users", "games", "trivia"].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`flex-1 py-2 px-4 rounded-md transition-colors capitalize ${
                reportType === type
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Overview Report */}
        {reportType === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(overview.totalRevenue)}
                change={revenueData.growthRate}
                icon={DollarSign}
                color="bg-green-600"
              />
              <MetricCard
                title="Total Users"
                value={overview.totalUsers.toLocaleString()}
                change={12.5}
                icon={Users}
                color="bg-blue-600"
              />
              <MetricCard
                title="Active Games"
                value={overview.totalGames}
                change={-5.2}
                icon={Grid3X3}
                color="bg-purple-600"
              />
              <MetricCard
                title="Prizes Paid"
                value={formatCurrency(overview.totalPrizesPaid)}
                change={8.7}
                icon={Trophy}
                color="bg-yellow-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RevenueChart />
              <TierBreakdown />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Conversion Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-semibold">
                      {(overview.conversionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retention Rate</span>
                    <span className="font-semibold">
                      {(overview.retentionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Revenue/User</span>
                    <span className="font-semibold">
                      {formatCurrency(overview.averageRevenuePerUser)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Game Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Squares</span>
                    <span className="font-semibold">
                      {overview.totalSquaresClaimed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fill Rate</span>
                    <span className="font-semibold">
                      {(gamePerformance.fillRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold">
                      {(gamePerformance.completionRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Trivia Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Attempts</span>
                    <span className="font-semibold">
                      {triviaStats.totalAttempts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Correct Rate</span>
                    <span className="font-semibold">
                      {(triviaStats.correctRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Answer Time</span>
                    <span className="font-semibold">
                      {triviaStats.averageAnswerTime}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Revenue Report */}
        {reportType === "revenue" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(overview.totalRevenue)}
                change={revenueData.growthRate}
                icon={DollarSign}
                color="bg-green-600"
              />
              <MetricCard
                title="Projected Revenue"
                value={formatCurrency(revenueData.projectedRevenue)}
                icon={TrendingUp}
                color="bg-blue-600"
              />
              <MetricCard
                title="Net Profit"
                value={formatCurrency(
                  overview.totalRevenue - overview.totalPrizesPaid
                )}
                icon={Activity}
                color="bg-purple-600"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % of Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(revenueData.byTier).map(
                      ([tierId, amount]) => {
                        const tier = TIERS[tierId.toUpperCase()];
                        const percentage =
                          overview.totalRevenue > 0
                            ? (amount / overview.totalRevenue) * 100
                            : 0;

                        return (
                          <tr key={tierId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium text-white ${tier?.color || "bg-gray-600"}`}
                              >
                                {tier?.name || tierId}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {formatCurrency(amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {percentage.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-green-600">
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                {(Math.random() * 20 + 5).toFixed(1)}%
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <RevenueChart />
          </>
        )}

        {/* Users Report */}
        {reportType === "users" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Users"
                value={overview.totalUsers}
                icon={Users}
                color="bg-blue-600"
              />
              <MetricCard
                title="New Users"
                value={userAnalytics.newUsers}
                change={15.2}
                icon={TrendingUp}
                color="bg-green-600"
              />
              <MetricCard
                title="Active Users"
                value={userAnalytics.activeUsers}
                icon={Activity}
                color="bg-purple-600"
              />
              <MetricCard
                title="Avg LTV"
                value={formatCurrency(userAnalytics.lifetimeValue)}
                icon={DollarSign}
                color="bg-yellow-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">User Retention</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Retention Rate</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${overview.retentionRate * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold">
                        {(overview.retentionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Churn Rate</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${userAnalytics.churnRate * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold">
                        {(userAnalytics.churnRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Top Players</h3>
                <div className="space-y-2">
                  {userAnalytics.topPlayers.slice(0, 5).map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="ml-3 text-sm">
                          User {player.userId.substring(0, 8)}...
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(player.totalWon)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Games Report */}
        {reportType === "games" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Games"
                value={overview.totalGames}
                icon={Grid3X3}
                color="bg-purple-600"
              />
              <MetricCard
                title="Squares Claimed"
                value={overview.totalSquaresClaimed}
                icon={Target}
                color="bg-blue-600"
              />
              <MetricCard
                title="Fill Rate"
                value={`${(gamePerformance.fillRate * 100).toFixed(0)}%`}
                icon={Activity}
                color="bg-green-600"
              />
              <MetricCard
                title="Completion Rate"
                value={`${(gamePerformance.completionRate * 100).toFixed(0)}%`}
                icon={CheckCircle}
                color="bg-yellow-600"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Game Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Average Squares per Game
                  </h4>
                  <div className="text-3xl font-bold text-gray-900">
                    {gamePerformance.averageSquaresPerGame.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Out of 100 possible
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Games by Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-sm font-medium">
                        {Math.floor(overview.totalGames * 0.7)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active</span>
                      <span className="text-sm font-medium">
                        {Math.floor(overview.totalGames * 0.2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Scheduled</span>
                      <span className="text-sm font-medium">
                        {Math.floor(overview.totalGames * 0.1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Trivia Report */}
        {reportType === "trivia" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Questions"
                value={triviaStats.totalQuestions}
                icon={Brain}
                color="bg-blue-600"
              />
              <MetricCard
                title="Total Attempts"
                value={`${(triviaStats.totalAttempts / 1000).toFixed(1)}k`}
                icon={Target}
                color="bg-purple-600"
              />
              <MetricCard
                title="Correct Rate"
                value={`${(triviaStats.correctRate * 100).toFixed(0)}%`}
                icon={CheckCircle}
                color="bg-green-600"
              />
              <MetricCard
                title="Avg Answer Time"
                value={`${triviaStats.averageAnswerTime}s`}
                icon={Clock}
                color="bg-yellow-600"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Questions by Difficulty
              </h3>
              <div className="space-y-3">
                {Object.entries(triviaStats.questionsByDifficulty).map(
                  ([difficulty, count]) => {
                    const percentage =
                      triviaStats.totalQuestions > 0
                        ? (count / triviaStats.totalQuestions) * 100
                        : 0;
                    const colors = {
                      easy: "bg-green-600",
                      medium: "bg-yellow-600",
                      hard: "bg-orange-600",
                      expert: "bg-red-600",
                    };

                    return (
                      <div key={difficulty}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">
                            {difficulty}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} questions
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colors[difficulty]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
