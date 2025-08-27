import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Trophy,
  Brain,
  CheckCircle,
  Ban,
  Mail,
  XCircle,
} from "lucide-react";
import { db, collections, formatCurrency } from "../../firebase/config";
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  updateDoc,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AdminUserDetails() {
  const path = window.location.pathname;
  const id = path.substring(path.lastIndexOf("/") + 1);
  // const { id } = useParams(); // /admin/users/:id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (id) {
      loadUser(id);
    }
  }, [id]);

  const loadUser = async (userId) => {
    try {
      setLoading(true);

      // Fetch user doc
      const userDoc = await getDoc(doc(db, collections.users, userId));
      if (!userDoc.exists()) {
        toast.error("User not found");
        navigate("/admin/users");
        return;
      }
      const userData = { id: userDoc.id, ...userDoc.data() };

      // Fetch stats
      const [donations, wins, squares] = await Promise.all([
        getDocs(
          query(collection(db, collections.donations), where("userId", "==", userId))
        ),
        getDocs(
          query(collection(db, collections.winners), where("userId", "==", userId))
        ),
        getDocs(
          query(collection(db, collections.squareClaims), where("userId", "==", userId))
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

      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error("Failed to load user");
      setLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "banned" ? "active" : "banned";
    const action = newStatus === "banned" ? "ban" : "unban";

    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await updateDoc(doc(db, collections.users, user.id), {
        status: newStatus,
        [`${action}Date`]: new Date(),
        [`${action}Reason`]:
          prompt(`Please provide a reason for ${action}ning:`) || "Admin action",
      });

      toast.success(`User ${action}ned successfully`);
      loadUser(user.id);
    } catch (error) {
      console.error(`Error ${action}ning user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">User Details</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Basic Info */}
        <div className="mb-8">
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
              <p>
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
        <div className="mb-8">
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
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Account Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span>{user.createdAt?.toDate?.().toLocaleString() || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Active</span>
              <span>{user.lastActive?.toDate?.().toLocaleString() || "Unknown"}</span>
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
            onClick={toggleUserStatus}
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
            onClick={() => (window.location.href = `mailto:${user.email}`)}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
