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
  Info,
  DollarSign,
  CheckCircle,
  CreditCard,
  Building2,
  Wallet,
  Send,
  Coins,
  Plus,
  Edit,
  Trash2,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext";
import { collections, db, formatCurrency } from "../firebase/config";
import toast from "react-hot-toast";
import PayoutModal from "../components/Auth/payout-modal";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import PayoutMethods from "../components/Payouts/payment-methods";
import { nbaTeams, nflTeams, cfbTeams } from "../constant";
import axios from "axios";

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
  const [showPayoutMethods, setShowPayoutMethods] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [defaultPayoutMethod, setDefaultPayoutMethod] = useState(null);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState(null);
  const [defaultMethod, setDefaultMethod] = useState(false);
  // const [cfbTeams, setCfbTeams] = useState([]);
  const [cabTeams, setCabTeams] = useState([]);
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
  const [teams, setTeams] = useState({
    NFL: userData?.teams?.NFL ?? "",
    NBA: userData?.teams?.NBA ?? "",
    CFB: userData?.teams?.CFB ?? "",
    NCAAB: userData?.teams?.NCAAB ?? "",
  });
  const loadPayouts = async () => {
    try {
      setLoading(true);

      const payoutsQuery = query(
        collection(db, collections.winners),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(payoutsQuery);
      const payoutsData = [];
      let totalWinnings = 0;
      let pendingAmount = 0;
      let completedAmount = 0;
      let instantAmount = 0;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        payoutsData.push(data);

        const amount = data.prizeAmount || 0;

        // ✅ Totals based on prizeAmount
        totalWinnings += amount;

        if (data.status === "pending_payout") {
          pendingAmount += amount;
        } else if (data.status === "completed") {
          completedAmount += amount;
          if (data.payoutType === "instant" || data.isInstant) {
            instantAmount += amount;
          }
        }
      });

      setPayouts(payoutsData);
      setStats({
        totalWinnings,
        pendingAmount,
        completedAmount,
        instantPayouts: instantAmount,
      });
    } catch (error) {
      console.error("Error loading payouts:", error);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      loadPayouts();
      loadPayoutMethods();
    }
  }, [user]);

  const loadPayoutMethods = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData?.paymentMethods) {
        setPayoutMethods(userData.paymentMethods);
        setDefaultPayoutMethod(userData.defaultPaymentMethod);
        setSelectedPayoutMethod(userData.defaultPaymentMethod);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };
  useEffect(() => {
    loadUserStats();
  }, []);

  useEffect(() => {
    const fetchTop25 = async (sport, league, setter) => {
      try {
        const year = new Date().getFullYear();
        const url = `https://site.web.api.espn.com/apis/fitt/v3/sports/${sport}/${league}/powerindex?season=${year}`;

        const response = await axios.get(url);

        const top25 = response.data.teams
          ?.filter((t) =>
            t.team?.ranks?.items?.some(
              (r) => r.type === "ap" && r.rank?.current <= 25
            )
          )
          .map((team) => {
            const apRank = team.team.ranks.items.find((r) => r.type === "ap");
            return {
              id: team.team.id,
              name: team.team.displayName,
              rank: apRank.rank.current,
            };
          })
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 25);

        setter(top25);
      } catch (err) {
        console.error(`Failed to fetch rankings for ${league}:`, err);
      }
    };

    // fetchTop25("football", "college-football", setCfbTeams);
    fetchTop25("basketball", "mens-college-basketball", setCabTeams);
  }, []);

  const getPayoutMethodIcon = (type) => {
    switch (type) {
      case "ach":
        return Building2;
      case "paypal":
        return DollarSign;
      case "venmo":
        return Wallet;
      case "zelle":
        return Send;
      case "check":
        return Mail;
      case "crypto":
        return Coins;
      default:
        return CreditCard;
    }
  };

  const getPayoutMethodIdentifier = (method, data) => {
    if (!data) return "";

    switch (method) {
      case "paypal":
        return data.email || "";
      case "venmo":
        return data.username || "";
      case "zelle":
        return data.contact || "";
      case "ach":
        return data.account || ""; // could also show last 4 digits only
      case "check":
        return data.name || "";
      case "crypto":
        return data.wallet || "";
      default:
        return "";
    }
  };

  const getPayoutMethodName = (type) => {
    switch (type) {
      case "ach":
        return "Bank Transfer (ACH)";
      case "paypal":
        return "PayPal";
      case "venmo":
        return "Venmo";
      case "zelle":
        return "Zelle";
      case "check":
        return "Paper Check";
      case "crypto":
        return "Cryptocurrency";
      default:
        return "Payment Method";
    }
  };

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
        teams,
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
  // Set default payout method
  const handleSetDefaultPayout = async (methodId) => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        defaultPaymentMethod: methodId,
      });
      setDefaultMethod(methodId);
      toast.success("Default payment method updated");
      window.location.reload();
    } catch (error) {
      console.error("Error setting default method:", error);
      toast.error("Failed to update default method");
    }
  };
  // Delete payout method
  // Delete payout method
  const handleDeleteMethod = async (methodId) => {
    if (
      !window.confirm("Are you sure you want to delete this payment method?")
    ) {
      return;
    }

    try {
      const updatedMethods = userData.paymentMethods.filter(
        (m) => m.id !== methodId
      );

      // Update payment methods first
      await updateUserProfile({
        paymentMethods: updatedMethods,
      });

      // If deleted method was the default, set the first available as new default
      if (
        userData.defaultPaymentMethod === methodId &&
        updatedMethods.length > 0
      ) {
        const newDefault = updatedMethods[0].id;
        await updateDoc(doc(db, "users", user.uid), {
          defaultPaymentMethod: newDefault,
        });
        setDefaultMethod(newDefault);
        toast.success("Default method updated to first available one.");
      }

      toast.success("Payment method deleted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting payout method:", error);
      toast.error("Failed to delete payment method");
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
      const startLink = `https://t.me/${process.env.REACT_APP_TELEGRAM_BOT_USERNAME}?start=${userData?.id}`;
      window.open(startLink, "_blank");
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

  const handleTeamChange = (value, name) => {
    setTeams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    console.log(teams);
  }, [teams]);

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
                      title="Enter your email"
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
                      title="Enter your display name"
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
                      title="Enter your phone number"
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
                  <div className="flex gap-x-3 items-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telegram Username
                    </label>
                    <div title="Enter your Telegram username. After adding it, you’ll be redirected to Telegram. If you have the Telegram desktop app, click 'Start Bot'; otherwise, choose 'Open in Web' to continue.">
                      <Info size={12} />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <AtSign className="h-5 w-5 text-gray-400 mr-2" />
                    {userData?.hasTelegram ? (
                      <input
                        title="your telegram username"
                        type="text"
                        value={userData.telegramUsername}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    ) : (
                      <>
                        <input
                          title="Enter your telegram username"
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
                  {userData?.hasTelegram && !userData?.telegramChatId && (
                    <a
                      target="_blank"
                      className="text-xs text-blue-600 mt-1"
                      href={`https://t.me/${process.env.REACT_APP_TELEGRAM_BOT_USERNAME}?start=${userData?.id}`}
                      rel="noreferrer"
                    >
                      Connect Telegram
                    </a>
                  )}
                  <div className="flex gap-x-3 items-center justify-between mt-2">
                    <label className="text-sm font-medium text-gray-700 mt-2 flex items-center justify-between">
                      Payouts Methods
                    </label>
                    <div
                      onClick={() => editing && setShowPayoutMethods(true)} // only works if editing is true
                      className={`flex items-center text-sm mt-1 cursor-pointer ${
                        editing
                          ? "text-blue-600 hover:underline"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Plus />
                      <span className="ml-1">Add New Method</span>
                    </div>
                  </div>
                  {userData?.paymentMethods?.length > 0 &&
                    userData.paymentMethods.map((method, index) => {
                      const Icon = getPayoutMethodIcon(method.type);
                      const isDefault =
                        userData.defaultPaymentMethod === method.id;

                      return (
                        <div
                          key={index}
                          className="mt-4 p-4 border rounded-lg flex items-center justify-between"
                        >
                          {/* Left side info */}
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium flex items-center">
                                {getPayoutMethodName(method.type)}
                                {isDefault && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {getPayoutMethodIdentifier(
                                  method.type,
                                  method
                                ) || "No details available"}
                              </p>
                            </div>
                          </div>
                          {/* Right side actions */}
                          <div className="flex items-center space-x-3">
                            {!isDefault && (
                              <button
                                onClick={() =>
                                  handleSetDefaultPayout(method.id)
                                }
                                className="text-xs text-green-600 hover:underline"
                                title="Set as Default"
                              >
                                <CheckCircle />
                              </button>
                            )}
                            <button
                              onClick={() => setShowPayoutMethods(true)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              title="Edit Method"
                            >
                              <Edit />
                            </button>
                            <button
                              onClick={() => handleDeleteMethod(method.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              title="Delete Method"
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <p className="text-lg font-medium text-gray-700">
                  Favourite Teams
                </p>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    NFL
                  </label>
                  <select
                    className="w-full border rounded-lg p-2"
                    required
                    onChange={(e) => handleTeamChange(e.target.value, "NFL")}
                    disabled={!editing}
                    value={teams?.NFL}
                  >
                    <option value="">-- Choose --</option>
                    {nflTeams?.map((item, index) => (
                      <option value={item} key={index}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    NBA
                  </label>
                  <select
                    className="w-full border rounded-lg p-2"
                    required
                    onChange={(e) => handleTeamChange(e.target.value, "NBA")}
                    disabled={!editing}
                    value={teams?.NBA}
                  >
                    <option value="">-- Choose --</option>
                    {nbaTeams?.map((item, index) => (
                      <option value={item} key={index}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    NCAAF
                  </label>
                  <select
                    className="w-full border rounded-lg p-2"
                    required
                    onChange={(e) => handleTeamChange(e.target.value, "CFB")}
                    disabled={!editing}
                    value={teams?.CFB}
                  >
                    <option value="">-- Choose --</option>
                    {cfbTeams?.map((item, index) => (
                      <option value={item} key={index}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    NCAAB
                  </label>
                  <select
                    className="w-full border rounded-lg p-2"
                    required
                    onChange={(e) => handleTeamChange(e.target.value, "NCAAB")}
                    disabled={!editing}
                    value={teams?.NCAAB}
                  >
                    <option value="">-- Choose --</option>
                    {Array.isArray(cabTeams) &&
                      cabTeams?.length > 0 &&
                      cabTeams?.map((item, index) => (
                        <option value={item?.name} key={index}>
                          {item?.name}
                        </option>
                      ))}
                  </select>
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
                    title="Enter your email"
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
                      title="Enter your telegram preference"
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
                  {/* <input
                    title="Enter your sms preference"
                    type="checkbox"
                    disabled
                    className="h-5 w-5 text-gray-300 rounded"
                  /> */}
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
                when they sign up!{" "}
                <a
                  href={`mailto:?subject=Join%20Square%20Trivia!&body=Hey!%0A%0AUse%20my%20referral%20code%20(${userData?.referralCode})%20to%20sign%20up%20on%20Square%20Trivia.%0A%0AClick%20here%20to%20register:%20https://squaretrivia.com/register?ref=${userData?.referralCode}%0A%0ALet's%20play%20and%20earn%20together!`}
                  className="text-blue-600 underline mt-3 inline-block"
                >
                  Invite via Email
                </a>
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
                    <p className="text-sm text-gray-600">Contest Wins:</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.totalWins || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">
                      Board Championships:
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.totalWins || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Win Rate: </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getWinRate()}%
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Total Won:</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats?.totalPrizeAmount || 0)}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">Average Speed:</p>
                    <p className="text-2xl font-bold">
                      {stats?.averageAnswerTime?.toFixed(2) || "0.00"}s
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">Fastest Time:</p>
                    <p className="text-2xl font-bold">
                      {stats?.fastestAnswerTime?.toFixed(2) || "0.00"}s
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
      {/* Payment Methods Modal */}
      {showPayoutMethods && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowPayoutMethods(false);
            window.location.reload();
          }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Payment Methods
              </h3>
              <button
                onClick={() => {
                  setShowPayoutMethods(false);
                  window.location.reload();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                X{/* <X className="h-5 w-5" /> */}
              </button>
            </div>

            <div className="p-6">
              <PayoutMethods
                embedded={true}
                onMethodSelect={() => {
                  loadPayoutMethods();
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
