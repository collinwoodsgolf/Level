/**
 * LEVEL GOLF — Onboarded courses registry
 * Mock multi-course data (production: backend course catalog).
 * Ordering: home course first, then by the player's play count.
 */
import { MANHATTAN_WOODS, MANHATTAN_WOODS_HOLES } from './courseData';

/** Derive a hole set variant so each mock course plays differently */
function deriveHoles(base, { ydsFactor = 1, headingShift = 0, hcpShuffle = 0 }) {
  return base.map(h => ({
    ...h,
    yds: Object.fromEntries(
      Object.entries(h.yds).map(([k, v]) => [k, Math.round(v * ydsFactor)])
    ),
    heading: (h.heading + headingShift) % 360,
    hcp: ((h.hcp - 1 + hcpShuffle) % 18) + 1,
  }));
}

export const COURSES = [
  {
    id: 'manhattan-woods',
    course: MANHATTAN_WOODS,
    holes: MANHATTAN_WOODS_HOLES,
    onboarded: true,
    verified: true,        // Attested-verified data tier
    isHome: true,          // player's home course (set in profile later)
    playerRounds: 42,      // player's play count → sort order
  },
  {
    id: 'rockland-cc',
    course: {
      ...MANHATTAN_WOODS,
      id: 'rockland-cc',
      name: 'Rockland Country Club',
      location: 'Sparkill, NY',
      architect: 'Robert Trent Jones',
      year: 1906,
      lat: 41.022, lon: -73.928, altitude_ft: 180,
      tee_boxes: {
        black: { yardage: 6712, rating: 72.4, slope: 134, label: 'Black' },
        gold:  { yardage: 6310, rating: 70.6, slope: 130, label: 'Gold' },
        blue:  { yardage: 5905, rating: 68.8, slope: 126, label: 'Blue' },
        white: { yardage: 5310, rating: 66.1, slope: 118, label: 'White' },
      },
    },
    holes: deriveHoles(MANHATTAN_WOODS_HOLES, { ydsFactor: 0.944, headingShift: 140, hcpShuffle: 5 }),
    onboarded: true,
    verified: true,
    isHome: false,
    playerRounds: 11,
  },
  {
    id: 'blue-hill',
    course: {
      ...MANHATTAN_WOODS,
      id: 'blue-hill',
      name: 'Blue Hill Golf Course',
      location: 'Pearl River, NY',
      architect: 'Municipal',
      year: 1924,
      lat: 41.046, lon: -74.005, altitude_ft: 220,
      tee_boxes: {
        black: { yardage: 6471, rating: 71.1, slope: 126, label: 'Blue' },
        gold:  { yardage: 6105, rating: 69.4, slope: 122, label: 'White' },
        blue:  { yardage: 5720, rating: 67.6, slope: 118, label: 'Gold' },
        white: { yardage: 5120, rating: 65.0, slope: 112, label: 'Red' },
      },
    },
    holes: deriveHoles(MANHATTAN_WOODS_HOLES, { ydsFactor: 0.91, headingShift: 255, hcpShuffle: 11 }),
    onboarded: true,
    verified: false,       // community tier — superintendent not onboarded yet
    isHome: false,
    playerRounds: 4,
  },
];

/** Home course first, then by player's play count */
export function sortedCourses() {
  return [...COURSES].sort((a, b) =>
    (b.isHome - a.isHome) || (b.playerRounds - a.playerRounds)
  );
}

export function getCourse(id) {
  return COURSES.find(c => c.id === id) || COURSES[0];
}
