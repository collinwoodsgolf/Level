/**
 * LEVEL GOLF — Player Insights engine
 *
 * Joins a player's hole-by-hole scores with the conditions each hole was
 * rated under, then asks: in which conditions does this player bleed
 * strokes (or quietly excel) relative to their own baseline?
 *
 * Method (strokes-gained-style, player-relative):
 *   baseline   = player's mean (score − par − hole_difficulty_delta)
 *   for each condition bucket (e.g. L→R crosswind > 7 mph):
 *     effect   = mean in-bucket residual − baseline   (strokes/hole)
 *     se       = sd/√n; report when n ≥ MIN_N and |effect| ≥ MIN_EFFECT
 *   shrinkage  = n/(n+K) damps small samples (same philosophy as the
 *                rating calibrator). Confidence label from |effect|/se.
 *
 * Gets sharper automatically as more attested rounds accumulate.
 */

const MIN_N = 6;          // holes of exposure before we'll say anything
const MIN_EFFECT = 0.12;  // strokes/hole worth mentioning
const SHRINK_K = 10;

// Condition buckets. Each extracts exposure from a hole record:
// { par, score, conds: { crosswind_lr, headwind, pin_slope_pct, stimp,
//   rough_in, temp_f, precipitation, difficulty_delta } }
//
// Wind buckets are HANDEDNESS-AWARE (set in Account → Player Information):
// a left-to-right wind is a righty's fade side but a lefty's draw side, so
// the labels and tips flip. TODO: same treatment for putt break direction
// once green-contour putt data exists.
export function buildBuckets(handedness = 'right') {
  const righty = handedness !== 'left';
  const fadeTip = righty
    ? 'Wind pushes toward your fade side — favor a draw or aim further left and let it ride.'
    : 'Wind pushes toward your fade side — favor a draw or aim further right and let it ride.';
  const drawTip = righty
    ? 'Wind helps your natural shot — start it right and let it feed back.'
    : 'Wind helps your natural shot — start it left and let it feed back.';
  return [
  {
    key: 'xwind_lr', icon: '🌬️',
    label: `Left-to-right crosswinds (your ${righty ? 'fade' : 'draw'} side)`,
    test: h => h.conds.crosswind_lr >= 7,
    tip: righty ? fadeTip : drawTip,
  },
  {
    key: 'xwind_rl', icon: '🌬️',
    label: `Right-to-left crosswinds (your ${righty ? 'draw' : 'fade'} side)`,
    test: h => h.conds.crosswind_lr <= -7,
    tip: righty ? drawTip : fadeTip,
  },
  {
    key: 'headwind', icon: '💨', label: 'Strong headwinds (10+ mph)',
    test: h => h.conds.headwind >= 10,
    tip: 'Club up two and swing easier — spin is the enemy into the wind.',
  },
  {
    key: 'tailwind', icon: '🍃', label: 'Tailwind holes',
    test: h => h.conds.headwind <= -8,
    tip: 'Land it shorter — tailwind kills stopping power.',
  },
  {
    key: 'steep_pin', icon: '⛳', label: 'Pins on 3%+ slope',
    test: h => (h.conds.pin_slope_pct ?? 0) >= 3,
    tip: 'Leave approach shots BELOW steep pins; an uphill 12-footer beats a downhill 6-footer.',
  },
  {
    key: 'fast_greens', icon: '🟢', label: 'Fast greens (stimp 12+)',
    test: h => (h.conds.stimp ?? 10.5) >= 12,
    tip: 'Die putts at the hole on fast days — your normal pace is a 4-footer coming back.',
  },
  {
    key: 'deep_rough', icon: '🌿', label: 'Deep rough days (3.5"+)',
    test: h => (h.conds.rough_in ?? 2.5) >= 3.5,
    tip: 'Take the medicine: wedge back to the fairway instead of forcing long irons from deep rough.',
  },
  {
    key: 'cold', icon: '🥶', label: 'Cold weather (under 55°F)',
    test: h => (h.conds.temp_f ?? 70) < 55,
    tip: 'Ball flies ~1 club shorter in the cold — trust the math, not your ego yardage.',
  },
  {
    key: 'wet', icon: '🌧️', label: 'Wet conditions',
    test: h => h.conds.precipitation && h.conds.precipitation !== 'none',
    tip: 'Play for almost no roll-out and take more club off the tee.',
  },
  ];
}

// Default buckets (right-handed) for backward compatibility
export const BUCKETS = buildBuckets('right');

/** Per-hole residual vs the player's own expectation */
function residual(h) {
  // score relative to par, minus what conditions said the hole should cost
  return (h.score - h.par) - (h.conds.difficulty_delta || 0);
}

/**
 * Main analysis.
 * holeRecords: array of { round_id, hole, par, score, conds: {...} }
 * Returns { baseline, totalHoles, rounds, insights: [...] } where each
 * insight = { key, icon, label, effect, n, se, confidence, kind, tip }
 */
export function analyzePlayer(holeRecords, { handedness = 'right' } = {}) {
  if (!holeRecords || holeRecords.length < 18) {
    return { baseline: null, totalHoles: holeRecords?.length || 0, insights: [], needMore: true };
  }
  const residuals = holeRecords.map(residual);
  const baseline = residuals.reduce((s, v) => s + v, 0) / residuals.length;

  const buckets = buildBuckets(handedness);
  const insights = [];
  for (const b of buckets) {
    const inB = holeRecords.filter(b.test);
    if (inB.length < MIN_N) continue;
    const rs = inB.map(residual);
    const mean = rs.reduce((s, v) => s + v, 0) / rs.length;
    const sd = Math.sqrt(rs.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(rs.length - 1, 1));
    const rawEffect = mean - baseline;
    const effect = (inB.length / (inB.length + SHRINK_K)) * rawEffect; // shrink
    if (Math.abs(effect) < MIN_EFFECT) continue;
    const se = sd / Math.sqrt(inB.length);
    const z = Math.abs(effect) / Math.max(se, 0.01);
    insights.push({
      key: b.key,
      icon: b.icon,
      label: b.label,
      effect: +effect.toFixed(2),
      per18: +(effect * 18).toFixed(1),
      n: inB.length,
      se: +se.toFixed(2),
      confidence: z >= 2 ? 'high' : z >= 1.2 ? 'medium' : 'low',
      kind: effect > 0 ? 'weakness' : 'strength',
      tip: b.tip,
    });
  }
  insights.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));

  const rounds = new Set(holeRecords.map(h => h.round_id)).size;
  return {
    baseline: +baseline.toFixed(2),
    totalHoles: holeRecords.length,
    rounds,
    insights,
    needMore: false,
  };
}

/** Human sentence for an insight card */
export function insightSentence(ins) {
  const dir = ins.kind === 'weakness' ? 'lose' : 'gain';
  const mag = Math.abs(ins.effect).toFixed(2);
  const per18 = Math.abs(ins.per18).toFixed(1);
  return `You ${dir} ${mag} strokes per hole in ${ins.label.toLowerCase()} — about ${per18} per round vs your baseline.`;
}

// ─── Mock attested hole history (replace with real round data) ───
// Synthetic but realistic: ~10-handicap with a real L→R wind problem,
// trouble on steep pins, and a genuine tailwind/fast-green strength.

function lcg(seed) { let s = seed; return () => (s = (s * 48271) % 2147483647) / 2147483647; }

export function generateMockHistory() {
  const rnd = lcg(20260609);
  const records = [];
  const pars = [4,5,3,4,4,5,4,3,4,4,4,3,5,4,5,4,3,4];
  const headings = [35,310,195,85,155,270,350,120,240,165,45,280,200,75,330,110,225,305];
  for (let r = 0; r < 8; r++) {
    const windDir = Math.floor(rnd() * 360);
    const windSpd = 5 + rnd() * 14;
    const stimp = 9.5 + rnd() * 3.5;
    const rough = 2 + rnd() * 2.2;
    const temp = 48 + rnd() * 38;
    const precip = rnd() < 0.18 ? 'light_rain' : 'none';
    for (let i = 0; i < 18; i++) {
      const rel = ((windDir - headings[i]) * Math.PI) / 180;
      const headwind = +(windSpd * Math.cos(rel)).toFixed(1);
      const xlr = +(-windSpd * Math.sin(rel)).toFixed(1);
      const pinSlope = +(1 + rnd() * 2.8).toFixed(1);
      const dd = +(0.05 + rnd() * 0.25).toFixed(2);
      // base scoring: bogey golfer-ish noise
      let over = 0.55 + (rnd() - 0.5) * 1.6 + dd;
      // planted patterns:
      if (xlr >= 7) over += 0.45;                    // L→R wind weakness
      if (pinSlope >= 3) over += 0.35;               // steep-pin weakness
      if (headwind <= -8) over -= 0.30;              // tailwind strength
      if (stimp >= 12) over -= 0.15;                 // fast greens: actually fine
      const score = pars[i] + Math.max(-2, Math.round(over + (rnd() - 0.5)));
      records.push({
        round_id: 'mock_' + r,
        hole: i + 1,
        par: pars[i],
        score,
        conds: {
          crosswind_lr: xlr, headwind, pin_slope_pct: pinSlope,
          stimp: +stimp.toFixed(1), rough_in: +rough.toFixed(1),
          temp_f: Math.round(temp), precipitation: precip,
          difficulty_delta: dd,
        },
      });
    }
  }
  return records;
}
