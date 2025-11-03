import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Check,
  TrendingUp,
  Trophy,
  Zap,
  Star,
  Crown,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/authcontext";
import { useNotification } from "../../contexts/notificationcontext";
import { callFunction } from "../../firebase/config";
import toast from "react-hot-toast";
import RestrictedAlert from "../restricted-alert";

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Board configurations
const TIERS = {
  tier_25: {
    id: "tier_25",
    amount: 25,
    name: "$25 Board",
    title:'Starter Board',
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-500",
    icon: Check,
    prizePerQuarter: 200,
    totalPrize: 1000,
    payoutPercentage: 64,
    features: [
      "Entry for all 4 quarters",
      "$200 Prize per Quarter",
      "$200 Prize for Board Champion",
      "Great for first-time players learning the system",
      "1 consolation trivia question included  ",
      "50 squares available",
      "Skill-based competition",
    ],
    availability: ["regular", "playoff", "championship"],
  },
  tier_50: {
    id: "tier_50",
    amount: 50,
    name: "$50 Board",
    title:'Competitive Board',
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-500",
    icon: TrendingUp,
    prizePerQuarter: 450,
    totalPrize: 2250,
    payoutPercentage: 64,
    features: [
      "Entry for all 4 quarters",
      "$450 Prize per Quarter",
      "$450 Prize for Board Champion",
      "50 squares available",
      "Perfect balance of risk and reward ",
      "1 consolation trivia question included ",
      "Higher stakes competition",
    ],
    availability: ["regular", "playoff", "championship"],
  },
  tier_100: {
    id: "tier_100",
    amount: 100,
    name: "$100 Board",
    title:'Popular Board',
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-500",
    icon: Trophy,
    prizePerQuarter: 900,
    totalPrize: 4500,
    payoutPercentage: 64,
    features: [
      "Entry for all 4 quarters",
      "$900 Prize per Quarter",
      "$900 Prize for Board Champion",
      "50 squares available",
      "Most popular tier — big wins at an accessible entry point",

      "1 consolation trivia question included ",
      "Premium competition",
    ],
    availability: ["regular", "playoff", "championship"],
  },
  tier_250: {
    id: "tier_250",
    amount: 250,
    name: "$250 Board",
    title:'High Stakes Board',
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-500",
    icon: Zap,
    prizePerQuarter: 2250,
    totalPrize: 11250,
    payoutPercentage: 72,
    features: [
      "Entry for all 4 quarters",
      "$2,250 Prize per Quarter",
      "$2,250 Prize for Board Champion",
      "50 squares available",
      "Elite competition",
      "Strong payouts for mid- to high-level players",
      "2 consolation trivia questions included ",
      "Playoff games only",
    ],
    availability: ["playoff", "championship"],
  },
  tier_500: {
    id: "tier_500",
    amount: 500,
    name: "$500 Board",
    title:'Elite Board',
    color: "from-indigo-500 to-purple-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-500",
    icon: Star,
    prizePerQuarter: 4500,
    totalPrize: 22500,
    payoutPercentage: 72,
    features: [
      "Entry for all 4 quarters",
      "$4,500 Prize per Quarter",
      "$4,500 Prize for Board Champion",
      "50 squares available",
      "High roller competition",
      "For serious competitors chasing large wins",
      "2 consolation trivia questions included ",
      "Playoff games only",
    ],
    availability: ["playoff", "championship"],
  },
  tier_1000: {
    id: "tier_1000",
    amount: 1000,
    name: "$1000 Board",
    title:'Championship Board',
    color: "from-yellow-500 to-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-500",
    icon: Crown,
    prizePerQuarter: 9000,
    totalPrize: 45000,
    payoutPercentage: 72,
    features: [
      "Entry for all 4 quarters",
      "$9,000 Prize per Quarter",
      "$9,000 Prize for Board Champion",
      "50 squares available",
      "Championship exclusive",
      "Highest tier with massive guaranteed payouts ",
      "3 consolation trivia questions included ",
      "Ultimate competition",
    ],
    availability: ["championship"],
  },
};

export default function TierSelection({
  gameId,
  gameType = "championship",
  onTierSelect,
}) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [boardData, setBoardData] = useState({});
  const { user, userData } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Get available board based on game type
  const availableTiers = Object.values(TIERS).filter((tier) =>
    tier.availability.includes(gameType)
  );

  // Fetch board data for availability
  useEffect(() => {
    if (gameId) {
      fetchBoardData();
    }
  }, [gameId]);

  const eligibility =
    JSON.parse(localStorage.getItem("squareTrivia_eligibility") || "{}") || {};

   const isRestricted = eligibility?.status === "restricted";
console.log("Eligibility Status:", isRestricted);
  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const response = await callFunction("getBoardData", { gameId });
      setBoardData(response.data || {});
    } catch (error) {
      console.error("Error fetching board data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTierSelection = (tier) => {
    if (!user) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    setSelectedTier(tier);
  };

  const processPayment = async () => {
  if (!selectedTier) return;

  if (!user) {
    toast.error("Please login to continue");
    navigate("/login");
    return;
  }

  if (isRestricted) {
    toast.error("You are not eligible to enter paid contests.");
    setProcessing(false); // ✅ Make sure processing is false
    navigate("/restricted");
    return; // ✅ Prevent further code execution
  }

  setProcessing(true);
  const loadingToast = toast.loading("Preparing secure checkout...");

  try {
    // Create Stripe checkout session
    const { sessionId, url } = await callFunction("createCheckoutSession", {
      tierId: selectedTier.id,
      tierAmount: selectedTier.amount,
      gameId: gameId,
      userId: user.uid,
      userEmail: user.email,
      successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/payment-cancel`,
    });

    toast.dismiss(loadingToast);

    if (url) {
      window.location.href = url;
    } else if (sessionId) {
      const stripe = await loadStripe(
        process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
      );
      const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
          toast.error(error.message);
        }
      } else {
        toast.error("Could not start checkout session");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
      // showNotification({
      //   type: 'error',
      //   message: 'Payment processing failed'
      // });
    } finally {
      toast.dismiss(loadingToast);
      setProcessing(false);
    }
  };

  // Get squares available for each board
  const getSquaresAvailable = (tierId) => {
    const tierBoard = boardData[tierId] || {};
    const claimedSquares = Object.keys(tierBoard).length;
    return 50 - claimedSquares;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 ">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Square Trivia Boards
        </h2>
        <p className="text-lg text-gray-600">
          5 Winners Every Game – 1 Board Champion + 4 Quarter Winner
          <br />
          Win by knowledge and speed. No fees. Guaranteed payouts.
        </p>
        <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>NO FEES on winnings • Instant payouts available</span>
        </div>
      </div>

      {/* Board Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {availableTiers.map((tier) => {
          const Icon = tier.icon;
          const squaresAvailable = getSquaresAvailable(tier.id);
          const isSelected = selectedTier?.id === tier.id;
          const isSoldOut = squaresAvailable === 0;

          return (
            <div
              key={tier.id}
              className={`relative rounded-lg border-2 transition-all cursor-pointer box-shadow-md
                ${isSelected ? `${tier.borderColor} ${tier.bgColor}` : "border-gray-200 hover:border-gray-300 bg-white "}
                ${isSoldOut ? "opacity-60 cursor-not-allowed" : ""}
              `}
              onClick={() => !isSoldOut && handleTierSelection(tier)}
            >
              {/* Popular badge for $50 board */}
              {tier.id === "tier_50" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Sold out badge */}
              {isSoldOut && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    SOLD OUT
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${tier.color}`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="ml-3 text-xl font-bold text-gray-900">
                      {tier.title}
                    </h3>
                  </div>
                  {isSelected && (
                    <div className="bg-blue-600 rounded-full p-1">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Entry amount */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    ${tier.amount}
                  </div>
                  <div className="text-sm text-gray-500">One-time entry</div>
                </div>

                {/* Prize info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      Prize per Quarter:
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${tier.prizePerQuarter.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total prizes:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${tier.totalPrize.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Squares available */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Squares available:
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        squaresAvailable < 10 ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {squaresAvailable}/50
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {selectedTier && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg md:relative md:shadow-none md:border-0 md:p-0">
          <RestrictedAlert/>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600">Selected board:</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedTier.name} - ${selectedTier.amount}
              </p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                onClick={() => setSelectedTier(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Change Board
              </button>
              <button
                onClick={processPayment}
                disabled={processing}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center hover:text-white"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          How It Works
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            Choose Your entry board based on your budget and desired prize level
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            Answer trivia questions to earn squares on the game board
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            Fastest correct answers win squares - pure skill, no luck!
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            Win prizes when your squares match quarterly scores
          </li>
        </ul>
        <p className="mt-4 text-xs text-gray-500">
          * {TIERS.tier_25.payoutPercentage}% of entries go to prizes for
          $25-$100 boards,
          {TIERS.tier_250.payoutPercentage}% for higher boards. Instant payouts
          available with 96% payout or wait 2-3 days for 100%.
        </p>
      </div>
    </div>
  );
}
