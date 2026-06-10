/**
 * Headless verification of the online ML rating layer (engine v4).
 *
 * Simulates a "true world" where the physics model is systematically wrong —
 * wind actually plays 1.6× the modeled effect, greens only 0.75×, and the
 * course carries a +0.4 stroke house bias the physics knows nothing about.
 * One attested round is posted per day; the learning loop absorbs each one
 * exactly the way store.endRound does.
 *
 * Pass criteria:
 *   1. ML prediction error vs TRUE difficulty falls as rounds accumulate
 *   2. mature ML predictions beat the pure physics model
 *
 * Run: npm run verify:ml
 */
import { computeRating } from '../src/services/ratingEngine.js';
import { computeRatingML, learnFromRound } from '../src/services/mlRating.js';
import { MANHATTAN_WOODS, MANHATTAN_WOODS_HOLES } from '../src/services/courseData.js';

// ─── Ground truth: how conditions REALLY play at this course ───
const TRUTH_MULT = {
  wind_distance: 1.6, crosswind: 1.6, temperature: 1.0, tee_position: 1.0,
  green_difficulty: 0.75, precipitation: 1.2, rough_height: 1.0, firmness: 1.0,
};
const TRUTH_BIAS = 0.4;     // strokes the plaque rating is simply off by
const SCORE_NOISE = 2.5;    // σ of a single player's round (strokes)
const HANDICAP = 9.5;
const DAYS = 120;

// Deterministic RNG (LCG) + Box-Muller for reproducible runs
let seed = 20260610;
const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

const FIRMS = ['soft', 'medium', 'medium', 'firm'];
function randomConditions() {
  return {
    wind_speed_mph: rnd() * 24,
    wind_gusts_mph: 0,
    wind_direction_deg: rnd() * 360,
    temperature_f: 40 + rnd() * 55,
    humidity_pct: 30 + rnd() * 60,
    precipitation: rnd() < 0.15 ? 'light_rain' : 'none',
    green_speed_stimp: 9.5 + rnd() * 4,
    rough_height_inches: 2 + rnd() * 3,
    firmness: FIRMS[Math.floor(rnd() * FIRMS.length)],
    tee_box: 'black',
  };
}

const course = MANHATTAN_WOODS;
const holes = MANHATTAN_WOODS_HOLES;
const tee = course.tee_boxes.black;
const courseHcp = (HANDICAP * tee.slope) / 113;

let learning = null;
const errPhysics = [];
const errML = [];

for (let day = 0; day < DAYS; day++) {
  const conds = { ...randomConditions(), wind_gusts_mph: 0 };
  conds.wind_gusts_mph = conds.wind_speed_mph * (1 + rnd() * 0.6);

  // What the day TRULY plays to (physics components rescaled by the truth)
  const raw = computeRating(conds, course, holes);
  const trueDelta = Object.entries(raw.factor_summary)
    .reduce((s, [k, v]) => s + v * (TRUTH_MULT[k] ?? 1), TRUTH_BIAS);

  // What the engine predicts with everything learned so far
  const rating = computeRatingML(conds, course, holes, learning);
  errPhysics.push(Math.abs(raw.rating_delta - trueDelta));
  errML.push(Math.abs(rating.rating_delta - trueDelta));

  // One player posts a round; the store's learning step absorbs it
  const score = Math.round(tee.rating + courseHcp + trueDelta + gauss() * SCORE_NOISE);
  learning = learnFromRound(learning, {
    score,
    handicap: HANDICAP,
    staticRating: tee.rating,
    staticSlope: tee.slope,
    physicsDelta: rating.ml.physics_delta,
    features: rating.ml.features,
    factorSummary: rating.factor_summary,
  });
}

const mae = a => a.reduce((s, v) => s + v, 0) / a.length;
const W = 20; // comparison window (days)
const phEarly = mae(errPhysics.slice(0, W));
const phLate = mae(errPhysics.slice(-W));
const mlEarly = mae(errML.slice(0, W));
const mlLate = mae(errML.slice(-W));

console.log('Online ML rating verification —', DAYS, 'simulated days, 1 round/day\n');
console.log('MAE vs TRUE difficulty (strokes):');
console.log(`                    days 1-${W}    last ${W} days`);
console.log(`  physics only        ${phEarly.toFixed(2)}          ${phLate.toFixed(2)}`);
console.log(`  physics + ML        ${mlEarly.toFixed(2)}          ${mlLate.toFixed(2)}`);
for (let i = W; i <= DAYS; i += W) {
  console.log(`  ML rolling MAE, days ${String(i - W + 1).padStart(3)}-${String(i).padStart(3)}: ${mae(errML.slice(i - W, i)).toFixed(2)}`);
}
console.log('\nLearned factor adjustments (truth → learned):');
for (const a of computeRatingML(randomConditions(), course, holes, learning).ml.factor_adjustments) {
  if (TRUTH_MULT[a.key] !== 1 || Math.abs(a.multiplier - 1) >= 0.05) {
    console.log(`  ${a.key.padEnd(18)} ×${TRUTH_MULT[a.key].toFixed(2)} → ×${a.multiplier.toFixed(2)}`);
  }
}
console.log(`\nRounds absorbed: ${learning.roundsAbsorbed} · model live MAE (EMA): ${learning.model.maeEma}`);

const improvesWithData = mlLate < mlEarly - 0.05;
const beatsPhysics = mlLate < phLate - 0.1;
console.log(`\n✓ accuracy improves as rounds come in: ${improvesWithData ? 'PASS' : 'FAIL'} (${mlEarly.toFixed(2)} → ${mlLate.toFixed(2)})`);
console.log(`✓ mature model beats pure physics:     ${beatsPhysics ? 'PASS' : 'FAIL'} (${phLate.toFixed(2)} vs ${mlLate.toFixed(2)})`);
if (!improvesWithData || !beatsPhysics) process.exit(1);
