import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Trophy,
  Timer,
  Shield,
  Bell,
  Edit2,
  Check,
  X,
  Gift,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext";
import { formatCurrency } from "../firebase/config";
import toast from "react-hot-toast";

export default function Profile() {
  const {
    user,
    userData,
    updateUserProfile,
    addTelegramToAccount,
    getUserStats,
  } = useAuth();
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [addingTelegram, setAddingTelegram] = useState(false);

  const [formData, setFormData] = useState({
    displayName: userData?.displayName || "",
    phone: userData?.phone || "",
    telegramUsername: userData?.telegramUsername || "",
    notifications: {
      email: userData?.notifications?.email ?? true,
      telegram: userData?.notifications?.telegram ?? true,
      sms: userData?.notifications?.sms ?? false,
    },
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoadingStats(true);
      const userStats = await getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;

    if (name.startsWith("notifications.")) {
      const notificationType = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationType]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    setSavingProfile(true);

    try {
      await updateUserProfile({
        displayName: formData.displayName,
        phone: formData.phone,
        notifications: formData.notifications,
      });

      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddTelegram = async () => {
    if (!formData.telegramUsername) {
      toast.error("Please enter your Telegram username");
      return;
    }

    setAddingTelegram(true);

    try {
      await addTelegramToAccount(formData.telegramUsername);
      toast.success(
        "Telegram added successfully! You now get 10 daily attempts!"
      );
    } catch (error) {
      console.error("Error adding Telegram:", error);
      toast.error(error.message || "Failed to add Telegram");
    } finally {
      setAddingTelegram(false);
    }
  };

  const getWinRate = () => {
    if (!stats || stats.totalSquares === 0) return 0;
    return ((stats.totalWins / stats.totalSquares) * 100).toFixed(1);
  };

  const getSkillRank = () => {
    const avgTime = stats?.averageAnswerTime || 0;
    if (avgTime === 0) return "Unranked";
    if (avgTime < 2) return "Lightning";
    if (avgTime < 3) return "Expert";
    if (avgTime < 4) return "Skilled";
    if (avgTime < 5) return "Intermediate";
    return "Beginner";
  };

  const getSkillColor = () => {
    const rank = getSkillRank();
    switch (rank) {
      case "Lightning":
        return "text-purple-600";
      case "Expert":
        return "text-blue-600";
      case "Skilled":
        return "text-green-600";
      case "Intermediate":
        return "text-yellow-600";
      case "Beginner":
        return "text-gray-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and view your statistics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Basic Information
                </h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={savingProfile}
                      className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <div className="spinner mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          displayName: userData?.displayName || "",
                          phone: userData?.phone || "",
                          telegramUsername: userData?.telegramUsername || "",
                          notifications: userData?.notifications || {
                            email: true,
                            telegram: true,
                            sms: false,
                          },
                        });
                      }}
                      className="flex items-center px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Your name"
                      className={`
                        flex-1 px-3 py-2 border rounded-md
                        ${
                          editing
                            ? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            : "border-gray-300 bg-gray-50"
                        }
                      `}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="+1234567890"
                      className={`
                        flex-1 px-3 py-2 border rounded-md
                        ${
                          editing
                            ? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            : "border-gray-300 bg-gray-50"
                        }
                      `}
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram Username
                  </label>
                  <div className="flex items-center">
                    <AtSign className="h-5 w-5 text-gray-400 mr-2" />
                    {userData?.hasTelegram ? (
                      <input
                        type="text"
                        value={userData.telegramUsername}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          name="telegramUsername"
                          value={formData.telegramUsername}
                          onChange={handleChange}
                          placeholder="username"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleAddTelegram}
                          disabled={
                            addingTelegram || !formData.telegramUsername
                          }
                          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 hover:text-white"
                        >
                          {addingTelegram ? "Adding..." : "Add"}
                        </button>
                      </>
                    )}
                  </div>
                  {!userData?.hasTelegram && (
                    <p className="text-xs text-blue-600 mt-1">
                      Add Telegram to get 10 daily attempts instead of 5!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold flex items-center mb-6">
                <Bell className="h-5 w-5 mr-2 text-gray-600" />
                Notification Preferences
              </h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">
                        Receive game updates and win notifications
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="notifications.email"
                    checked={formData.notifications.email}
                    onChange={handleChange}
                    disabled={!editing}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                {userData?.hasTelegram && (
                  <label className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AtSign className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">Telegram Notifications</p>
                        <p className="text-sm text-gray-500">
                          Instant notifications in Telegram
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      name="notifications.telegram"
                      checked={formData.notifications.telegram}
                      onChange={handleChange}
                      disabled={!editing}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                )}

                <label className="flex items-center justify-between opacity-50">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled
                    className="h-5 w-5 text-gray-300 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Referral Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold flex items-center mb-6">
                <Gift className="h-5 w-5 mr-2 text-gray-600" />
                Referral Program
              </h2>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 mb-2">
                  Your Referral Code:
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-blue-600">
                    {userData?.referralCode || "LOADING"}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        userData?.referralCode || ""
                      );
                      toast.success("Referral code copied!");
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm hover:text-white"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Share your code with friends and you'll both receive benefits
                when they sign up!
              </p>
            </div>
          </motion.div>

          {/* Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Performance Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold flex items-center mb-6">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Performance Stats
              </h2>

              {loadingStats ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Squares</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalSquares || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Wins</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.totalWins || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getWinRate()}%
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Total Winnings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats?.totalPrizeAmount || 0)}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">Average Answer Time</p>
                    <p className="text-2xl font-bold">
                      {stats?.averageAnswerTime?.toFixed(1) || "0.0"}s
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Skill Rank</p>
                    <p className={`text-2xl font-bold ${getSkillColor()}`}>
                      {getSkillRank()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Attempts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold flex items-center mb-4">
                <Timer className="h-5 w-5 mr-2 text-purple-600" />
                Daily Attempts
              </h2>

              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {userData?.dailyTriviaAttempts || 0} /{" "}
                  {userData?.hasTelegram ? 10 : 5}
                </p>
                <p className="text-sm text-gray-600 mt-2">Used today</p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${((userData?.dailyTriviaAttempts || 0) / (userData?.hasTelegram ? 10 : 5)) * 100}%`,
                  }}
                />
              </div>

              {!userData?.hasTelegram && (
                <div className="mt-4 bg-purple-50 rounded-md p-3 text-sm text-purple-800">
                  <p className="font-medium">Double your daily attempts!</p>
                  <p>Add Telegram above to get 10 attempts per day</p>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold flex items-center mb-4">
                <Shield className="h-5 w-5 mr-2 text-gray-600" />
                Account Info
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {userData?.createdAt?.toDate?.().toLocaleDateString() ||
                      "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">User ID</span>
                  <span className="font-mono text-xs">
                    {user?.uid?.slice(-8) || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
