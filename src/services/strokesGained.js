/**
 * LEVEL GOLF — Strokes Gained (manual entry v1)
 *
 * Simplified Broadie-style decomposition from four inputs per hole:
 * score, putts, fairway hit (FIR), green in regulation (GIR).
 *
 * Baseline = scratch golfer on this hole UNDER TODAY'S CONDITIONS:
 *   expected = par + hole difficulty_delta (from the locked rating snapshot)
 * so a bogey on a hole playing +0.4 today loses less than a bogey on a
 * calm day — strokes gained that respects the weather, like everything else.
 *
 * Total SG = expected − score, decomposed:
 *   PUTTING : expected putts (2.00 on GIR, 1.55 scrambling) − actual putts
 *   TEE     : par 4/5 only; FIR vs ~59% scratch baseline
 *   APPROACH / SHORT: the remainder, split by whether the green was hit
 *
 * TODO(GPS): replace manual inputs with shot-by-shot positions from phone
 * GPS → full lie/distance-based SG, no typing. The aggregation and UI
 * layers are already shaped for it.
 */

const EXP_PUTTS_GIR = 2.0;     // ~33 ft first putt
const EXP_PUTTS_MISS = 1.55;   // after a chip/pitch
const FIR_BASELINE = 0.59;     // scratch fairway rate
const FIR_VALUE = 0.55;        // strokes between fairway and rough/trouble tee ball

/**
 * Per-hole strokes gained.
 * stats: { score, putts, fir (bool|null for par 3), gir (bool) }
 * hole:  { par, difficulty_delta } — delta from the LOCKED round snapshot
 */
export function computeHoleSG(stats, hole) {
  const { score, putts, fir, gir } = stats;
  if (!score || putts == null) return null;
  const expected = hole.par + (hole.difficulty_delta || 0);
  const total = +(expected - score).toFixed(2);

  // Putting
  const expPutts = gir ? EXP_PUTTS_GIR : EXP_PUTTS_MISS;
  const putting = +(expPutts - putts).toFixed(2);

  // Tee (driving holes only)
  let tee = 0;
  if (hole.par >= 4 && fir != null) {
    tee = +(fir ? (1 - FIR_BASELINE) * FIR_VALUE : -FIR_BASELINE * FIR_VALUE).toFixed(2);
  }

  // Remainder → approach + short game
  const remainder = +(total - putting - tee).toFixed(2);
  let approach, short;
  if (gir) {
    approach = remainder; short = 0;            // hit the green: long game did it
  } else {
    approach = +(remainder * 0.6).toFixed(2);   // missed: blame mostly approach,
    short = +(remainder - approach).toFixed(2); // rest on the short game
  }

  return { total, tee, approach, short, putting };
}

/**
 * Round aggregate.
 * holeStats: { [holeNum]: stats }, holesMeta: { [holeNum]: { par, difficulty_delta } }
 */
export function aggregateRoundSG(holeStats, holesMeta) {
  const cats = { tee: 0, approach: 0, short: 0, putting: 0, total: 0 };
  let holes = 0;
  for (const [num, stats] of Object.entries(holeStats || {})) {
    const meta = holesMeta?.[num];
    if (!meta) continue;
    const sg = computeHoleSG(stats, meta);
    if (!sg) continue;
    holes += 1;
    for (const k of Object.keys(cats)) cats[k] += sg[k];
  }
  if (!holes) return null;
  return {
    holes,
    tee: +cats.tee.toFixed(1),
    approach: +cats.approach.toFixed(1),
    short: +cats.short.toFixed(1),
    putting: +cats.putting.toFixed(1),
    total: +cats.total.toFixed(1),
  };
}

export const SG_LABELS = {
  tee: 'Off the Tee', approach: 'Approach', short: 'Around Green', putting: 'Putting',
};
