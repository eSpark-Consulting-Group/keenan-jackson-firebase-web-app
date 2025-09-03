import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  CreditCard,
  FileText,
  Info,
  ChevronRight,
  ExternalLink,
  XCircle,
  Settings,
  Building2,
  Mail,
  Wallet,
  Send,
  Coins,
} from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";
import {
  db,
  collections,
  formatCurrency,
  callFunction,
} from "../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
// import PayoutMethods from "../components/PayoutMethods";
import { useAuth } from "../contexts/authcontext";
import PayoutMethods from "../components/Payouts/payment-methods";
import jsPDF from "jspdf";

export default function Payouts() {
  const { user, userData } = useAuth();
  const [payouts, setPayouts] = useState([]);
  console.log("payouts:", payouts);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed, failed, processing
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showInstantPayoutModal, setShowInstantPayoutModal] = useState(false);
  const [processingInstant, setProcessingInstant] = useState(false);
  const [showPayoutMethods, setShowPayoutMethods] = useState(false);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [defaultPayoutMethod, setDefaultPayoutMethod] = useState(null);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const generatePDF = () => {
    const creationDate = new Date().toLocaleDateString();
    const taxYear = new Date().getFullYear();

    const doc = new jsPDF();

    // Header / Title
    doc.setFontSize(20);
    doc.text("TAX CERTIFICATE", 105, 20, { align: "center" });

    // Issuer Info
    doc.setFontSize(10);
    doc.text("Issued By: Square Trivia.", 20, 30);
    doc.text("1234 Business Ave, Suite 200, New York, NY 10001", 20, 36);
    doc.text("support@fantasysports.com | +1 (800) 123-4567", 20, 42);

    // Tax Year & Issue Date
    doc.setFontSize(12);
    doc.text(`Issued On: ${creationDate}`, 150, 30);
    doc.text(`Tax Year: ${taxYear}`, 150, 38);

    // Divider
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    // Taxpayer Info
    doc.setFontSize(14);
    doc.text("Taxpayer Information", 20, 60);

    doc.setFontSize(12);
    doc.text(`Full Name: ${userData.taxInfo?.fullName || "N/A"}`, 20, 70);
    doc.text(`Address: ${userData.taxInfo?.address || "N/A"}`, 20, 78);
    doc.text(
      `SSN (Last 4 Digits): ${userData.taxInfo?.ssn_last4 || "XXXX"}`,
      20,
      86
    );

    // Earnings
    doc.setFontSize(14);
    doc.text("Earnings Summary", 20, 105);

    doc.setFontSize(12);
    doc.text(
      `Total Annual Winnings: $${userData.taxInfo?.total_annual_winnings || 0}`,
      20,
      115
    );
    doc.text(
      `W-9 Submitted: ${userData.taxInfo?.w9_submitted ? "Yes" : "No"}`,
      20,
      123
    );

    // Sample Text / Explanation
    doc.setFontSize(11);
    const sampleText =
      "This certificate confirms the total annual winnings received by the taxpayer during the stated tax year. " +
      "If total winnings exceed $600, they will be reported to the IRS in accordance with federal regulations. " +
      "The information contained herein is based on the records available in our system. " +
      "Please consult your tax advisor for additional guidance regarding your personal tax obligations.";
    doc.text(sampleText, 20, 145, { maxWidth: 170, align: "justify" });

    // Signature Line
    doc.setFontSize(12);
    doc.text("Authorized Representative:", 20, 200);
    doc.line(80, 198, 150, 198); // signature line
    doc.text("Square Trivia.", 80, 205);

    // Footer Disclaimer
    doc.setFontSize(9);
    doc.text(
      "This is a system-generated tax certificate. No manual signature is required.",
      105,
      285,
      { align: "center" }
    );

    // Save PDF
    doc.save(`Tax-Certificate-${taxYear}.pdf`);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  const [stats, setStats] = useState({
    totalWinnings: 0,
    pendingAmount: 0,
    completedAmount: 0,
    instantPayouts: 0,
  });
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

  const handleInstantPayout = async (payout) => {
    if (!payoutMethods || payoutMethods.length === 0) {
      toast.error("Please add a payment method first");
      setShowPayoutMethods(true);
      return;
    }

    try {
      // ✅ Update in Firestore
      await updateDoc(doc(db, collections.winners, payout.id), {
        payoutType: "instant",
      });

      // ✅ Update local state
      const updatedPayout = { ...payout, payoutType: "instant" };
      setSelectedPayout(updatedPayout);
      setPayouts((prev) =>
        prev.map((p) => (p.id === payout.id ? updatedPayout : p))
      );

      // ✅ Open modal
      setShowInstantPayoutModal(true);
    } catch (error) {
      console.error("Error updating payoutType:", error);
      toast.error("Failed to set payout as instant");
    }
  };

  const confirmInstantPayout = async () => {
    if (!selectedPayout || !selectedPayoutMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setProcessingInstant(true);

    try {
      // Call cloud function to process instant payout
      const response = await callFunction("processInstantPayout", {
        payoutId: selectedPayout.id,
        userId: user.uid,
        payoutMethodId: selectedPayoutMethod,
      });

      if (response.data.success) {
        toast.success(
          "Instant payout processed! Funds will arrive within minutes."
        );

        // Update local state
        const updatedPayouts = payouts.map((p) =>
          p.id === selectedPayout.id
            ? {
                ...p,
                status: "processing",
                isInstant: true,
                instantFee: response.data.fee,
                payoutMethodId: selectedPayoutMethod,
              }
            : p
        );
        setPayouts(updatedPayouts);

        // Reload data
        await loadPayouts();
      } else {
        toast.error(response.data.error || "Failed to process instant payout");
      }
    } catch (error) {
      console.error("Error processing instant payout:", error);
      toast.error("Failed to process instant payout");
    } finally {
      setProcessingInstant(false);
      setShowInstantPayoutModal(false);
      setSelectedPayout(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending_payout":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "processing":
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        );
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_payout":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getPayouttypeColor = (status) => {
    switch (status) {
      case "instant":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const filteredPayouts = payouts.filter((payout) => {
    if (filter === "all") return true;
    if (filter === "pending") return payout.status === "pending_payout";
    if (filter === "completed") return payout.status === "completed";
    if (filter === "processing") return payout.status === "processing";
    if (filter === "failed") return payout.status === "failed";
    return true;
  });

  const getPayoutMethodIcon = (type) => {
    switch (type) {
      case "ach":
        return Building2;
      case "paypal":
        return DollarSign;
      case "venmo":
        return Wallet; // suggested icon
      case "zelle":
        return Send; // suggested icon
      case "check":
        return Mail;
      case "crypto":
        return Coins; // suggested icon
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

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Payouts
              </h1>
              <p className="text-gray-600">
                View your winnings and manage payouts
              </p>
            </div>
            <button
              onClick={() => setShowPayoutMethods(true)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-5 w-5 mr-2 text-gray-500" />
              Payment Methods
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">All Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalWinnings)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Winnings</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Awaiting Payout</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Completed</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.completedAmount)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Paid Out</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Instant</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.instantPayouts}
            </div>
            <p className="text-sm text-gray-600 mt-1">Instant Payouts</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All ({payouts.length})
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Pending (
                  {payouts.filter((p) => p.status === "pending_payout").length})
                </button>
                <button
                  onClick={() => setFilter("processing")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "processing"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Processing (
                  {payouts.filter((p) => p.status === "processing").length})
                </button>
                <button
                  onClick={() => setFilter("failed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "failed"
                      ? "bg-red-100 text-red-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Failed (
                  {payouts.filter((p) => p.status === "failed").length})
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "completed"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Completed (
                  {payouts.filter((p) => p.status === "completed").length}
                  )
                </button>
              </div>
            </div>

            {stats.totalWinnings >= 600 && (
              <button
                onClick={generatePDF}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <FileText className="h-4 w-4 mr-1" />
                Tax Documents
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Payouts List */}
        {filteredPayouts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {filteredPayouts.map((payout, index) => (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between">
                  {/* LEFT SIDE INFO */}
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(payout.status)}
                      <h3 className="ml-3 text-xxl font-bold text-gray-900">
                        {formatCurrency(payout.prizeAmount || 0)}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div className="ml-8 space-b-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-bold text-lg">
                            {`${payout?.gameInfo?.teams?.away || "TBA"} @ ${
                              payout?.gameInfo?.teams?.home || "TBA"
                            }`}
                          </span>
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Solo Win:</span>{" "}
                          {payout.isSoloWin ? "Yes ✅" : "No"}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Tier:</span>{" "}
                          {payout.tierId?.split("_")[1] || "N/A"}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Dated:</span>{" "}
                          {formatDate(payout.createdAt)}
                        </p>
                      </div>
                      <div className="ml-8 space-b-1  ">
                        <p className="text-sm mb-3">
                          <span className="font-semibold"> Status:</span>{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(
                              payout.status
                            )}`}
                          >
                            {payout.status === "pending_payout"
                              ? "Pending"
                              : payout.status}
                          </span>
                        </p>
                        <p className="text-sm mb-2">
                          <span className="font-semibold"> Payout Type: </span>{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${getPayouttypeColor(
                              payout.payoutType
                            )}`}
                          >
                            {payout.payoutType ? payout.payoutType : "Standard"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <div className="mt-3 ml-8">
                      <button
                        onClick={() => toggleExpand(payout.id)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {expandedId === payout.id ? (
                          <>
                            Hide Details <ChevronUp className="ml-1 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            More Details{" "}
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </button>

                      {/* Collapsible Content */}
                      {expandedId === payout.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.35 }}
                          className="mt-3 pl-3 border-l-2 border-gray-200"
                        >
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Game ID:</span>{" "}
                              {payout.gameId || "N/A"}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">User ID:</span>{" "}
                              {payout.userId}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Claim ID:</span>{" "}
                              {payout.claimId || "Not claimed yet"}
                            </p>

                            <p className="text-sm text-gray-700 col-span-2">
                              <span className="font-semibold">
                                Notification Status:
                              </span>{" "}
                              {payout.notificationStatus || "N/A"}
                            </p>

                            {payout.notificationErrors?.length > 0 && (
                              <div className="col-span-2 flex items-start bg-red-50 text-red-700 border border-red-200 rounded-lg p-2">
                                <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                                <span className="text-sm">
                                  {payout.notificationErrors.join(", ")}
                                </span>
                              </div>
                            )}

                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">
                                Reported on 1099:
                              </span>{" "}
                              {payout.reportedOn1099 ? "Yes" : "No"}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">
                                Winner Answer Time:
                              </span>{" "}
                              {payout.answerTime} ms
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">
                                Instant Payout Fee:
                              </span>{" "}
                              {payout.instantPayoutFee
                                ? "Granted"
                                : "Not Granted"}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">
                                Consolation Square:
                              </span>{" "}
                              {payout.consolationSquareGranted
                                ? "Granted"
                                : "Not Granted"}
                            </p>

                            {payout.processedBy && (
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">
                                  Processed By:
                                </span>{" "}
                                {payout.processedBy}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE ACTIONS */}
                  <div className="ml-6 flex flex-col items-end gap-2">
                    {/* {payout.status === "pending_payout" && ( */}
                    <button
                      onClick={() => handleInstantPayout(payout)}
                      disabled={
                        payout.payoutType === "instant" ||
                        payout.status !== "pending_payout"
                      }
                      className={`flex items-center px-4 py-2 rounded-xl shadow transition-colors ${
                        payout.payoutType === "instant"
                          ? "bg-gray-300 cursor-not-allowed text-gray-600"
                          : payout.status !== "pending_payout"
                            ? "bg-gray-300 cursor-not-allowed text-gray-600"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {payout.payoutType === "instant"
                        ? "Already Requested for Payout"
                        : payout.status !== "pending_payout"
                          ? "Get Instant Not Available Now"
                          : "Get Instant Paid"}
                    </button>

                    {/* )} */}

                    {payout.status === "completed" && (
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === "all" ? "No Payouts Yet" : `No ${filter} payouts`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === "all"
                ? "Start playing games to win prizes!"
                : `You don't have any ${filter} payouts`}
            </p>
            {filter === "all" && (
              <Link
                to="/games"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Games
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </motion.div>
        )}

        {/* Standard Payout Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-blue-50 rounded-lg p-6"
        >
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Payout Information
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>
                  • Standard payouts are processed within 2-3 business days
                  (100% of prize)
                </li>
                <li>
                  • Instant payouts available for pending winnings (96% of
                  prize, 4% convenience fee)
                </li>
                <li>
                  • Payouts sent via your preferred method (ACH, PayPal, or
                  check)
                </li>
                <li>
                  • Tax forms (W-9/1099) required for annual winnings over $600
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Instant Payout Modal */}
        {showInstantPayoutModal && selectedPayout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInstantPayoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Request Instant Payout
                </h3>
                <p className="text-gray-600">
                  Get your winnings today with a small convenience fee
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prize Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedPayout.prizeAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Instant Fee (4%):</span>
                    <span className="text-red-600">
                      -{formatCurrency(selectedPayout.prizeAmount * 0.04)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">You'll Receive:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(selectedPayout.prizeAmount * 0.96)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              {payoutMethods.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Method
                  </label>
                  <div className="space-y-2">
                    {payoutMethods.map((method) => {
                      const Icon = getPayoutMethodIcon(method.type);
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPayoutMethod === method.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payoutMethod"
                            value={method.id}
                            checked={selectedPayoutMethod === method.id}
                            onChange={(e) =>
                              setSelectedPayoutMethod(e.target.value)
                            }
                            className="sr-only"
                            placeholder="Select payout method"
                          />
                          <Icon
                            className={`h-5 w-5 mr-3 ${
                              selectedPayoutMethod === method.id
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {getPayoutMethodName(method.type)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getPayoutMethodIdentifier(method.type, method) ||
                                "No details available"}
                            </p>
                          </div>
                          {method.id === defaultPayoutMethod && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 mb-6">
                <p className="mb-2">
                  <strong>Instant:</strong> Receive funds within 30 minutes
                </p>
                <p>
                  <strong>Standard:</strong> Wait 2-3 days for full amount (
                  {formatCurrency(selectedPayout.amount)})
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInstantPayoutModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmInstantPayout}
                  disabled={processingInstant}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processingInstant ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Get Instant Payout
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Payment Methods Modal */}
        {showPayoutMethods && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPayoutMethods(false)}
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
                  onClick={() => setShowPayoutMethods(false)}
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
    </div>
  );
}
