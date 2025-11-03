# Urgent Compliance Update — Block 4 U.S. States (No AMOE)

**Effective immediately**, Square Trivia must **exclude** users in the following states from **all paid-entry
contests**:

- **Arizona (AZ)**
- **Tennessee (TN)**
- **Maryland (MD)**
- **Louisiana (LA)**
  This is a legal/compliance requirement tied to our “paid skill-contest” model without a free entry method.

## What to implement

### 1) Hard Blocks (all layers)

- Account creation / sign-in gating
- If user is located in AZ/TN/MD/LA → block with error.
- Contest join & payment
- Deny access to paid contests and block any payment attempt if user location is in a restricted state.

### 2) Location Verification (defense in depth)

Use all three checks; deny if any says restricted.

1. IP Geolocation (server-side, at edge)

- Use geolocation provider in API gateway or CDN edge (e.g., Cloudflare CF-IPCountry + MaxMind).
- Cache for 15 min to reduce churn.

1. Device Location (client-side)

- On mobile/web app, request coarse GPS (with consent) when a user attempts to enter a paid contest.
- If user denies, fall back to IP + billing address; still block if we can’t confirm they’re not in a restricted state.

1. Billing Address State (payments)

- Require billing state on payment; if AZ/TN/MD/LA → block.
  Decision rule: restricted_if( ip_state ∈ banned OR gps_state ∈ banned OR billing_state ∈ banned )

### 3) VPN/Proxy Handling

- If IP is VPN/hosting/anonymous (per provider flags), force device GPS verification to proceed.
- If GPS unavailable or mismatched → block.

### 4) Feature Flag & Config

Add an environment-driven allow/deny list.
RESTRICTED_STATES=AZ,TN,MD,LA
RESTRICTION_MODE=paid_contests
RESTRICTION_HARDFAIL=true

### 5) API Contract

- New middleware: enforceStateEligibility(req, user)
- Reads ip_state, optional gps_state, and billing_state.
- Throws standardized error if restricted.
  Errors:
  403_STATE_RESTRICTED: “Contests are unavailable in your state (AZ, TN, MD, LA).”
  412_LOCATION_UNVERIFIED: “We couldn’t verify your location. Enable location or update your billing
  address.”

### 6) UI/UX Requirements

- Sign-up / Onboarding gate: “Square Trivia paid contests are not available in AZ, TN, MD, or LA.”
- Contest page banner (geo-detected): “Contests unavailable in your location.”
- Payment modal inline error: “We can’t process entries from Arizona, Tennessee, Maryland, or Louisiana.”
- Help/FAQ update: Add sentence + “Void where prohibited.”

### 7) Data Model / Telemetry

Add fields to user/session for auditability.
last_ip_state, last_gps_state, last_billing_state, eligibility_status (eligible|restricted|unverified)
Log denied attempts with reason and state.

### 8) Tests (must pass)

- User in TX → allowed.
- User in TN → blocked.
- User IP GA, GPS TN → blocked.
- VPN IP + GPS FL → allowed.
- Billing address LA → blocked.
- Unverifiable location → blocked.

### 9) Admin Controls

Add Compliance → Jurisdictions screen.

### 10) Copy (use verbatim)

Eligibility: “Participation in paid Square Trivia contests is open to residents of the United States excluding
residents of Arizona, Tennessee, Maryland, and Louisiana.”
Processor note: “Not available in AZ, TN, MD, LA.”

## Rollout Plan

1. Ship server middleware + env flags.
2. Update client with banners, checkbox, GPS prompt.
3. Enable logging and dashboards.
4. Turn on restriction hard fail after smoke test.
   Deadline: Treat as blocker for payment launch.
   Ping me when staging is ready and I’ll verify copy + flows.
