/**
 * ATTESTED Dynamic Rating Engine v2 — Corrected Mathematics
 *
 * Core model: s_ij = θ_i + D_j + ε_ij
 *   θ_i = player ability
 *   D_j = D_base + Σ δ_k(conditions)
 *   ε_ij = noise
 *
 * Corrections from PGA Tour ShotLink calibration:
 *   - Quadratic wind model (drag ∝ v²)
 *   - Piecewise polynomial temperature model
 *   - Fixed elevation sign (was inverted)
 *   - Fixed humidity direction (was inverted)
 *   - Quadratic pin eccentricity (was power-1.5)
 *   - Superlinear Stimp response
 */

// ═══════════════════════════════════════════════════
// CONSTANTS — calibrated from PGA ShotLink / USGA
// ═══════════════════════════════════════════════════

const WIND = {
  HEADWIND_LINEAR: 0.016,      // per mph per yard (was 0.01)
  HEADWIND_QUADRATIC: 0.0004,  // per mph² per yard
  TAILWIND_LINEAR: 0.009,      // asymmetric — tailwind helps less
  TAILWIND_QUADRATIC: 0.00015,
  CROSSWIND_BASE: 0.004,
  CROSSWIND_PAR3_MULT: 1.4,
};

const TEMP = {
  // Piecewise polynomial: reference = 72°F
  COLD_LINEAR: 0.0012,    // per °F below 50
  COLD_QUADRATIC: 0.00006, // per °F² below 50
  COOL_LINEAR: 0.0005,    // per °F, 50-72 range
  WARM_LINEAR: 0.0003,    // per °F, 72-90 range (ball goes farther)
  HOT_LINEAR: 0.0005,     // per °F above 90
  HOT_QUADRATIC: 0.00004,
};

const ELEV = {
  YARDS_PER_FOOT: 0.0023, // +1ft rise ≈ plays 0.23% longer (ShotLink)
};

const HUMIDITY = {
  FACTOR: 0.00002, // per % above 50 — POSITIVE (denser air = shorter)
};

const ALTITUDE = {
  // Sea level baseline. Higher altitude = thinner air = longer ball flight
  BASE_ELEV: 2000, // ft — below this, negligible effect
  FACTOR: 0.00015, // multiplier per 100ft above base
};

const GREEN = {
  PIN_LINEAR: 0.08,       // per unit eccentricity (quadratic model)
  PIN_QUADRATIC: 0.04,    // per unit eccentricity²
  STIMP_LINEAR: 0.10,     // per Stimp unit above baseline
  STIMP_QUADRATIC: 0.008, // superlinear — faster = harder
  BUNKER_FACTOR: 0.04,    // per bunker
  SIZE_BASELINE: 5500,    // sq ft
};

const PIN_SLOPE = {
  // Slope at the pin (measured by laying a phone at the cup, or from a
  // contour map). Baseline pinnable slope ≈ 1.5%. Difficulty grows
  // superlinearly and is amplified by green speed (3% at stimp 12 is a
  // different sport than 3% at stimp 9).
  REF_PCT: 1.5,
  LINEAR: 0.05,        // strokes per % above baseline at baseline stimp
  QUADRATIC: 0.022,    // per %² above baseline
  DOWNHILL_RELIEF: 0.02, // per % below baseline (flat pins putt easier)
  SPEED_EXP: 1.6,      // (stimp/baseline)^exp multiplier
};

const FIRMNESS = {
  soft:   { dist: -0.003, green: -0.02, stopping: 0.8 },
  medium: { dist: 0,      green: 0,     stopping: 1.0 },
  firm:   { dist: 0.003,  green: 0.04,  stopping: 1.3 },
};

const PRECIP = { none: 0, light_rain: 0.05, rain: 0.12, heavy_rain: 0.25 };
const SHAPE_MULT = { round: 1.0, oblong: 1.05, kidney: 1.12, tiered: 1.2 };

const PIN_OFFSETS = {
  center: [0, 0], front: [0, -8], back: [0, 8],
  front_left: [-5, -7], front_right: [5, -7],
  back_left: [-5, 7], back_right: [5, 7],
};
const TEE_ADJ = { forward: -25, middle: 0, back: 20 };

const WMO_DESC = {
  0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
  45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Dense drizzle",
  61:"Light rain",63:"Moderate rain",65:"Heavy rain",66:"Freezing rain",
  67:"Heavy freezing rain",71:"Light snow",73:"Snow",75:"Heavy snow",
  80:"Light showers",81:"Showers",82:"Heavy showers",
  95:"Thunderstorm",96:"T-storm w/ hail",99:"Severe t-storm",
};
const WMO_PRECIP = {
  0:"none",1:"none",2:"none",3:"none",45:"none",48:"none",
  51:"light_rain",53:"light_rain",55:"rain",
  61:"light_rain",63:"rain",65:"heavy_rain",66:"rain",67:"heavy_rain",
  71:"light_rain",73:"rain",75:"heavy_rain",
  80:"light_rain",81:"rain",82:"heavy_rain",
  95:"heavy_rain",96:"heavy_rain",99:"heavy_rain",
};

// ═══════════════════════════════════════════════════
// PHYSICS FUNCTIONS
// ═══════════════════════════════════════════════════

/**
 * Decompose wind vector into headwind/crosswind relative to hole heading
 */
export function windComponents(windSpeedMph, windDirDeg, holeHeading) {
  const rad = ((windDirDeg - holeHeading) * Math.PI) / 180;
  // crosswind_lr: signed, + = wind blowing LEFT-TO-RIGHT across the hole
  // (wind direction is "from"; wind from the player's left pushes the ball right)
  return {
    headwind: windSpeedMph * Math.cos(rad),
    crosswind: Math.abs(windSpeedMph * Math.sin(rad)),
    crosswind_lr: +(-windSpeedMph * Math.sin(rad)).toFixed(1),
  };
}

/**
 * Quadratic wind distance adjustment (drag ∝ v²)
 */
function windDistanceAdjustment(yards, headwindMph) {
  if (headwindMph > 0) {
    // Headwind: quadratic penalty
    const linear = WIND.HEADWIND_LINEAR * yards * headwindMph;
    const quad = WIND.HEADWIND_QUADRATIC * yards * headwindMph * headwindMph;
    return linear + quad;
  } else {
    // Tailwind: asymmetric bonus (less than headwind penalty)
    const tw = Math.abs(headwindMph);
    const linear = WIND.TAILWIND_LINEAR * yards * tw;
    const quad = WIND.TAILWIND_QUADRATIC * yards * tw * tw;
    return -(linear + quad);
  }
}

/**
 * Piecewise polynomial temperature adjustment
 * Reference: 72°F (USGA standard)
 */
function temperatureDistanceAdjustment(yards, tempF) {
  const T = tempF;
  if (T < 50) {
    // Cold: quadratic loss (ball compression + air density)
    const delta = 72 - T;
    return yards * (TEMP.COLD_LINEAR * delta + TEMP.COLD_QUADRATIC * delta * delta);
  } else if (T <= 72) {
    // Cool: linear
    const delta = 72 - T;
    return yards * TEMP.COOL_LINEAR * delta;
  } else if (T <= 90) {
    // Warm: ball flies farther (negative = plays shorter)
    const delta = T - 72;
    return -(yards * TEMP.WARM_LINEAR * delta);
  } else {
    // Hot: quadratic gain
    const delta = T - 72;
    return -(yards * (TEMP.HOT_LINEAR * delta + TEMP.HOT_QUADRATIC * delta * delta));
  }
}

/**
 * Corrected effective playing distance
 */
export function effectiveDistance(yards, headwindMph, elevFt, tempF, humPct, altFt, firmness) {
  let eff = yards;

  // 1. Wind (quadratic)
  eff += windDistanceAdjustment(yards, headwindMph);

  // 2. Elevation — CORRECTED SIGN: uphill = plays longer, downhill = plays shorter
  eff += elevFt * ELEV.YARDS_PER_FOOT;

  // 3. Temperature (piecewise polynomial)
  eff += temperatureDistanceAdjustment(yards, tempF);

  // 4. Humidity — CORRECTED DIRECTION: higher humidity = denser air = shorter flight
  eff += (humPct - 50) * yards * HUMIDITY.FACTOR;

  // 5. Altitude — thinner air = longer flight
  const altAboveBase = Math.max(altFt - ALTITUDE.BASE_ELEV, 0);
  const altMultiplier = 1 - (altAboveBase * ALTITUDE.FACTOR / 100);
  eff *= altMultiplier;

  // 6. Firmness
  const ff = FIRMNESS[firmness] || FIRMNESS.medium;
  eff -= ff.dist * yards;

  return eff;
}

/**
 * Green difficulty: D(p, S) — quadratic pin eccentricity model
 * Corrected from power-1.5 to empirical quadratic
 */
export function greenDifficulty(pin, gsize, shape, tiers, stimp, stimpBase, bunkers, firmness) {
  let d = 0;
  const off = PIN_OFFSETS[pin] || [0, 0];
  const pinDist = Math.sqrt(off[0] ** 2 + off[1] ** 2);
  const gradius = Math.sqrt(gsize / Math.PI) / 3;
  const eccen = pinDist / Math.max(gradius, 5);

  // Pin position: quadratic in eccentricity (ShotLink calibrated)
  let pinD = GREEN.PIN_LINEAR * eccen + GREEN.PIN_QUADRATIC * eccen * eccen;
  pinD *= (1 + bunkers * GREEN.BUNKER_FACTOR);

  // Shape and tier multipliers
  const tierM = 1 + (tiers - 1) * 0.15;
  const shapeM = SHAPE_MULT[shape] || 1;
  pinD *= tierM * shapeM;
  d += pinD;

  // Stimp: superlinear (each unit makes breaks exponentially harder)
  const sd = stimp - stimpBase;
  const se = GREEN.STIMP_LINEAR * sd + GREEN.STIMP_QUADRATIC * sd * sd;
  d += se * tierM * shapeM;

  // Firmness on green
  const ff = FIRMNESS[firmness] || FIRMNESS.medium;
  d += ff.green * tierM;

  // Green size relative to baseline
  const sf = GREEN.SIZE_BASELINE / Math.max(gsize, 2000);
  if (sf > 1) d += (sf - 1) * 0.05;
  else d -= (1 - sf) * 0.02;

  return d;
}

/**
 * Green difficulty from MEASURED pin data (engine v3).
 * pinData: {
 *   slope_pct           — surface slope % at the cup (phone-on-green or contour map)
 *   dist_from_center_ft — pin distance from green center (GPS-derived), optional
 * }
 * Replaces the bucket model (front/back/center) when real data exists.
 */
export function greenDifficultyMeasured(pinData, gsize, shape, tiers, stimp, stimpBase, bunkers, firmness) {
  let d = 0;
  const tierM = 1 + (tiers - 1) * 0.15;
  const shapeM = SHAPE_MULT[shape] || 1;
  const speedM = Math.pow(Math.max(stimp, 6) / Math.max(stimpBase, 6), PIN_SLOPE.SPEED_EXP);

  // 1. Slope at the pin × green speed — the dominant term
  const slope = pinData.slope_pct ?? PIN_SLOPE.REF_PCT;
  const ds = slope - PIN_SLOPE.REF_PCT;
  if (ds >= 0) {
    d += (PIN_SLOPE.LINEAR * ds + PIN_SLOPE.QUADRATIC * ds * ds) * speedM;
  } else {
    d -= PIN_SLOPE.DOWNHILL_RELIEF * Math.abs(ds);
  }

  // 2. Pin eccentricity from measured distance (falls back to center)
  if (pinData.dist_from_center_ft != null) {
    const gradiusFt = Math.sqrt(Math.max(gsize, 2000) / Math.PI); // actual radius, ft
    const eccen = Math.min(pinData.dist_from_center_ft / gradiusFt, 1.2);
    let pinD = GREEN.PIN_LINEAR * eccen + GREEN.PIN_QUADRATIC * eccen * eccen;
    pinD *= (1 + bunkers * GREEN.BUNKER_FACTOR);
    d += pinD * tierM * shapeM;
  }

  // 3. Raw stimp term (same as bucket model)
  const sd = stimp - stimpBase;
  d += (GREEN.STIMP_LINEAR * sd + GREEN.STIMP_QUADRATIC * sd * sd) * tierM * shapeM;

  // 4. Firmness + size (same as bucket model)
  const ff = FIRMNESS[firmness] || FIRMNESS.medium;
  d += ff.green * tierM;
  const sf = GREEN.SIZE_BASELINE / Math.max(gsize, 2000);
  if (sf > 1) d += (sf - 1) * 0.05;
  else d -= (1 - sf) * 0.02;

  return d;
}

/**
 * Compute per-hole difficulty delta.
 * Engine v3 optional measured inputs on conds:
 *   pin_data: { [holeNum]: { slope_pct, dist_from_center_ft } }
 *   tee_data: { [holeNum]: { offset_yds } }  — measured marker offset
 *     (from geo.teeOffsetYds; + = back/longer). Overrides bucket presets.
 */
export function computeHole(hole, conds) {
  const teeBox = conds.tee_box || 'black';
  const baseYds = hole.yds[teeBox] || hole.yds.black;
  const teeData = conds.tee_data?.[hole.hole];
  const teeAdj = teeData?.offset_yds != null
    ? teeData.offset_yds
    : (TEE_ADJ[conds.tee_adjustments?.[hole.hole] || 'middle'] || 0);
  const actualYds = baseYds + teeAdj;
  const { headwind, crosswind, crosswind_lr } = windComponents(
    conds.wind_speed_mph || 0, conds.wind_direction_deg || 0, hole.heading
  );

  const effDist = effectiveDistance(
    actualYds, headwind, hole.elev, conds.temperature_f || 72,
    conds.humidity_pct || 50, conds.altitude_ft || 0, conds.firmness || 'medium'
  );

  const comp = {};

  // Wind distance component
  const wEff = effectiveDistance(actualYds, headwind, 0, 72, 50, 0, 'medium');
  const wNeut = effectiveDistance(actualYds, 0, 0, 72, 50, 0, 'medium');
  comp.wind_distance = +((wEff - wNeut) * 0.004).toFixed(5);

  // Crosswind component
  let cwd = crosswind * WIND.CROSSWIND_BASE;
  if (hole.par === 3) cwd *= WIND.CROSSWIND_PAR3_MULT;
  if (hole.fwWidth > 0) cwd *= Math.max(0.7, 35 / hole.fwWidth);
  cwd *= (1 - hole.trees * 0.004);
  comp.crosswind = +cwd.toFixed(5);

  // Temperature component
  const tEff = effectiveDistance(actualYds, 0, 0, conds.temperature_f || 72, 50, 0, 'medium');
  const tNeut = effectiveDistance(actualYds, 0, 0, 72, 50, 0, 'medium');
  comp.temperature = +((tEff - tNeut) * 0.004).toFixed(5);

  // Tee position
  comp.tee_position = +(teeAdj * 0.004).toFixed(5);

  // Green difficulty — measured pin data wins over bucket presets
  const pinData = conds.pin_data?.[hole.hole];
  const pin = conds.pin_positions?.[hole.hole] || 'center';
  comp.green_difficulty = +(pinData
    ? greenDifficultyMeasured(
        pinData, hole.gsize, hole.shape, hole.tiers,
        conds.green_speed_stimp || 10.5, 10.5, hole.bunkers, conds.firmness || 'medium'
      )
    : greenDifficulty(
        pin, hole.gsize, hole.shape, hole.tiers,
        conds.green_speed_stimp || 10.5, 10.5, hole.bunkers, conds.firmness || 'medium'
      )
  ).toFixed(5);

  // Precipitation
  let pb = PRECIP[conds.precipitation] || 0;
  if (hole.water && conds.precipitation !== 'none') pb *= 1.4;
  comp.precipitation = +pb.toFixed(5);

  // Rough height
  const roughD = (conds.rough_height_inches || 2.5) - 2.5;
  let rd = roughD * 0.04;
  if (hole.fwWidth > 0) rd *= (1 + Math.max(0.15, (40 - hole.fwWidth) / 60));
  else rd *= 0.3;
  if (hole.ob) rd *= hole.ob === 'both' ? 1.2 : 1.1;
  comp.rough_height = +rd.toFixed(5);

  // Firmness
  const ff = FIRMNESS[conds.firmness || 'medium'] || FIRMNESS.medium;
  comp.firmness = +(ff.green * 0.5).toFixed(5);

  const total = Object.values(comp).reduce((s, v) => s + v, 0);

  return {
    hole: hole.hole, par: hole.par, yardage: baseYds,
    actual_yardage: actualYds, effective_yardage: Math.round(effDist),
    headwind_mph: +headwind.toFixed(1), crosswind_mph: +crosswind.toFixed(1),
    crosswind_lr_mph: crosswind_lr,
    difficulty_delta: +total.toFixed(4),
    components: Object.fromEntries(Object.entries(comp).map(([k, v]) => [k, +v.toFixed(4)])),
    pin_position: pin, handicap_index: hole.hcp,
    // Data provenance — what fed this hole's number
    data_source: {
      pin: pinData ? 'measured' : 'preset',
      tee: teeData?.offset_yds != null ? 'measured' : 'preset',
      pin_slope_pct: pinData?.slope_pct ?? null,
      tee_offset_yds: teeData?.offset_yds ?? null,
    },
  };
}

/**
 * Compute full course rating for current conditions.
 * Optional `calibration` ({ factors: {factor: multiplier} }) is the output
 * of the empirical-Bayes layer in calibration.js — per-factor multipliers
 * learned from how the field actually scored vs prediction.
 */
export function computeRating(conds, courseData, holes, calibration = null) {
  const teeBox = conds.tee_box || 'black';
  const teeInfo = courseData.tee_boxes[teeBox] || courseData.tee_boxes.black;
  const hrs = holes.map(h => {
    const r = computeHole(h, { ...conds, altitude_ft: courseData.altitude_ft });
    if (calibration?.factors) {
      r.components = Object.fromEntries(
        Object.entries(r.components).map(([k, v]) => [k, +(v * (calibration.factors[k] ?? 1)).toFixed(4)])
      );
      r.difficulty_delta = +Object.values(r.components).reduce((s, v) => s + v, 0).toFixed(4);
    }
    return r;
  });
  const totalDelta = hrs.reduce((s, h) => s + h.difficulty_delta, 0);

  const todayRating = +(teeInfo.rating + totalDelta).toFixed(1);
  const slopeAmp = 1 + (totalDelta / teeInfo.rating) * 2.5;
  const todaySlope = Math.max(55, Math.min(155, Math.round(teeInfo.slope * slopeAmp)));

  const fkeys = ['wind_distance', 'crosswind', 'temperature', 'tee_position',
    'green_difficulty', 'precipitation', 'rough_height', 'firmness'];
  const factorSummary = {};
  fkeys.forEach(k => {
    factorSummary[k] = +hrs.reduce((s, h) => s + (h.components[k] || 0), 0).toFixed(2);
  });

  const frontD = +hrs.slice(0, 9).reduce((s, h) => s + h.difficulty_delta, 0).toFixed(2);
  const backD = +hrs.slice(9).reduce((s, h) => s + h.difficulty_delta, 0).toFixed(2);
  const sorted = [...hrs].sort((a, b) => b.difficulty_delta - a.difficulty_delta);
  sorted.forEach((h, i) => {
    const r = hrs.find(x => x.hole === h.hole);
    if (r) r.difficulty_rank = i + 1;
  });

  const d = +totalDelta.toFixed(1);
  const label = d <= -1.5 ? 'Playing Easy' : d <= -0.5 ? 'Slightly Easier'
    : d <= 0.5 ? 'Near Rated' : d <= 2 ? 'Playing Tough'
    : d <= 4 ? 'Very Tough' : d <= 7 ? 'Brutally Hard' : 'Extreme';

  return {
    course: courseData, tee_box: teeBox, tee_box_yardage: teeInfo.yardage,
    today_rating: todayRating, usga_static_rating: teeInfo.rating,
    rating_delta: +totalDelta.toFixed(1),
    today_slope: todaySlope, usga_static_slope: teeInfo.slope,
    slope_delta: todaySlope - teeInfo.slope,
    difficulty_label: label, hole_difficulties: hrs,
    hardest_holes: sorted.slice(0, 3).map(h => h.hole),
    easiest_holes: sorted.slice(-3).map(h => h.hole),
    front_nine_delta: frontD, back_nine_delta: backD,
    factor_summary: factorSummary,
    // Provenance summary — how much of today's rating is measured vs preset
    data_quality: {
      measured_pins: hrs.filter(h => h.data_source.pin === 'measured').length,
      measured_tees: hrs.filter(h => h.data_source.tee === 'measured').length,
      calibrated: !!calibration?.factors,
      calibration_observations: calibration?.observations ?? 0,
    },
  };
}

export { WMO_DESC, WMO_PRECIP, FIRMNESS, PRECIP };
