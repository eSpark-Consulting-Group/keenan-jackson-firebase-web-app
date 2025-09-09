import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  DollarSign,
  Trophy,
  Brain,
  Eye,
  Download,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import {
  db,
  collections,
  formatCurrency,
  functions,
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
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/authcontext";
import { httpsCallable } from "firebase/functions";

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  console.log(users, "users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    status: "all",
    tier: "all",
    hasTelegram: "all",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const { userData } = useAuth();
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const usersQuery = query(
        collection(db, collections.users),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const snapshot = await getDocs(usersQuery);
      const usersData = [];

      for (const doc of snapshot.docs) {
        const userData = { id: doc.id, ...doc.data() };

        // Get user stats
        const [donations, wins, squares] = await Promise.all([
          getDocs(
            query(
              collection(db, collections.donations),
              where("userId", "==", doc.id)
            )
          ),
          getDocs(
            query(
              collection(db, collections.winners),
              where("userId", "==", doc.id)
            )
          ),
          getDocs(
            query(
              collection(db, collections.squareClaims),
              where("userId", "==", doc.id)
            )
          ),
        ]);

        let totalDonations = 0;
        let totalWinnings = 0;

        donations.forEach((d) => (totalDonations += d.data().amount || 0));
        wins.forEach((w) => (totalWinnings += w.data().prizeAmount || 0));

        userData.stats = {
          totalDonations,
          totalWinnings,
          totalSquares: squares.size,
          totalWins: wins.size,
        };

        usersData.push(userData);
      }

      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "banned" ? "active" : "banned";
    const action = newStatus === "banned" ? "ban" : "unban";

    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, collections.users, userId), {
        status: newStatus,
        [`${action}Date`]: new Date(),
        [`${action}Reason`]:
          prompt(`Please provide a reason for ${action}ning:`) ||
          "Admin action",
      });

      toast.success(`User ${action}ned successfully`);
      loadUsers();
    } catch (error) {
      console.error(`Error ${action}ning user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const exportUsers = () => {
    const csv = [
      [
        "Email",
        "Name",
        "Status",
        "Telegram",
        "Total Donations",
        "Total Winnings",
        "Squares",
        "Wins",
        "Created Date",
      ],
      ...filteredUsers.map((user) => [
        user.email,
        user.displayName || "",
        user.status || "active",
        user.hasTelegram ? "Yes" : "No",
        user.stats.totalDonations,
        user.stats.totalWinnings,
        user.stats.totalSquares,
        user.stats.totalWins,
        user.createdAt?.toDate?.().toLocaleDateString() || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);

      const matchesStatus =
        filterOptions.status === "all" ||
        (filterOptions.status === "active" && user.status !== "banned") ||
        (filterOptions.status === "banned" && user.status === "banned");

      const matchesTelegram =
        filterOptions.hasTelegram === "all" ||
        (filterOptions.hasTelegram === "yes" && user.hasTelegram) ||
        (filterOptions.hasTelegram === "no" && !user.hasTelegram);

      return matchesSearch && matchesStatus && matchesTelegram;
    })
    .sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;

      if (sortBy.includes(".")) {
        const [obj, prop] = sortBy.split(".");
        aVal = a[obj]?.[prop] || 0;
        bVal = b[obj]?.[prop] || 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Add this function inside AdminUsers
  const toggleAdmin = async (user, currentStatus) => {
    const newStatus = !currentStatus;
    console.log(user);

    try {
      await updateDoc(doc(db, collections.users, user.id), {
        isAdmin: newStatus,
      });
      if (newStatus) {
        const setAdminClaim = httpsCallable(functions, "setAdminClaim");
        await setAdminClaim({ uid: user.id });
      }
      const userLabel = user.displayName || user.email?.split("@")[0] || "User";
      const statusLabel = newStatus ? "is Admin Now" : "is Not Admin Now";
      toast.success(`${userLabel} ${statusLabel}`);
      loadUsers(); // reload list
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Failed to update admin status");
    }
  };

  const UserDetailsModal = ({ user, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">User Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Display Name</p>
                  <p className="font-medium">{user.displayName || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{user.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "banned"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.status === "banned" ? "Banned" : "Active"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm text-gray-600">Total Donations</p>
                  </div>
                  <p className="text-xl font-bold">
                    {formatCurrency(user.stats.totalDonations)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-gray-600">Total Winnings</p>
                  </div>
                  <p className="text-xl font-bold">
                    {formatCurrency(user.stats.totalWinnings)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-sm text-gray-600">Total Squares</p>
                  </div>
                  <p className="text-xl font-bold">{user.stats.totalSquares}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm text-gray-600">Total Wins</p>
                  </div>
                  <p className="text-xl font-bold">{user.stats.totalWins}</p>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Account Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span>
                    {user.createdAt?.toDate?.().toLocaleString() || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Active</span>
                  <span>
                    {user.lastActive?.toDate?.().toLocaleString() || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telegram Connected</span>
                  <span>{user.hasTelegram ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Tiers</span>
                  <span>{user.currentTiers?.join(", ") || "None"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  toggleUserStatus(user.id, user.status);
                  onClose();
                }}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                  user.status === "banned"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {user.status === "banned" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unban User
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Ban User
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  window.location.href = `mailto:${user.email}`;
                }}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      </motion.div>
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
              User Management
            </h1>
            <p className="text-gray-600 mt-2">View and manage platform users</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportUsers}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={loadUsers}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-xl font-bold">
                  {users.filter((u) => u.status !== "banned").length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">With Telegram</p>
                <p className="text-xl font-bold">
                  {users.filter((u) => u.hasTelegram).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <Ban className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Banned Users</p>
                <p className="text-xl font-bold">
                  {users.filter((u) => u.status === "banned").length}
                </p>
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
              placeholder="Search by email, name, or phone..."
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
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>

            <select
              value={filterOptions.hasTelegram}
              onChange={(e) =>
                setFilterOptions({
                  ...filterOptions,
                  hasTelegram: e.target.value,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="yes">With Telegram</option>
              <option value="no">No Telegram</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt">Join Date</option>
              <option value="stats.totalDonations">Total Donations</option>
              <option value="stats.totalWinnings">Total Winnings</option>
              <option value="lastActive">Last Active</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {userData.isSupperAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      is Admin
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <Link
                              to={`/admin/users/${user.id}`}
                              className="hover:underline"
                            >
                              {user.displayName || "Anonymous"}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.phone || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.hasTelegram && (
                            <span className="inline-flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Telegram
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div>
                            Donated: {formatCurrency(user.stats.totalDonations)}
                          </div>
                          <div className="text-gray-500">
                            Won: {formatCurrency(user.stats.totalWinnings)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "banned"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.status === "banned" ? (
                            <>
                              <Ban className="h-3 w-3 mr-1" />
                              Banned
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          )}
                        </span>
                      </td>
                      {userData.isSupperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.isAdmin || false}
                              onChange={() => toggleAdmin(user, user.isAdmin)}
                              className="sr-only peer"
                            />
                            <div
                              className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-300
      peer-checked:bg-blue-600 relative transition-colors"
                            >
                              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow"></span>
                            </div>
                          </label>
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id, user.status)
                            }
                            className={
                              user.status === "banned"
                                ? "text-green-600 hover:text-green-900"
                                : "text-red-600 hover:text-red-900"
                            }
                            title={
                              user.status === "banned"
                                ? "Unban User"
                                : "Ban User"
                            }
                          >
                            {user.status === "banned" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </div>
    </div>
  );
}
