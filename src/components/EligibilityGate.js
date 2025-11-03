import React from "react";

export default function EligibilityGate({ children }) {
  const eligibility =
    JSON.parse(localStorage.getItem("squareTrivia_eligibility") || "{}") || {};

  const isRestricted = eligibility.status === "restricted";
  const isVPN = eligibility.is_vpn === true;

  if (isRestricted || isVPN) {
    let heading = "";
    let message = "";
    let reason = eligibility?.reason || "Reason details not available currently.";

    if (isVPN) {
      heading = "VPN Detected";
      message =
        "It looks like you're using a VPN. Please disable your VPN to continue using Square Trivia paid contests.";
    } else {
      heading = "Contests Unavailable in Your Location";
      message =
        "Square Trivia paid contests are not available in your state (AZ, TN, MD, LA).";
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-gray-50">
        <h2
          className="text-2xl font-semibold text-gray-800 mb-2"
          dangerouslySetInnerHTML={{ __html: heading }}
        />
        <p
          className="text-gray-700 mb-2"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <p className="text-gray-600 max-w-md mb-4">Reason: {reason}</p>

        <p className="text-gray-600 max-w-md mb-4">Contact Us if You Believe This Is a Mistake</p>
        <button
          onClick={() => window.open("mailto:support@squaretrivia.com")}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Contact Now
        </button>
      </div>
    );
  }

  // ✅ Allowed users see children
  return <>{children}</>;
}
