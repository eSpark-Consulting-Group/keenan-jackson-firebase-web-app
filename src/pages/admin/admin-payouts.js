import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Send,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  Zap,
  Eye,
} from "lucide-react";
import {
  db,
  collections,
  formatCurrency,
  INSTANT_PAYOUT_FEE,
} from "../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function AdminPayouts() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  console.log("Payouts:", payouts);
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    processingCount: 0,
    processingAmount: 0,
    completedToday: 0,
    completedTodayAmount: 0,
  });
  const [filterOptions, setFilterOptions] = useState({
    status: "all",
    type: "all",
    dateRange: "7days",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayouts, setSelectedPayouts] = useState([]);

  useEffect(() => {
    loadPayouts();
  }, [filterOptions]);

  const loadPayouts = async () => {
    try {
      setLoading(true);

      // --- 1. Build query based on filters ---
      let constraints = [orderBy("createdAt", "desc"), limit(100)];

      if (filterOptions.status !== "all") {
        constraints.unshift(where("status", "==", filterOptions.status));
      }

      if (filterOptions.dateRange !== "all") {
        const now = new Date();
        let startDate;

        switch (filterOptions.dateRange) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "7days":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "30days":
            startDate = new Date(now.setDate(now.getDate() - 30));
            break;
          default:
            startDate = null;
        }

        if (startDate) {
          constraints.unshift(where("createdAt", ">=", startDate));
        }
      }

      // --- 2. Fetch payouts (winners collection) ---
      const q = query(collection(db, collections.winners), ...constraints);
      const snapshot = await getDocs(q);

      let payoutsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // --- 3. Collect unique userIds ---
      const userIds = [
        ...new Set(payoutsData.map((p) => p.userId).filter(Boolean)),
      ];

      // --- 4. Fetch all users in parallel ---
      const userDocs = await Promise.all(
        userIds.map((id) => getDoc(doc(db, collections.users, id)))
      );

      const userMap = {};
      userDocs.forEach((userDoc, i) => {
        if (userDoc.exists()) {
          userMap[userIds[i]] = userDoc.data();
        }
      });

      // --- 5. Attach users to payouts ---
      payoutsData = payoutsData.map((p) => ({
        ...p,
        user: p.userId ? userMap[p.userId] || null : null,
      }));

      // --- 6. Update state & stats ---
      setPayouts(payoutsData);
      calculateStats(payoutsData);

      setLoading(false);
    } catch (error) {
      console.error("Error loading payouts:", error);
      toast.error("Failed to load payouts");
      setLoading(false);
    }
  };

  const calculateStats = (payoutsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      pendingCount: 0,
      pendingAmount: 0,
      processingCount: 0,
      processingAmount: 0,
      completedToday: 0,
      completedTodayAmount: 0,
    };

    payoutsData.forEach((payout) => {
      if (payout.status === "pending_payout") {
        stats.pendingCount++;
        stats.pendingAmount += payout.prizeAmount || 0;
      } else if (payout.status === "processing") {
        stats.processingCount++;
        stats.processingAmount += payout.prizeAmount || 0;
      } else if (
        payout.status === "completed" &&
        payout.completedAt?.toDate?.() >= today
      ) {
        stats.completedToday++;
        stats.completedTodayAmount += payout.prizeAmount || 0;
      }
    });

    setStats(stats);
  };

  const updatePayoutStatus = async (payoutId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (newStatus === "completed") {
        updateData.completedAt = new Date();
      } else if (newStatus === "processing") {
        updateData.processingStartedAt = new Date();
      }

      await updateDoc(doc(db, collections.winners, payoutId), updateData);

      toast.success(`Payout marked as ${newStatus}`);
      loadPayouts();
    } catch (error) {
      console.error("Error updating payout:", error);
      toast.error("Failed to update payout status");
    }
  };

  const bulkUpdateStatus = async (newStatus) => {
    if (selectedPayouts.length === 0) {
      toast.error("No payouts selected");
      return;
    }

    if (
      !window.confirm(`Mark ${selectedPayouts.length} payouts as ${newStatus}?`)
    ) {
      return;
    }

    try {
      const updates = selectedPayouts.map((payoutId) =>
        updatePayoutStatus(payoutId, newStatus)
      );

      await Promise.all(updates);
      setSelectedPayouts([]);
    } catch (error) {
      console.error("Error bulk updating:", error);
      toast.error("Failed to update some payouts");
    }
  };

  const exportForRelay = () => {
    const exportData = payouts
      .filter((p) => p.status === "pending" || p.status === "processing")
      .map((payout) => ({
        email: payout.user?.email || payout.email,
        amount: payout.amount,
        reference: payout.id,
        name: payout.user?.displayName || "Square Trivia Winner",
      }));

    const csv = [
      ["email", "amount", "reference", "name"],
      ...exportData.map((row) => [
        row.email,
        row.amount,
        row.reference,
        row.name,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relay-payouts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success(`Exported ${exportData.length} payouts for Relay`);
  };

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      searchTerm === "" ||
      payout.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.user?.displayName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payout.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getPayoutTypeIcon = (type) => {
    return type === "instant" ? Zap : Clock;
  };

  const getPayoutTypeBadge = (type) => {
    const Icon = getPayoutTypeIcon(type);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          type === "instant"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-blue-100 text-blue-800"
        }`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {type === "instant" ? "Instant" : "Standard"}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_payout: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", icon: Send },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const badge = badges[status] || badges.pending_payout;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badge.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status === "pending_payout" ? "pending" : status}
      </span>
    );
  };

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
              Payout Management
            </h1>
            <p className="text-gray-600 mt-2">Process and track user payouts</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportForRelay}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export for Relay
            </button>
            <button
              onClick={loadPayouts}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{stats.pendingCount}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-xl font-bold">{stats.processingCount}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(stats.processingAmount)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-xl font-bold">{stats.completedToday}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(stats.completedTodayAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Instant Fee Rate</p>
                <p className="text-xl font-bold">
                  {(INSTANT_PAYOUT_FEE * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500">Convenience fee</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterOptions.status}
              onChange={(e) =>
                setFilterOptions({ ...filterOptions, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending_payout">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filterOptions.payoutType}
              onChange={(e) =>
                setFilterOptions({ ...filterOptions, type: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="instant">Instant</option>
              <option value="standard">Standard</option>
            </select>

            <select
              value={filterOptions.dateRange}
              onChange={(e) =>
                setFilterOptions({
                  ...filterOptions,
                  dateRange: e.target.value,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPayouts.length > 0 && (
          <div className="mb-4 bg-blue-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-900">
                {selectedPayouts.length} payouts selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus("processing")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm hover:text-white"
              >
                Mark as Processing
              </button>
              <button
                onClick={() => bulkUpdateStatus("completed")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => setSelectedPayouts([])}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Payouts Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedPayouts.length === filteredPayouts.length &&
                        filteredPayouts.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayouts(filteredPayouts.map((p) => p.id));
                        } else {
                          setSelectedPayouts([]);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayouts.length > 0 ? (
                  filteredPayouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className={`hover:bg-gray-50 ${
                        selectedPayouts.includes(payout.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPayouts.includes(payout.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPayouts([
                                ...selectedPayouts,
                                payout.id,
                              ]);
                            } else {
                              setSelectedPayouts(
                                selectedPayouts.filter((id) => id !== payout.id)
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <Link to={`/admin/users/${payout.userId}`}>
                            {payout.user?.displayName || "Unknown User"}</Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {payout.user?.email || payout.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payout.prizeAmount)}
                          </div>
                          {payout.payoutType === "instant" && (
                            <div className="text-xs text-gray-500">
                              Fee:{" "}
                              {formatCurrency(
                                payout.amount * INSTANT_PAYOUT_FEE
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPayoutTypeBadge(payout.payoutType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payout.createdAt?.toDate?.().toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payout.createdAt?.toDate?.().toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {payout.status === "pending_payout" && (
                            <>
                              <button
                                onClick={() =>
                                  updatePayoutStatus(payout.id, "processing")
                                }
                                className="text-blue-600 hover:text-blue-900"
                                title="Start Processing"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  updatePayoutStatus(payout.id, "failed")
                                }
                                className="text-red-600 hover:text-red-900"
                                title="Mark as Failed"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {payout.status === "processing" && (
                            <>
                            <button
                              onClick={() =>
                                updatePayoutStatus(payout.id, "completed")
                              }
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() =>
                                  updatePayoutStatus(payout.id, "failed")
                                }
                                className="text-red-600 hover:text-red-900"
                                title="Mark as Failed"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                            
                          )}
                          {payout.status === "failed" && (
                             <button
                                onClick={() =>
                                  updatePayoutStatus(payout.id, "processing")
                                }
                                className="text-blue-600 hover:text-blue-900"
                                title="Start Processing Again"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                          )}
                            <Link to={`/admin/payouts/${payout.id}`}>
                              <Eye className="h-4 w-4" /></Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No payouts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">
                Payout Processing Instructions:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Export pending payouts using "Export for Relay" button</li>
                <li>Upload CSV to Relay batch payment system</li>
                <li>Mark payouts as "Processing" once batch is submitted</li>
                <li>
                  Mark as "Completed" when Relay confirms successful payment
                </li>
                <li>
                  Process instant payouts daily, standard payouts Tuesday/Friday
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
