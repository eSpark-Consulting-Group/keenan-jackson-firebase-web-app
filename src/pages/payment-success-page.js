import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  Gift,
  Mail,
  MessageSquare,
  Trophy,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext";
import { TIERS, callFunction } from "../firebase/config";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

export default function PaymentSuccess() {
  const { user, userData } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const sessionId = searchParams.get("session_id");

useEffect(() => {
  const runConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);

      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const verifyPayment = async () => {
    if (!sessionId) {
      toast.error("Session ID missing in URL");
      setLoading(false);
      return;
    }

    try {
      const res = await callFunction("verifyCheckoutSession", { sessionId, uid: user?.uid });

      if (res.success) {
        const tier = TIERS[res.tierId?.toUpperCase()] || null;
        setPaymentDetails({
          tier: tier,
          amount: tier?.amount || 0,
          accessGranted: true
        });
        toast.success(`Payment successful! Tier: ${res?.tier}`);
        runConfetti();
      } else {
        toast.error(res?.message || "Payment not completed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error verifying payment");
    } finally {
      setLoading(false);
    }
  };

  verifyPayment();
}, [sessionId]);


  const nextSteps = [
    {
      icon: MessageSquare,
      title: "Join Telegram Group",
      description: "Check your email for the exclusive Telegram invite link",
      action: "Check Email",
    },
    {
      icon: Trophy,
      title: "Browse Games",
      description: "View upcoming games and start claiming squares",
      action: "View Games",
      link: "/games",
    },
    {
      icon: Clock,
      title: "Answer Trivia",
      description:
        "Practice your speed - average winners answer in 2-5 seconds!",
      action: "Start Playing",
      link: "/games",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-xl text-gray-600">
            Welcome to Square Trivia,{" "}
            {user?.displayName || userData?.username || "Champion"}!
          </p>
        </motion.div>

        {/* Tier Details */}
        {paymentDetails?.tier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8 mb-8"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 rounded-full mb-4">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-900 font-semibold">
                  {paymentDetails.tier.name} Access Granted
                </span>
              </div>

              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${paymentDetails.tier.prizePerQuarter}
              </div>
              <p className="text-gray-600">Prize per quarter</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Prize Pool</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${paymentDetails.tier.totalPrize}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Entry Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${paymentDetails.amount}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Squares Available</p>
                <p className="text-lg font-semibold text-gray-900">50</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* What Happens Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What Happens Next?
          </h2>

          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>

                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>

                    {step.link ? (
                      <Link
                        to={step.link}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {step.action}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {step.action}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Email Confirmation Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start">
            <Mail className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-gray-700">
                We've sent a confirmation email to{" "}
                <strong>{user?.email}</strong> with:
              </p>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• Payment receipt</li>
                <li>• Telegram group invite link</li>
                <li>• Getting started guide</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/games"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
          >
            <Trophy className="mr-2 h-5 w-5" />
            Start Playing Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-full">
            <Gift className="h-5 w-5 mr-2" />
            <span className="font-medium">
              You're all set! Time to test your sports knowledge and win big!
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
