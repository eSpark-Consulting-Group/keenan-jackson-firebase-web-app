import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

export async function checkEligibility() {
  const LOCAL_KEY = "squareTrivia_eligibility";
  const RESTRICTED_STATES = process.env.REACT_APP_RESTRICTED_STATES?.split(
    ","
  )?.map((s) => s?.trim()) || ["AZ", "TN", "MD", "LA"];

  const ALLOWED_COUNTRIES = process.env.REACT_APP_ALLOWED_COUNTRIES?.split(
    ","
  )?.map((s) => s?.trim()) || ["PK", "US"];

  let ipData = {};
  let gpsData = {};
  let result = {};
  let is_vpn = false;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

  // -----------------------
  // 1️⃣ Check Local Cache
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
    // 2️⃣ IP Location Fetch
    // -----------------------
    console.log("🌐 Fetching IP data...");
    const ipInfo = await fetch("https://ipapi.co/json/").then((r) => r.json());
    ipData = {
      city: ipInfo.city || null,
      state: ipInfo.region_code?.toUpperCase() || null,
      country: ipInfo.country_code?.toUpperCase() || null,
    };
    console.log("📡 IP Data:", ipData);

    // -----------------------
    // 3️⃣ GPS Location Fetch
    // -----------------------
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
    ).then((r) => r.json());

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

    // -----------------------
    // 4️⃣ Compare IP vs GPS
    // -----------------------
    if (
      ipData.country &&
      gpsData.country &&
      (ipData.country !== gpsData.country || ipData.state !== gpsData.state)
    ) {
      is_vpn = true;
      console.warn("⚠️ Location mismatch → possible VPN/proxy detected");
    }

    // -----------------------
    // 5️⃣ Eligibility Logic
    // -----------------------
    const final_state = gpsData.state || ipData.state;
    const final_country = gpsData.country || ipData.country;

    let status = "eligible";
    let reason = "OK";

    if (!final_state || !final_country) {
      status = "restricted";
      reason = "Unverifiable location";
    } else if (!ALLOWED_COUNTRIES.includes(final_country)) {
      status = "restricted";
      reason = `Country ${final_country} not allowed`;
    } else if (RESTRICTED_STATES.includes(final_state)) {
      status = "restricted";
      reason = `State ${final_state} restricted`;
    } else if (is_vpn) {
      status = "restricted";
      reason = "VPN or proxy detected (IP/GPS mismatch)";
    }

    // --- Examples alignment ---
    // ✅ TX (both IP + GPS) → allowed
    // 🚫 TN (either IP or GPS) → blocked
    // 🚫 IP GA + GPS TN → blocked
    // ✅ VPN IP + GPS FL → allowed (since GPS is valid + not restricted)
    // 🚫 Billing LA → blocked
    // 🚫 Unverifiable → blocked

    // --- Build result ---
    result = {
      status,
      reason,
      gps: gpsData,
      ip: ipData,
      is_vpn,
      billing_state: final_state,
      timestamp: Date.now(),
    };

    // -----------------------
    // ✅ Only Cache Valid Results
    // -----------------------
    const hasValidIP =
      ipData && (ipData.state || ipData.country || ipData.city);
    const hasValidGPS =
      gpsData && (gpsData.state || gpsData.country || gpsData.city);

    if (hasValidIP || hasValidGPS) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(result));
      console.log("💾 [Eligibility Saved]", result);
    } else {
      console.warn("⚠️ Skipped caching — both IP and GPS missing");
    }

    return result;
  } catch (err) {
    console.error("❌ Eligibility check failed:", err);

    result = {
      status: "restricted",
      reason: err.message || "Unable to verify",
      gps: gpsData || null,
      ip: ipData || null,
      is_vpn: is_vpn || null,
      billing_state: null,
      timestamp: Date.now(),
    };

    // ⚠️ Only cache if there's at least partial data
    const hasValidIP =
      ipData && (ipData.state || ipData.country || ipData.city);
    const hasValidGPS =
      gpsData && (gpsData.state || gpsData.country || gpsData.city);

    if (hasValidIP || hasValidGPS) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(result));
      console.log("💾 [Eligibility Saved - Partial]", result);
    } else {
      console.warn("⚠️ Skipped caching — invalid IP/GPS data");
    }

    return result;
  }
    // -----------------------
    // 3. Call Firebase Function
    // -----------------------
  //   const functions = getFunctions();
  //   const verify = httpsCallable(functions, "verifyEligibilityRequest");

  //   try {
  //     const res = await verify(result);

  //     const result = {
  //       status: res.data.status,
  //       reason: res.data.message,
  //     };

  //     localStorage.setItem(
  //       LOCAL_KEY,
  //       JSON.stringify({ timestamp: Date.now(), result })
  //     );

  //     console.log("[Eligibility] Verified:", result);
  //     return result;
  //   } catch (err) {
  //     console.error("[Eligibility] Firebase check failed:", err);
  //     const reason = err.message || "Eligibility check failed.";
  //     const result = { status: "restricted", reason };

  //     localStorage.setItem(
  //       LOCAL_KEY,
  //       JSON.stringify({ timestamp: Date.now(), result })
  //     );

  //   return result;
  // }
}
