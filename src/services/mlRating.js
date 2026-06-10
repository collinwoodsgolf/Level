/**
 * LEVEL GOLF — Online ML rating refinement (engine v4)
 *
 * The physics engine stays the prior; this layer learns what the physics
 * MISSES, one posted round at a time. Model: Bayesian linear regression
 * fitted online via recursive least squares (RLS) with exponential
 * forgetting.
 *
 * Every attested round is a noisy measurement of the day's true difficulty:
 *   observedDelta = score − (staticRating + courseHandicap)
 *   target  y     = observedDelta − physicsDelta        (the residual)
 *   features x    = per-factor predicted strokes + raw conditions
 *   correction    = w·x, applied on top of the calibrated physics delta
 *
 * Why RLS and not SGD: exact posterior update per observation (no learning
 * rate to tune), a predictive variance xᵀPx for principled shrinkage, and
 * the forgetting factor keeps the model adapting as the course changes
 * season to season. Weights start at 0, so with no data the engine is pure
 * physics; corrections grow only as evidence accumulates. State is plain
 * JSON per course — serializable for persistence/backend sync.
 */

// Explicit .js extensions so this module (and the physics/calibration
// modules it pulls in) can also run headlessly under Node — see
// scripts/verify-ml.mjs. Metro resolves both forms identically.
import { computeRating } from './ratingEngine.js';
import {
  FACTOR_KEYS, DEFAULT_CALIBRATION,
  estimateFieldDelta, updateFactorMultipliers,
} from './calibration.js';

// ═══════════════════════════════════════════════════
// FEATURES
// ═══════════════════════════════════════════════════

// 1 bias + 8 engine factor components (strokes) + 6 raw-condition terms.
// Putting the factor components in the features lets the model learn
// per-factor rescaling (like the calibration multipliers, but jointly);
// the raw terms catch effects the physics doesn't parameterize at all,
// including a wind×green-speed interaction.
export const ML_FEATURES = [
  'bias',
  ...FACTOR_KEYS,
  'wind_speed', 'gust_excess', 'temp_dev', 'stimp_dev', 'wet', 'wind_x_stimp',
];
const DIM = ML_FEATURES.length;

export function extractFeatures(factorSummary, conds) {
  const wind = (conds.wind_speed_mph || 0) / 10;
  const stimpDev = ((conds.green_speed_stimp || 10.5) - 10.5) / 2;
  return [
    1,
    ...FACTOR_KEYS.map(k => factorSummary?.[k] || 0),
    wind,
    Math.max((conds.wind_gusts_mph || 0) - (conds.wind_speed_mph || 0), 0) / 10,
    ((conds.temperature_f || 72) - 72) / 20,
    stimpDev,
    conds.precipitation && conds.precipitation !== 'none' ? 1 : 0,
    wind * stimpDev,
  ];
}

// ═══════════════════════════════════════════════════
// MODEL — recursive least squares with forgetting
// ═══════════════════════════════════════════════════

const PRIOR_VAR = 0.35;       // prior variance per weight (tight → physics-first)
const NOISE_VAR_ROUND = 9.0;  // single-round score noise, σ ≈ 3 strokes
const FORGETTING = 0.997;     // per-observation memory decay (seasonal drift)
const MAX_CORRECTION = 5.0;   // strokes — sanity clamp on the applied correction
const WARMUP_K = 8;           // extra shrink while observations are scarce

export function createModel() {
  return {
    v: 4,
    w: Array(DIM).fill(0),
    P: Array.from({ length: DIM }, (_, i) =>
      Array.from({ length: DIM }, (_, j) => (i === j ? PRIOR_VAR : 0))),
    observations: 0,
    maeEma: null,        // EMA of |residual after correction| — live accuracy
    lastUpdated: null,
  };
}

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

/** Predict the residual correction and its uncertainty for features x. */
export function predictCorrection(model, x) {
  if (!model) return { correction: 0, se: Math.sqrt(PRIOR_VAR) };
  const raw = dot(model.w, x);
  const Px = model.P.map(row => dot(row, x));
  const variance = Math.max(dot(x, Px), 0);
  return {
    correction: Math.max(-MAX_CORRECTION, Math.min(MAX_CORRECTION, raw)),
    se: Math.sqrt(variance),
  };
}

/**
 * One RLS update: absorb (x, y) where y = observedDelta − physicsDelta.
 * noiseVar reflects how noisy the measurement is — a single round is ~9
 * (σ≈3 strokes); a field average of n rounds passes its (smaller) se².
 * Returns a NEW model (immutable, store-friendly).
 */
export function trainObservation(model, x, y, noiseVar = NOISE_VAR_ROUND) {
  const m = model?.P ? model : createModel();
  const Px = m.P.map(row => dot(row, x));
  const denom = noiseVar + dot(x, Px);
  const k = Px.map(v => v / denom);            // Kalman gain
  const err = y - dot(m.w, x);
  const w = m.w.map((wi, i) => wi + k[i] * err);
  // P = (P − k·(Px)ᵀ) / λ — forgetting inflates variance so learning never stops
  const P = m.P.map((row, i) => row.map((pij, j) => (pij - k[i] * Px[j]) / FORGETTING));
  const postErr = Math.abs(y - dot(w, x));
  return {
    ...m,
    w, P,
    observations: m.observations + 1,
    maeEma: m.maeEma == null ? postErr : +(0.85 * m.maeEma + 0.15 * postErr).toFixed(3),
    lastUpdated: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════
// RATING WRAPPER — physics + calibration + ML
// ═══════════════════════════════════════════════════

/**
 * Effective per-factor multipliers the system has learned so far:
 * calibration multiplier × (1 + ML weight on that factor's component).
 * Used by the Insights UI to show WHAT was learned, not just how much.
 */
export function learnedFactorAdjustments(model, calibration) {
  return FACTOR_KEYS.map((key, i) => {
    const calM = calibration?.factors?.[key] ?? 1;
    const mlW = model?.w?.[i + 1] ?? 0; // +1 skips bias
    return { key, multiplier: +(calM * (1 + mlW)).toFixed(2) };
  }).sort((a, b) => Math.abs(b.multiplier - 1) - Math.abs(a.multiplier - 1));
}

/**
 * Drop-in replacement for computeRating that layers the learned state on
 * top of the physics: calibration multipliers inside the engine, then the
 * ML residual correction on the total. Always attaches an `ml` block —
 * including the feature snapshot the store needs to train on when the
 * round is eventually posted.
 *
 * learning: { model, calibration, roundsAbsorbed } (per-course, from store)
 */
export function computeRatingML(conds, courseData, holes, learning = null) {
  const calibration = learning?.calibration || null;
  const model = learning?.model || null;
  const rating = computeRating(conds, courseData, holes, calibration);
  const features = extractFeatures(rating.factor_summary, conds);
  const physicsDelta = rating.rating_delta;

  const ml = {
    enabled: !!model && model.observations > 0,
    observations: model?.observations || 0,
    physics_delta: physicsDelta,
    correction: 0,
    se: null,
    weight: 0,
    mae: model?.maeEma ?? null,
    features,
    factor_adjustments: learnedFactorAdjustments(model, calibration),
  };

  if (ml.enabled) {
    const { correction, se } = predictCorrection(model, features);
    // Warm-up gate on top of the Bayesian shrinkage: with 2 rounds absorbed
    // we apply 20% of the correction, with 30 rounds ~79%, asymptoting to 1.
    const weight = model.observations / (model.observations + WARMUP_K);
    ml.correction = +(correction * weight).toFixed(2);
    ml.se = +se.toFixed(2);
    ml.weight = +weight.toFixed(2);
  }

  if (ml.correction !== 0) {
    const adjDelta = physicsDelta + ml.correction;
    // Distribute the correction across holes: proportional rescale when the
    // physics delta is meaningful, even spread when it's near zero.
    if (Math.abs(physicsDelta) > 0.5) {
      const scale = Math.max(0.25, Math.min(4, adjDelta / physicsDelta));
      rating.hole_difficulties.forEach(h => {
        h.difficulty_delta = +(h.difficulty_delta * scale).toFixed(4);
      });
    } else {
      const per = ml.correction / rating.hole_difficulties.length;
      rating.hole_difficulties.forEach(h => {
        h.difficulty_delta = +(h.difficulty_delta + per).toFixed(4);
      });
    }
    rating.rating_delta = +adjDelta.toFixed(1);
    rating.today_rating = +(rating.usga_static_rating + adjDelta).toFixed(1);
    const slopeAmp = 1 + (adjDelta / rating.usga_static_rating) * 2.5;
    rating.today_slope = Math.max(55, Math.min(155, Math.round(rating.usga_static_slope * slopeAmp)));
    rating.slope_delta = rating.today_slope - rating.usga_static_slope;
    rating.front_nine_delta = +rating.hole_difficulties.slice(0, 9)
      .reduce((s, h) => s + h.difficulty_delta, 0).toFixed(2);
    rating.back_nine_delta = +rating.hole_difficulties.slice(9)
      .reduce((s, h) => s + h.difficulty_delta, 0).toFixed(2);
    const d = rating.rating_delta;
    rating.difficulty_label = d <= -1.5 ? 'Playing Easy' : d <= -0.5 ? 'Slightly Easier'
      : d <= 0.5 ? 'Near Rated' : d <= 2 ? 'Playing Tough'
      : d <= 4 ? 'Very Tough' : d <= 7 ? 'Brutally Hard' : 'Extreme';
  }

  rating.ml = ml;
  rating.data_quality.ml_observations = ml.observations;
  return rating;
}

// ═══════════════════════════════════════════════════
// LEARNING — one update per posted round / field day
// ═══════════════════════════════════════════════════

/**
 * Absorb ONE posted round into the per-course learning state.
 * snapshot fields are locked at tee-off (see store.startRound):
 *   { score, handicap, staticRating, staticSlope,
 *     physicsDelta, features, factorSummary }
 * Returns the next { model, calibration, roundsAbsorbed, lastUpdated }.
 */
export function learnFromRound(learning, snapshot) {
  const {
    score, handicap, staticRating, staticSlope,
    physicsDelta, features, factorSummary,
  } = snapshot;
  if (score == null || staticRating == null || !features) return learning || null;

  const model = learning?.model || createModel();
  const calibration = learning?.calibration || DEFAULT_CALIBRATION;

  const courseHcp = ((handicap || 0) * (staticSlope || 113)) / 113;
  const observedDelta = score - (staticRating + courseHcp);
  const y = observedDelta - physicsDelta;

  const nextModel = trainObservation(model, features, y, NOISE_VAR_ROUND);
  // The interpretable per-factor multipliers move too — a single round is
  // noisy, so shrink the observation 75% toward the prediction first.
  const obsShrunk = physicsDelta + (observedDelta - physicsDelta) * 0.25;
  const nextCal = updateFactorMultipliers(calibration, physicsDelta, obsShrunk, factorSummary);

  return {
    model: nextModel,
    calibration: nextCal,
    roundsAbsorbed: (learning?.roundsAbsorbed || 0) + 1,
    lastUpdated: nextModel.lastUpdated,
  };
}

/**
 * Absorb a FIELD of rounds (everyone who posted at this course today) as a
 * single low-noise observation — a trimmed-mean of n scores is worth far
 * more than any one card. Backend hook: call once per course-day.
 * fieldRounds: [{ score, playerHandicap, staticRating, staticSlope }]
 */
export function learnFromField(learning, fieldRounds, { physicsDelta, features, factorSummary }) {
  const est = estimateFieldDelta(fieldRounds);
  if (!est || !features) return learning || null;

  const model = learning?.model || createModel();
  const calibration = learning?.calibration || DEFAULT_CALIBRATION;

  // Train on the RAW trimmed mean, not the shrunk-toward-zero estimate:
  // shrinking toward 0 biases hard days easy (and vice versa). Small-sample
  // distrust is already handled by the observation noise variance below.
  const y = est.rawDelta - physicsDelta;
  const noiseVar = Math.max(est.se, 0.5) ** 2;
  const nextModel = trainObservation(model, features, y, noiseVar);
  const nextCal = updateFactorMultipliers(calibration, physicsDelta, est.rawDelta, factorSummary);

  return {
    model: nextModel,
    calibration: nextCal,
    roundsAbsorbed: (learning?.roundsAbsorbed || 0) + est.n,
    lastUpdated: nextModel.lastUpdated,
  };
}
