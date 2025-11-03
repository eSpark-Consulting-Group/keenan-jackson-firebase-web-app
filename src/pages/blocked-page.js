import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, MapPinOff, WifiOff, Lock } from "lucide-react";

export default function BlockedPage() {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  // detect reason from query or fallback
  const reason =
    new URLSearchParams(search).get("reason") ||
    (pathname.includes("restricted") ? "location_blocked" : "unknown_error");

  const reasonData = {
    location_blocked: {
      title: "Contests Unavailable in Your Location",
      message:
        "Paid contests are not available in your state due to legal restrictions.",
      icon: MapPinOff,
      color: "text-red-600",
    },
    vpn_detected: {
      title: "VPN Detected",
      message:
        "We detected VPN usage. Please disable your VPN and refresh the page.",
      icon: WifiOff,
      color: "text-yellow-600",
    },
    location_permission_denied: {
      title: "Location Access Needed",
      message:
        "We couldn’t verify your location. Please enable location permissions and retry.",
      icon: ShieldAlert,
      color: "text-orange-600",
    },
    unknown_error: {
      title: "Access Restricted",
      message:
        "Access blocked due to eligibility restrictions. Please contact support if you believe this is an error.",
      icon: Lock,
      color: "text-gray-600",
    },
  };

  const { title, message, icon: Icon, color } =
    reasonData[reason] || reasonData.unknown_error;

  const allReasons = [
    {
      title: "Restricted Regions",
      desc: "Certain US states such as Louisiana, Tennessee, Maryland, and Arizona are not eligible for paid contests.",
    },
    {
      title: "VPN or Proxy Usage",
      desc: "Using a VPN or proxy can mask your location and trigger access restrictions.",
    },
    {
      title: "Location Access Disabled",
      desc: "We require permission to verify your region before granting contest access.",
    },
    {
      title: "Suspicious Activity",
      desc: "Unusual IP or location mismatch can temporarily restrict access for your security.",
    },
  ];

  // Automatically scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-orange-50 to-white p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100"
      >
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <Icon className={`w-10 h-10 ${color}`} />
          </div>

          <h1 className={`text-3xl font-bold ${color} mb-2`}>{title}</h1>
          <p className="text-gray-700 mb-6">{message}</p>

          <div className="flex gap-3">
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(0)}
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-all"
            >
              Try Again
            </motion.button> */}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Back to Home
            </motion.button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Possible Reasons for Access Restriction
          </h2>
          <ul className="space-y-2 text-gray-600">
            {allReasons.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition"
              >
                <p className="font-medium text-gray-800">{r.title}</p>
                <p className="text-sm text-gray-600">{r.desc}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
