/**
 * LEVEL GOLF — Geospatial utilities
 * Crowdsourced pin/tee localization: robust clustering of phone GPS fixes
 * (staff "morning mark" + player fixes throughout the day).
 */

const EARTH_R_YDS = 6371000 * 1.09361; // earth radius in yards

/** Great-circle distance in yards between {lat, lon} points */
export function haversineYds(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_YDS * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Initial bearing in degrees from a to b */
export function bearingDeg(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Geometric median of GPS fixes (Weiszfeld's algorithm).
 * More robust to outliers than the centroid.
 */
export function geometricMedian(points, iterations = 50) {
  if (!points.length) return null;
  if (points.length === 1) return { ...points[0] };
  let lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  let lon = points.reduce((s, p) => s + p.lon, 0) / points.length;
  for (let i = 0; i < iterations; i++) {
    let numLat = 0, numLon = 0, den = 0;
    for (const p of points) {
      const d = Math.max(haversineYds({ lat, lon }, p), 1e-6);
      numLat += p.lat / d;
      numLon += p.lon / d;
      den += 1 / d;
    }
    const nLat = numLat / den, nLon = numLon / den;
    if (Math.abs(nLat - lat) < 1e-9 && Math.abs(nLon - lon) < 1e-9) break;
    lat = nLat; lon = nLon;
  }
  return { lat, lon };
}

/**
 * Robust position estimate from raw fixes.
 * fixes: [{ lat, lon, accuracy_yds?, source?: 'staff'|'player', weight? }]
 * Staff fixes get 5x weight (they stood at the cup on purpose).
 * Returns { lat, lon, accuracy_yds, n, sources }.
 */
export function robustPositionEstimate(fixes) {
  if (!fixes?.length) return null;
  // Expand by weight (staff marks count as multiple fixes)
  const expanded = [];
  for (const f of fixes) {
    const w = f.weight ?? (f.source === 'staff' ? 5 : 1);
    for (let i = 0; i < w; i++) expanded.push(f);
  }
  // First pass median, then drop outliers > 3 * MAD (min 5 yds)
  const med0 = geometricMedian(expanded);
  const dists = expanded.map(p => haversineYds(med0, p)).sort((a, b) => a - b);
  const mad = dists[Math.floor(dists.length / 2)] || 1;
  const cutoff = Math.max(3 * mad, 5);
  const kept = expanded.filter(p => haversineYds(med0, p) <= cutoff);
  const med = geometricMedian(kept.length ? kept : expanded);
  const keptDists = (kept.length ? kept : expanded).map(p => haversineYds(med, p));
  // 68th percentile spread / sqrt(n) ≈ standard error of the estimate
  keptDists.sort((a, b) => a - b);
  const p68 = keptDists[Math.floor(keptDists.length * 0.68)] || 2;
  const distinct = fixes.length;
  const accuracy = +(Math.max(0.5, p68 / Math.sqrt(Math.max(distinct, 1)))).toFixed(1);
  return {
    lat: med.lat,
    lon: med.lon,
    accuracy_yds: accuracy,
    n: distinct,
    sources: {
      staff: fixes.filter(f => f.source === 'staff').length,
      player: fixes.filter(f => f.source !== 'staff').length,
    },
  };
}

/**
 * Signed tee offset in yards relative to the surveyed reference marker.
 * Positive = markers moved BACK (hole plays longer).
 * referenceTee/measuredTee: {lat, lon}; holeHeading: degrees tee→green.
 */
export function teeOffsetYds(referenceTee, measuredTee, holeHeading) {
  if (!referenceTee || !measuredTee) return 0;
  const dist = haversineYds(referenceTee, measuredTee);
  if (dist < 1) return 0;
  const brg = bearingDeg(referenceTee, measuredTee);
  // Component of displacement along the line of play.
  // Moved toward the green (same direction as heading) = plays shorter.
  const rad = ((brg - holeHeading) * Math.PI) / 180;
  const along = dist * Math.cos(rad);
  return +(-along).toFixed(1); // toward green → negative offset (shorter)
}

/** Distance in feet from pin to green center, from coordinates */
export function pinDistFromCenterFt(greenCenter, pin) {
  if (!greenCenter || !pin) return null;
  return +(haversineYds(greenCenter, pin) * 3).toFixed(1);
}
