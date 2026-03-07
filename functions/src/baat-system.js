/**
 * BAAT System (Board Average Answer Time)
 * BAAT System Module
 *
 * Centralizes BAAT calculation with strict response time bounds:
 * - MIN: 0.30 seconds (filters sub-human bot responses)
 * - MAX: 10.00 seconds (filters disengaged/lazy responses)
 */

const admin = require("firebase-admin");

// =====================================
// BAAT CONFIGURATION
// =====================================
// BAAT response criteria bounds restored.
// Only answer times between 0.30 and 10.00 seconds are included in BAAT
// calculation. Prevents sub-human responses and slow responses from
// inflating/deflating the BAAT.
const BAAT_CONFIG = {
  MIN_RESPONSE_TIME: 0.3, // Minimum valid response time (seconds)
  MAX_RESPONSE_TIME: 10.0, // Maximum valid response time (seconds)
};

/**
 * Validate if answer time is within BAAT acceptable range
 * @param {number} timeSeconds - Answer time in seconds
 * @returns {boolean} True if time is valid (0.30-10.00s)
 */
function isValidResponseTime(timeSeconds) {
  if (
    typeof timeSeconds !== "number" ||
    timeSeconds === null ||
    timeSeconds === undefined
  ) {
    return false;
  }
  return (
    timeSeconds >= BAAT_CONFIG.MIN_RESPONSE_TIME &&
    timeSeconds <= BAAT_CONFIG.MAX_RESPONSE_TIME
  );
}

/**
 * Collect all answer times from board claims and apply BAAT filtering
 * Primary filter: Validates each time against BAAT bounds
 *
 * @param {array} squareClaims - Array of square claim documents
 * @returns {array} Filtered array of valid answer times
 */
function collectAnswerTimes(squareClaims) {
  const answerTimes = [];

  // PRIMARY FILTER: Strict BAAT compliance (0.30-10.00s)
  if (Array.isArray(squareClaims) && squareClaims.length > 0) {
    for (const claim of squareClaims) {
      const time = claim.answerTime;

      // Primary filter validates response time bounds
      if (
        time !== null &&
        time !== undefined &&
        typeof time === "number" &&
        time >= BAAT_CONFIG.MIN_RESPONSE_TIME &&
        time <= BAAT_CONFIG.MAX_RESPONSE_TIME
      ) {
        answerTimes.push(time);
      }
    }
  }

  // FALLBACK FILTER: Secondary validation for edge cases
  // Ensures robustness if claims structure varies (checks multiple field name possibilities)
  if (answerTimes.length === 0 && Array.isArray(squareClaims)) {
    console.warn(
      "⚠️ Primary BAAT filter returned 0 times. Running fallback with alternate field names...",
    );

    for (const claim of squareClaims) {
      // Try multiple field name variations used in the system
      const time =
        claim.answerTime ||
        claim.triviaAnswerTimeSeconds ||
        claim.answerTimeSeconds ||
        claim.time;

      // Only include answer times between 0.30 and 10.00 seconds.
      if (
        time !== null &&
        typeof time === "number" &&
        time >= BAAT_CONFIG.MIN_RESPONSE_TIME &&
        time <= BAAT_CONFIG.MAX_RESPONSE_TIME
      ) {
        answerTimes.push(time);
      }
    }
  }

  return answerTimes;
}

/**
 * Calculate Board Average Answer Time (BAAT)
 * Aggregates all valid answer times across board and returns mean
 *
 * @param {array} answerTimes - Array of valid answer times (pre-filtered)
 * @returns {number|null} Average answer time, or null if no valid times
 */
function calculateBAAT(answerTimes) {
  if (!Array.isArray(answerTimes) || answerTimes.length === 0) {
    return null;
  }

  const sum = answerTimes.reduce((acc, time) => acc + time, 0);
  return sum / answerTimes.length;
}

/**
 * Full BAAT calculation pipeline
 * @param {array} squareClaims - Raw square claim documents
 * @returns {object} { baat: number|null, validCount: number, totalCount: number }
 */
function calculateFullBAAT(squareClaims) {
  const answerTimes = collectAnswerTimes(squareClaims);
  const baat = calculateBAAT(answerTimes);

  return {
    baat,
    validCount: answerTimes.length,
    totalCount: squareClaims ? squareClaims.length : 0,
  };
}

// Export functions
module.exports = {
  BAAT_CONFIG,
  isValidResponseTime,
  collectAnswerTimes,
  calculateBAAT,
  calculateFullBAAT,
};
