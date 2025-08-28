import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  db,
  collections,
  formatCurrency,
  INSTANT_PAYOUT_FEE,
} from "../../firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Clock,
  CheckCircle,
  XCircle,
  Send,
  ArrowLeft,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPayoutSingle() {
  const path = window.location.pathname;
  const id = path.substring(path.lastIndexOf("/") + 1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payout, setPayout] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPayout();
  }, [id]);

  const loadPayout = async () => {
    try {
      setLoading(true);

      const payoutRef = doc(db, collections.winners, id);
      const payoutSnap = await getDoc(payoutRef);

      if (!payoutSnap.exists()) {
        toast.error("Payout not found");
        navigate("/admin/payouts");
        return;
      }

      const payoutData = { id: payoutSnap.id, ...payoutSnap.data() };
      setPayout(payoutData);

      if (payoutData.userId) {
        const userRef = doc(db, collections.users, payoutData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser({ id: userSnap.id, ...userSnap.data() });
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading payout:", error);
      toast.error("Failed to load payout");
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
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

      await updateDoc(doc(db, collections.winners, id), updateData);

      toast.success(`Payout marked as ${newStatus}`);
      loadPayout();
    } catch (error) {
      console.error("Error updating payout:", error);
      toast.error("Failed to update payout");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_payout: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
      processing: { color: "bg-blue-100 text-blue-800", icon: Send, label: "Processing" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Completed" },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Failed" },
    };

    const badge = badges[status] || badges.pending_payout;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {badge.label}
      </span>
    );
  };
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
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Payout not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payout Details
            </h1>
            <p className="text-gray-600 mt-1">ID: {payout.id}</p>
          </div>
          <button
            onClick={() => navigate("/admin/payouts")}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Status */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Status
            </h2>
            {getStatusBadge(payout.status)}
          </div>
          {/* Status */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Payout Type
            </h2>
            {getPayoutTypeBadge(payout.payoutType)}
          </div>
          {/* Amount & Type */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Amount
            </h2>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(payout.prizeAmount)}
            </p>
            {payout.type === "instant" && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <Zap className="h-4 w-4 mr-1 text-yellow-600" />
                Instant payout (Fee:{" "}
                {formatCurrency(payout.amount * INSTANT_PAYOUT_FEE)})
              </p>
            )}
          </div>

          {/* Dates */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Dates
            </h2>
            <ul className="space-y-1 text-gray-700 text-sm">
              <li>
                <strong>Created:</strong>{" "}
                {payout.createdAt?.toDate?.().toLocaleString()}
              </li>
              {payout.processingStartedAt && (
                <li>
                  <strong>Processing Started:</strong>{" "}
                  {payout.processingStartedAt?.toDate?.().toLocaleString()}
                </li>
              )}
              {payout.completedAt && (
                <li>
                  <strong>Completed:</strong>{" "}
                  {payout.completedAt?.toDate?.().toLocaleString()}
                </li>
              )}
            </ul>
          </div>

          {/* User */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              User
            </h2>
            {user ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {user.displayName || "Unknown User"}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <a
                  href={`/admin/users/${user.id}`}
                  className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                >
                  View User Profile
                </a>
              </div>
            ) : (
              <p className="text-gray-600">No user info available</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {payout.status === "pending_payout" && (
              <>
                <button
                  onClick={() => updateStatus("processing")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Processing
                </button>
                <button
                  onClick={() => updateStatus("failed")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Mark as Failed
                </button>
              </>
            )}
            {payout.status === "processing" && (
              <>
              <button
                onClick={() => updateStatus("completed")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark as Completed
              </button>
                  <button
                  onClick={() => updateStatus("failed")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Mark as Failed
                </button> 
              </>
            )}
            {payout.status === "failed" && (
              <>
              <button
                  onClick={() => updateStatus("processing")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Processing Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
