/**
 * LEVEL GOLF — Self-calibrating rating layer (empirical Bayes)
 *
 * The physics model predicts a difficulty delta from conditions.
 * Every posted round is also a measurement of TRUE difficulty:
 *   s_ij = θ_i + D_j + ε_ij
 *   residual r_i = score_i − (rating + handicap·slope/113) ≈ D_error + ε_i
 *
 * Daily loop:
 *   1. estimateFieldDelta(rounds)  → what the field says today played to
 *   2. updateFactorMultipliers()   → nudge per-factor multipliers toward
 *      whatever closes the prediction gap, with Bayesian shrinkage toward 1
 *      so small samples can't yank the model around.
 *
 * Multipliers are applied inside computeRating (engine v3).
 */

export const FACTOR_KEYS = [
  'wind_distance', 'crosswind', 'temperature', 'tee_position',
  'green_difficulty', 'precipitation', 'rough_height', 'firmness',
];

export const DEFAULT_CALIBRATION = {
  factors: Object.fromEntries(FACTOR_KEYS.map(k => [k, 1.0])),
  observations: 0,        // total field-days absorbed
  lastUpdated: null,
};

/**
 * Estimate today's TRUE difficulty delta from the field's scores.
 * rounds: [{ score, playerHandicap, staticRating, staticSlope }]
 * Returns { observedDelta, n, se } or null if not enough data.
 *
 * Uses a 20%-trimmed mean of residuals (drop blowups/sandbagging tails),
 * then shrinks toward 0 by n/(n+K): with 4 rounds we barely trust it,
 * with 40 we mostly do.
 */
export function estimateFieldDelta(rounds, { shrinkK = 8 } = {}) {
  if (!rounds || rounds.length < 3) return null;
  const residuals = rounds
    .filter(r => r.score && r.playerHandicap != null && r.staticRating)
    .map(r => {
      const courseHcp = (r.playerHandicap * (r.staticSlope || 113)) / 113;
      const expected = r.staticRating + courseHcp;
      return r.score - expected;
    })
    .sort((a, b) => a - b);
  if (residuals.length < 3) return null;
  const trim = Math.floor(residuals.length * 0.2);
  const kept = residuals.slice(trim, residuals.length - trim || residuals.length);
  const mean = kept.reduce((s, v) => s + v, 0) / kept.length;
  const varc = kept.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(kept.length - 1, 1);
  const n = kept.length;
  const shrunk = (n / (n + shrinkK)) * mean;
  return {
    observedDelta: +shrunk.toFixed(2),
    rawDelta: +mean.toFixed(2),
    n,
    se: +Math.sqrt(varc / n).toFixed(2),
  };
}

/**
 * One Bayesian update step on the factor multipliers.
 *
 * predictedDelta : what the engine said the day played to (vs static)
 * observedDelta  : what estimateFieldDelta measured
 * factorSummary  : per-factor stroke contributions that day (engine output)
 *
 * Error is attributed to factors in proportion to their share of the
 * predicted delta (a factor that contributed nothing that day learns
 * nothing that day). Learning rate decays as observations accumulate;
 * multipliers are clamped to [0.5, 2.0] and gently shrunk toward 1.
 */
export function updateFactorMultipliers(calibration, predictedDelta, observedDelta, factorSummary, opts = {}) {
  const { baseRate = 0.15, priorWeight = 20, clamp = [0.5, 2.0] } = opts;
  const cal = calibration?.factors ? calibration : DEFAULT_CALIBRATION;
  const totalAbs = FACTOR_KEYS.reduce((s, k) => s + Math.abs(factorSummary?.[k] || 0), 0);
  if (!totalAbs || predictedDelta == null || observedDelta == null) return cal;

  // Overall correction the model needed today (capped: one weird day ≠ truth)
  const ratio = Math.max(0.33, Math.min(3, observedDelta / (predictedDelta || 0.01)));
  const obs = cal.observations || 0;
  const rate = baseRate * (priorWeight / (priorWeight + obs)); // decaying step

  const factors = { ...cal.factors };
  for (const k of FACTOR_KEYS) {
    const share = Math.abs(factorSummary?.[k] || 0) / totalAbs;
    if (share === 0) continue;
    const target = factors[k] * ratio;
    let next = factors[k] + rate * share * (target - factors[k]);
    // shrink toward the physics prior (multiplier 1)
    next = next + 0.01 * (1 - next);
    factors[k] = +Math.min(clamp[1], Math.max(clamp[0], next)).toFixed(4);
  }
  return {
    factors,
    observations: obs + 1,
    lastUpdated: new Date().toISOString(),
  };
}

/** Apply calibration multipliers to one hole's component map. */
export function applyCalibration(components, calibration) {
  if (!calibration?.factors) return components;
  const out = {};
  for (const [k, v] of Object.entries(components)) {
    out[k] = +((v) * (calibration.factors[k] ?? 1)).toFixed(5);
  }
  return out;
}

/**
 * Blend physics prediction with the live field estimate for display
 * ("today's rating, corrected by how the field is actually scoring").
 * Inverse-variance weighting: trust the field more as rounds accumulate.
 */
export function blendPredictionWithField(predictedDelta, fieldEstimate, { fieldFloorSE = 0.4 } = {}) {
  if (!fieldEstimate) return { delta: predictedDelta, weightOnField: 0 };
  const seModel = 1.0;                      // physics model prior uncertainty (strokes)
  const seField = Math.max(fieldEstimate.se ?? 1, fieldFloorSE);
  const wField = (1 / seField ** 2) / (1 / seField ** 2 + 1 / seModel ** 2);
  const delta = wField * fieldEstimate.observedDelta + (1 - wField) * predictedDelta;
  return { delta: +delta.toFixed(2), weightOnField: +wField.toFixed(2) };
}
