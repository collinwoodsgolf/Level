/**
 * Zustand global state store for LEVEL GOLF
 */
import { create } from 'zustand';
import { MY_ROUNDS, FRIENDS, computeHandicapIndex, roundDifferential } from './social';
import { aggregateRoundSG } from './strokesGained';
import { getCourse } from './courses';

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isPremium: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
  setPremium: (isPremium) => set({ isPremium }),
  logout: () => set({ user: null, isAuthenticated: false, isPremium: false }),

  // Rounds & handicap (differentials use the DYNAMIC rating, not static)
  rounds: MY_ROUNDS,
  addRound: (round) => set(state => {
    const withDiff = {
      ...round,
      differential: round.differential
        ?? roundDifferential(round.score, round.dynamicRating, round.dynamicSlope),
    };
    return { rounds: [withDiff, ...state.rounds] };
  }),
  getHandicap: () => computeHandicapIndex(get().rounds),

  // Active round — rating snapshot is LOCKED at tee-off and governs the
  // whole round (handicap + wager terms are known before the first swing).
  activeRound: null,
  startRound: ({ trackSG = false } = {}) => {
    const { rating, selectedTeeBox, weather, selectedCourseId } = get();
    if (!rating) return null;
    const snapshot = {
      id: 'live_' + Date.now(),
      courseName: getCourse(selectedCourseId).course.name,
      startedAt: new Date().toISOString(),
      teeBox: selectedTeeBox,
      dynamicRating: rating.today_rating,
      dynamicSlope: rating.today_slope,
      staticRating: rating.usga_static_rating,
      staticSlope: rating.usga_static_slope,
      difficultyLabel: rating.difficulty_label,
      weatherSummary: weather
        ? `${Math.round(weather.temperature_f)}°F · ${Math.round(weather.wind_speed_mph)} mph wind`
        : 'Conditions unavailable',
      locked: true,
      // Strokes-gained tracking (opt-in). Per-hole expected strokes are
      // locked with the snapshot so SG respects today's conditions.
      sgEnabled: trackSG,
      holeStats: {},
      holeMeta: Object.fromEntries(
        (rating.hole_difficulties || []).map(h => [h.hole, {
          par: h.par, difficulty_delta: h.difficulty_delta,
        }])
      ),
    };
    set({ activeRound: snapshot });
    return snapshot;
  },
  recordHoleStats: (holeNum, stats) => set(state => {
    if (!state.activeRound) return {};
    return {
      activeRound: {
        ...state.activeRound,
        holeStats: { ...state.activeRound.holeStats, [holeNum]: stats },
      },
    };
  }),
  endRound: (score) => {
    const { activeRound } = get();
    if (!activeRound || !score) return null;
    const round = {
      id: 'r_' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      course: activeRound.courseName || 'Manhattan Woods GC',
      tee: activeRound.teeBox.charAt(0).toUpperCase() + activeRound.teeBox.slice(1),
      score: Number(score),
      dynamicRating: activeRound.dynamicRating,
      dynamicSlope: activeRound.dynamicSlope,
      staticRating: activeRound.staticRating,
      staticSlope: activeRound.staticSlope,
      weather: activeRound.weatherSummary,
      attested: true,
      differential: roundDifferential(Number(score), activeRound.dynamicRating, activeRound.dynamicSlope),
      sg: activeRound.sgEnabled
        ? aggregateRoundSG(activeRound.holeStats, activeRound.holeMeta)
        : null,
    };
    set(state => ({ rounds: [round, ...state.rounds], activeRound: null }));
    return round;
  },
  cancelRound: () => set({ activeRound: null }),

  // Peer-to-peer wagers (mock — DraftKings integration planned)
  wagers: [],
  createWager: ({ opponent, stake, format }) => {
    const { rating, selectedTeeBox } = get();
    if (!rating) return null;
    const wager = {
      id: 'w_' + Date.now(),
      createdAt: new Date().toISOString(),
      opponent,
      stake,
      format,
      teeBox: selectedTeeBox,
      lockedRating: rating.today_rating,
      lockedSlope: rating.today_slope,
      status: 'active', // active | settled
      result: null,
    };
    set(state => ({ wagers: [wager, ...state.wagers] }));
    return wager;
  },
  settleWager: (id, result) => set(state => ({
    wagers: state.wagers.map(w => w.id === id ? { ...w, status: 'settled', result } : w),
  })),

  // Friends / The Loop
  friends: FRIENDS,
  bumped: {}, // postId -> true
  toggleBump: (postId) => set(state => ({
    bumped: { ...state.bumped, [postId]: !state.bumped[postId] },
  })),

  // Preferences
  prefs: {
    notifications: true,
    gpsTracking: true,
    distanceUnit: 'yards', // 'yards' | 'meters'
    tempUnit: 'F',         // 'F' | 'C'
  },
  setPref: (key, value) => set(state => ({ prefs: { ...state.prefs, [key]: value } })),

  // Course (home / most-played first; see courses.js)
  selectedCourseId: 'manhattan-woods',
  selectedTeeBox: 'black',
  setSelectedCourseId: (id) => set({
    selectedCourseId: id,
    rating: null,      // force recompute for the new course
    weather: null,     // refetch at the new course's coordinates
  }),
  setSelectedTeeBox: (teeBox) => set({ selectedTeeBox: teeBox }),

  // Weather
  weather: null,
  weatherError: null,
  weatherLoading: false,
  setWeather: (weather) => set({ weather, weatherError: null, weatherLoading: false }),
  setWeatherError: (error) => set({ weatherError: error, weatherLoading: false }),
  setWeatherLoading: (loading) => set({ weatherLoading: loading }),

  // Rating result
  rating: null,
  setRating: (rating) => set({ rating }),

  // Course setup (superintendent/GPS controls)
  setup: {
    stimp: 10.5,
    rough: 2.5,
    firmness: 'medium',
    pins: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, 'center'])),
    teeAdjs: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, 'middle'])),
  },
  setSetup: (updates) => set(state => ({
    setup: { ...state.setup, ...updates },
  })),
  applyPreset: (preset) => set({
    setup: {
      stimp: preset.stimp,
      rough: preset.rough,
      firmness: preset.firmness,
      pins: preset.pins,
      teeAdjs: preset.teeAdjs,
    },
  }),
}));

// Setup presets
export const SETUP_PRESETS = {
  daily_play: {
    label: 'Daily Play', desc: 'Standard member setup', icon: '⛳',
    stimp: 10.5, rough: 2.5, firmness: 'medium',
    pins: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, 'center'])),
    teeAdjs: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, 'middle'])),
  },
  tournament: {
    label: 'Tournament', desc: '13 stimp, tucked pins', icon: '🏆',
    stimp: 13.0, rough: 4.5, firmness: 'firm',
    pins: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, ['back_left', 'back_right', 'front_left', 'front_right'][i % 4]])),
    teeAdjs: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, 'back'])),
  },
  member_guest: {
    label: 'Member-Guest', desc: 'Easy pins, forward tees', icon: '🤝',
    stimp: 10.0, rough: 2.0, firmness: 'medium',
    pins: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, ['center', 'front'][i % 2]])),
    teeAdjs: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, 'forward'])),
  },
  us_open: {
    label: 'US Open', desc: '14 stimp, 5" rough, all tucked', icon: '🇺🇸',
    stimp: 14.0, rough: 5.0, firmness: 'firm',
    pins: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, ['back_left', 'back_right'][i % 2]])),
    teeAdjs: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, 'back'])),
  },
};
