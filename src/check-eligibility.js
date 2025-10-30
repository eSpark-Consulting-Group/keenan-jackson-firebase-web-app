import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

export async function checkEligibility({ billing_state }) {
  const auth = getAuth();
  const token = await auth.currentUser.getIdToken();

  // 1. IP & VPN flags — call your IP info API or Firebase edge function
  const ipInfo = await fetch("https://ipapi.co/json/").then(r => r.json());
  const ip_state = ipInfo.region_code; // e.g., "TX"
  const is_vpn = ipInfo.security?.vpn || false;

  // 2. GPS — ask user
  let gps_state = null;
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
    );
    const { latitude, longitude } = pos.coords;
    // optional: reverse geocode to state using Firebase function
    const geo = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`).then(r => r.json());
    gps_state = geo.state || null;
  } catch {}

  // 3. Call Firebase
  const functions = getFunctions();
  const verify = httpsCallable(functions, "verifyEligibility");
  try {
    const res = await verify({ ip_state, gps_state, billing_state, is_vpn });
    return res.data.status === "eligible";
  } catch (err) {
    console.error(err.message);
    alert(err.message);
    return false;
  }
}
