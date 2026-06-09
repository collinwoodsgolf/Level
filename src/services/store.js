/**
 * Zustand global state store for ATTESTED
 */
import { create } from 'zustand';
import { MY_ROUNDS, FRIENDS, computeHandicapIndex, roundDifferential } from './social';

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

  // Course
  selectedCourse: null,
  selectedTeeBox: 'black',
  setSelectedCourse: (course) => set({ selectedCourse: course }),
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
