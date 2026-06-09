/**
 * LEVEL GOLF — The Loop (social) + handicap engine
 *
 * Handicaps here are tied to the DYNAMIC course rating: each round's
 * differential is computed against the rating/slope the course was actually
 * playing to that day — not the static USGA plaque number.
 *
 *   differential = (score − dynamic_rating) × 113 / dynamic_slope
 *   index        = avg of best 8 of last 20 differentials (WHS-style)
 */

// ─── Handicap math ───

export function roundDifferential(score, dynamicRating, dynamicSlope) {
  return +(((score - dynamicRating) * 113) / dynamicSlope).toFixed(1);
}

export function computeHandicapIndex(rounds) {
  if (!rounds?.length) return null;
  const diffs = rounds
    .slice(0, 20)
    .map(r => r.differential ?? roundDifferential(r.score, r.dynamicRating, r.dynamicSlope))
    .sort((a, b) => a - b);
  // WHS-style: scale how many diffs count by sample size
  const countMap = [1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8];
  const n = Math.min(diffs.length, 20);
  const use = countMap[n - 1];
  const avg = diffs.slice(0, use).reduce((s, d) => s + d, 0) / use;
  return +(avg * 0.96).toFixed(1);
}

// ─── Mock data (replace with backend) ───

const COURSE = 'Manhattan Woods GC';

export const MY_ROUNDS = [
  { id: 'r1', date: '2026-06-07', course: COURSE, tee: 'Black', score: 84, dynamicRating: 76.8, dynamicSlope: 146, staticRating: 75.0, staticSlope: 141, weather: '18 mph gusts, firm', attested: true },
  { id: 'r2', date: '2026-05-31', course: COURSE, tee: 'Black', score: 81, dynamicRating: 74.6, dynamicSlope: 139, staticRating: 75.0, staticSlope: 141, weather: 'Calm, 72°F', attested: true },
  { id: 'r3', date: '2026-05-24', course: COURSE, tee: 'Gold', score: 79, dynamicRating: 73.4, dynamicSlope: 137, staticRating: 72.8, staticSlope: 136, weather: 'Light rain', attested: true },
  { id: 'r4', date: '2026-05-17', course: COURSE, tee: 'Black', score: 88, dynamicRating: 77.9, dynamicSlope: 149, staticRating: 75.0, staticSlope: 141, weather: 'Tournament setup, 13 stimp', attested: true },
  { id: 'r5', date: '2026-05-09', course: COURSE, tee: 'Black', score: 83, dynamicRating: 75.2, dynamicSlope: 142, staticRating: 75.0, staticSlope: 141, weather: 'Seasonal', attested: false },
  { id: 'r6', date: '2026-05-02', course: COURSE, tee: 'Gold', score: 80, dynamicRating: 72.1, dynamicSlope: 133, staticRating: 72.8, staticSlope: 136, weather: 'Soft, forward tees', attested: true },
].map(r => ({ ...r, differential: roundDifferential(r.score, r.dynamicRating, r.dynamicSlope) }));

export const FRIENDS = [
  { id: 'f1', name: 'Marcus Chen', initials: 'MC', handicap: 4.2, trend: -0.3, rounds: 31, home: COURSE },
  { id: 'f2', name: 'Sofia Reyes', initials: 'SR', handicap: 11.8, trend: -0.8, rounds: 18, home: 'Rockland CC' },
  { id: 'f3', name: 'Jake Whitman', initials: 'JW', handicap: 7.5, trend: +0.4, rounds: 24, home: COURSE },
  { id: 'f4', name: 'Priya Patel', initials: 'PP', handicap: 15.1, trend: -1.2, rounds: 12, home: 'Blue Hill GC' },
  { id: 'f5', name: 'Tom Okafor', initials: 'TO', handicap: 2.9, trend: 0.0, rounds: 40, home: COURSE },
];

export const LOOP_FEED = [
  {
    id: 'p1', friendId: 'f1', name: 'Marcus Chen', initials: 'MC', when: '2h ago',
    course: COURSE, tee: 'Black', score: 76,
    dynamicRating: 76.8, dynamicSlope: 146, staticRating: 75.0,
    caption: 'Survived the gusts. That dynamic rating earned every tenth today.',
    bumps: 12, comments: 4, attested: true,
  },
  {
    id: 'p2', friendId: 'f3', name: 'Jake Whitman', initials: 'JW', when: '5h ago',
    course: COURSE, tee: 'Gold', score: 82,
    dynamicRating: 74.1, dynamicSlope: 138, staticRating: 72.8,
    caption: 'Greens running 13 on the member-guest setup. Brutal pins.',
    bumps: 8, comments: 2, attested: true,
  },
  {
    id: 'p3', friendId: 'f2', name: 'Sofia Reyes', initials: 'SR', when: 'Yesterday',
    course: 'Rockland CC', tee: 'Blue', score: 89,
    dynamicRating: 71.9, dynamicSlope: 131, staticRating: 71.2,
    caption: 'Personal best on a day that played over its rating. Take that, wind.',
    bumps: 21, comments: 7, attested: true,
  },
  {
    id: 'p4', friendId: 'f5', name: 'Tom Okafor', initials: 'TO', when: '2d ago',
    course: COURSE, tee: 'Black', score: 71,
    dynamicRating: 75.4, dynamicSlope: 143, staticRating: 75.0,
    caption: 'Under the dynamic rating. Best ball-striking day of the year.',
    bumps: 34, comments: 11, attested: true,
  },
].map(p => ({ ...p, differential: roundDifferential(p.score, p.dynamicRating, p.dynamicSlope) }));
