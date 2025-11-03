import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

export async function checkEligibility() {
  const LOCAL_KEY = "squareTrivia_eligibility";
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  const RESTRICTED_STATES = process.env.REACT_APP_RESTRICTED_STATES?.split(",")?.map(s => s.trim()) || ["AZ", "TN", "MD", "LA"];
  const ALLOWED_COUNTRIES = process.env.REACT_APP_ALLOWED_COUNTRIES?.split(",")?.map(s => s.trim()) || ["PK", "US"];

  let ipData = {};
  let gpsData = {};
  let is_vpn = false;
  let result = {};

  // -----------------------
  // 1️⃣ Check local cache
  // -----------------------
  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    if (cached.timestamp && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("💾 [Eligibility Loaded from Cache]", cached);
      return cached;
    } else {
      console.log("🗑️ [Eligibility Cache Expired]");
    }
  } catch (err) {
    console.warn("⚠️ [Eligibility Cache Read Error]", err);
  }

  try {
    // -----------------------
    // 2️⃣ Fetch IP Data
    // -----------------------
    try {
      console.log("🌐 Fetching IP data...");
      const ipInfo = await fetch("https://ipapi.co/json/").then(r => r.json());
      ipData = {
        city: ipInfo.city || null,
        state: ipInfo.region_code?.toUpperCase() || null,
        country: ipInfo.country_code?.toUpperCase() || null,
      };
      console.log("📡 IP Data:", ipData);
    } catch (err) {
      console.warn("⚠️ IP fetch failed:", err);
    }

    // -----------------------
    // 3️⃣ Fetch GPS Data
    // -----------------------
    try {
      console.log("📍 Requesting GPS location...");
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      );

      const { latitude, longitude } = pos.coords;
      const geo = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      ).then(r => r.json());

      gpsData = {
        city: geo.city || geo.locality || null,
        state:
          geo.principalSubdivisionCode?.split("-")[1]?.toUpperCase() ||
          geo.principalSubdivision ||
          null,
        country: geo.countryCode?.toUpperCase() || null,
        latitude,
        longitude,
      };
      console.log("🗺️ GPS Data:", gpsData);
    } catch (err) {
      console.warn("⚠️ GPS fetch failed:", err);
    }

    // -----------------------
    // 4️⃣ VPN Detection
    // -----------------------
    if (
      ipData.country &&
      gpsData.country &&
      (ipData.country !== gpsData.country || ipData.state !== gpsData.state)
    ) {
      is_vpn = true;
      console.warn("⚠️ IP/GPS mismatch — possible VPN");
    }

    // -----------------------
    // 5️⃣ Eligibility Logic
    // -----------------------
    const final_state = gpsData.state || ipData.state;
    const final_country = gpsData.country || ipData.country;

    let status = "eligible";
    let reason = "OK";

    if (!final_state && !final_country) {
      status = "restricted";
      reason = "No location data available";
    } else if (!ALLOWED_COUNTRIES.includes(final_country)) {
      status = "restricted";
      reason = `Country ${final_country} not allowed`;
    } else if (RESTRICTED_STATES.includes(final_state)) {
      status = "restricted";
      reason = `State ${final_state} restricted`;
    } else if (is_vpn) {
      status = "restricted";
      reason = "VPN or proxy detected";
    }

    result = {
      status,
      reason,
      ip: ipData,
      gps: gpsData,
      is_vpn,
      billing_state: final_state,
      timestamp: Date.now(),
    };

    const hasValidIP = ipData && (ipData.state || ipData.country);
    const hasValidGPS = gpsData && (gpsData.state || gpsData.country);

    // ✅ Cache valid results
    if (hasValidIP || hasValidGPS) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(result));
      console.log("💾 [Eligibility Saved]", result);
      return result;
    }

    // -----------------------
    // 6️⃣ No IP/GPS → Call Firebase
    // -----------------------
    console.log("🚨 No IP/GPS data, checking with Firebase...");
    const functions = getFunctions();
    const verifyEligibilityRequest = httpsCallable(functions, "verifyEligibilityRequest");
    const firebaseRes = await verifyEligibilityRequest({});

    result = {
      status: firebaseRes.data?.status || "restricted",
      reason: firebaseRes.data?.message || "Fallback check failed",
      source: "firebase",
      timestamp: Date.now(),
    };

    localStorage.setItem(LOCAL_KEY, JSON.stringify(result));
    console.log("🔥 [Eligibility Verified via Firebase]", result);
    return result;

  } catch (err) {
    console.error("❌ [Eligibility Fatal Error]", err);
    return {
      status: "restricted",
      reason: err.message || "Unable to verify",
      gps: gpsData || null,
      ip: ipData || null,
      is_vpn: is_vpn || null,
      billing_state: null,
      timestamp: Date.now(),
    };
  }
}
