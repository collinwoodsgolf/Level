/**
 * LEVEL GOLF — Main Dashboard
 * Today's dynamic rating, weather, scorecard, factor breakdown, hole-by-hole.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, getDifficultyColor, getDifficultyBg } from '../utils/theme';
import { useStore, SETUP_PRESETS } from '../services/store';
import { sortedCourses, getCourse } from '../services/courses';
import { computeRatingML } from '../services/mlRating';
import { fetchWeather, degToCompass } from '../services/weather';
import TopNav from '../components/TopNav';
import Scorecard from '../components/Scorecard';
import LiveSGTracker from '../components/LiveSGTracker';

// ─── Sub-components ───

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

/**
 * Course picker — home course first, then most played, then the rest of
 * the onboarded catalog. Production: searchable list + GPS "courses near me".
 */
function CoursePicker({ selectedId, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>
      {sortedCourses().map(c => {
        const on = c.id === selectedId;
        return (
          <TouchableOpacity
            key={c.id}
            style={[styles.courseChip, on && styles.courseChipOn]}
            onPress={() => onSelect(c.id)}
            activeOpacity={0.8}
          >
            <View style={styles.courseChipTop}>
              {c.isHome && <Text style={styles.courseHome}>🏠</Text>}
              <Text style={[styles.courseName, on && { color: COLORS.white }]} numberOfLines={1}>
                {c.course.name}
              </Text>
              {c.verified && (
                <View style={[styles.courseVerified, on && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={[styles.courseVerifiedText, on && { color: COLORS.white }]}>✓</Text>
                </View>
              )}
            </View>
            <Text style={[styles.courseMeta, on && { color: 'rgba(255,255,255,0.75)' }]}>
              {c.course.location} · {c.playerRounds} rounds
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={styles.courseMore}
        onPress={() => Alert.alert(
          'More Courses',
          'Course search and onboarding requests coming soon. Want your course on Level? Have your pro shop reach out — onboarding takes one morning.',
        )}
        activeOpacity={0.8}
      >
        <Text style={styles.courseMoreText}>＋</Text>
        <Text style={styles.courseMoreSub}>More{'\n'}courses</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function WeatherCard({ weather, onRefresh }) {
  if (!weather) {
    return (
      <View style={[styles.weatherCard, styles.weatherLoading]}>
        <ActivityIndicator color={COLORS.green500} />
        <Text style={styles.loadingText}>Fetching live conditions…</Text>
      </View>
    );
  }
  const isLive = weather.live;
  return (
    <View style={[styles.weatherCard, !isLive && styles.weatherCardFallback]}>
      <View style={styles.weatherHeader}>
        <View style={[styles.liveDot, { backgroundColor: isLive ? COLORS.green500 : COLORS.amber500 }]} />
        <Text style={[styles.weatherTitle, !isLive && { color: COLORS.amber500 }]}>
          {isLive ? `Live — ${weather.source}` : 'Seasonal Fallback'}
        </Text>
        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.refreshLink}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.weatherStats}>
        <WeatherStat value={`${Math.round(weather.temperature_f)}°`} label={weather.description} />
        <WeatherStat value={`${Math.round(weather.wind_speed_mph)}`} label={`mph wind · G${Math.round(weather.wind_gusts_mph)}`} />
        <WeatherStat value={degToCompass(weather.wind_direction_deg)} label="wind from" />
        <WeatherStat value={`${weather.humidity_pct}%`} label="humidity" />
      </View>
    </View>
  );
}

function WeatherStat({ value, label }) {
  return (
    <View style={styles.weatherStat}>
      <Text style={styles.weatherStatValue}>{value}</Text>
      <Text style={styles.weatherStatLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function RatingHero({ rating, onRatingPress }) {
  if (!rating) {
    return (
      <View style={[styles.card, styles.centerCard]}>
        <ActivityIndicator color={COLORS.green500} />
        <Text style={styles.loadingText}>Computing today's rating…</Text>
      </View>
    );
  }
  const dc = getDifficultyColor(rating.rating_delta);
  return (
    <View style={styles.heroRow}>
      <TouchableOpacity
        style={[styles.heroCard, { borderColor: dc + '33' }]}
        onPress={onRatingPress}
        activeOpacity={0.7}
      >
        <Text style={styles.heroLabel}>TODAY'S RATING</Text>
        <Text style={[styles.heroValue, { color: dc }]}>{rating.today_rating}</Text>
        <Text style={[styles.heroDelta, { color: dc }]}>
          {rating.rating_delta > 0 ? '+' : ''}{rating.rating_delta} vs static
        </Text>
        <View style={[styles.diffBadge, { backgroundColor: getDifficultyBg(rating.rating_delta), borderColor: dc + '44' }]}>
          <Text style={[styles.diffBadgeText, { color: dc }]}>{rating.difficulty_label}</Text>
        </View>
        {rating.ml?.enabled && (
          <Text style={styles.mlBadge}>
            🧠 ML-tuned {rating.ml.correction >= 0 ? '+' : ''}{rating.ml.correction.toFixed(1)} · {rating.ml.observations} rds
          </Text>
        )}
        <Text style={styles.heroTapHint}>Tap for factor charts ›</Text>
      </TouchableOpacity>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>USGA STATIC</Text>
        <Text style={[styles.heroValue, { color: COLORS.gray400 }]}>{rating.usga_static_rating}</Text>
        <Text style={styles.heroSub}>Slope {rating.usga_static_slope}</Text>
      </View>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>TODAY'S SLOPE</Text>
        <Text style={[styles.heroValue, { color: rating.slope_delta > 0 ? COLORS.red500 : COLORS.green500 }]}>
          {rating.today_slope}
        </Text>
        <Text style={[styles.heroDelta, { color: rating.slope_delta > 0 ? COLORS.red500 : COLORS.green500 }]}>
          {rating.slope_delta > 0 ? '+' : ''}{rating.slope_delta}
        </Text>
      </View>
    </View>
  );
}

/**
 * Start / active round banner.
 * The rating snapshot LOCKS at tee-off — terms are known before the first
 * swing (handicap + wager integrity), instead of drifting mid-round.
 */
function RoundBanner({ rating, activeRound, onStart, onEnd, onCancel }) {
  if (activeRound) {
    const t = new Date(activeRound.startedAt);
    const hhmm = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return (
      <View style={styles.roundActive}>
        <View style={{ flex: 1 }}>
          <View style={styles.roundLiveRow}>
            <View style={styles.liveDotRed} />
            <Text style={styles.roundLiveText}>ROUND IN PROGRESS · teed off {hhmm}</Text>
          </View>
          <Text style={styles.roundLocked}>
            🔒 Locked at {activeRound.dynamicRating} / {activeRound.dynamicSlope} · {activeRound.weatherSummary}
          </Text>
        </View>
        <View style={styles.roundBtnCol}>
          <TouchableOpacity style={styles.endBtn} onPress={onEnd} activeOpacity={0.85}>
            <Text style={styles.endBtnText}>End Round</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.cancelText}>Discard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={[styles.startRoundBtn, !rating && { opacity: 0.5 }]}
      onPress={onStart}
      disabled={!rating}
      activeOpacity={0.85}
    >
      <Text style={styles.startRoundIcon}>▶</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.startRoundTitle}>Start Round</Text>
        <Text style={styles.startRoundSub}>
          {rating
            ? `Capture & lock today's rating — ${rating.today_rating} / ${rating.today_slope}`
            : 'Waiting for today\'s rating…'}
        </Text>
      </View>
      <Text style={styles.startRoundChev}>›</Text>
    </TouchableOpacity>
  );
}

function FactorBreakdown({ factors }) {
  if (!factors) return null;
  const mx = Math.max(...Object.values(factors).map(Math.abs), 0.3);
  const labels = {
    wind_distance: 'Wind', crosswind: 'X-Wind', temperature: 'Temp',
    tee_position: 'Tees', green_difficulty: 'Greens', precipitation: 'Rain',
    rough_height: 'Rough', firmness: 'Firmness',
  };
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>CONDITION IMPACT</Text>
      {Object.entries(factors).map(([k, v]) => {
        const pct = Math.min(100, (Math.abs(v) / mx) * 100);
        const color = v > 0 ? COLORS.red500 : v < 0 ? COLORS.green500 : COLORS.gray500;
        return (
          <View key={k} style={styles.factorRow}>
            <Text style={styles.factorLabel}>{labels[k] || k}</Text>
            <View style={styles.factorBarBg}>
              <View style={[styles.factorBar, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.factorValue, { color }]}>
              {v > 0 ? '+' : ''}{v.toFixed(2)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function HoleDifficultyList({ holes, onHoleTap }) {
  if (!holes?.length) return null;
  const mx = Math.max(...holes.map(x => Math.abs(x.difficulty_delta)), 0.2);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>HOLE-BY-HOLE DIFFICULTY</Text>
      <View style={styles.holeHeader}>
        <Text style={[styles.holeHeaderText, { width: 34 }]}>Hole</Text>
        <Text style={[styles.holeHeaderText, { width: 28 }]}>Par</Text>
        <Text style={[styles.holeHeaderText, { flex: 1 }]}>Impact</Text>
        <Text style={[styles.holeHeaderText, { width: 56, textAlign: 'right' }]}>Delta</Text>
        <Text style={[styles.holeHeaderText, { width: 34, textAlign: 'center' }]}>Rank</Text>
      </View>
      {holes.map(h => {
        const pct = Math.min(100, (Math.abs(h.difficulty_delta) / mx) * 100);
        const c = getDifficultyColor(h.difficulty_delta * 3);
        return (
          <TouchableOpacity
            key={h.hole}
            style={styles.holeRow}
            onPress={() => onHoleTap?.(h)}
            activeOpacity={0.65}
          >
            <Text style={[styles.holeNum, { width: 34 }]}>{h.hole}</Text>
            <Text style={[styles.holeText, { width: 28 }]}>{h.par}</Text>
            <View style={[styles.holeBarBg, { flex: 1 }]}>
              <View style={[styles.holeBar, { width: `${pct}%`, backgroundColor: c }]} />
            </View>
            <Text style={[styles.holeDelta, { width: 56, color: c }]}>
              {h.difficulty_delta > 0 ? '+' : ''}{h.difficulty_delta.toFixed(2)}
            </Text>
            <View style={[styles.rankBadge, {
              backgroundColor: h.difficulty_rank <= 3
                ? [COLORS.red500, COLORS.orange500, COLORS.amber500][h.difficulty_rank - 1]
                : COLORS.gray600,
            }]}>
              <Text style={styles.rankText}>{h.difficulty_rank}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      <Text style={styles.tapHint}>Tap a hole for the full factor breakdown</Text>
    </View>
  );
}

function TeeSelector({ selected, onSelect, teeBoxes }) {
  const colors = { black: COLORS.teeBlack, gold: COLORS.teeGold, blue: COLORS.teeBlue, white: COLORS.teeWhite };
  const tees = Object.entries(teeBoxes || {}).map(([key, t]) => ({
    key, label: t.label, yds: t.yardage.toLocaleString(), color: colors[key] || COLORS.teeBlack,
  }));
  return (
    <View style={styles.teeRow}>
      {tees.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[styles.teeBtn, selected === t.key && { backgroundColor: t.color, borderColor: t.color }]}
          onPress={() => onSelect(t.key)}
          activeOpacity={0.8}
        >
          <Text style={[styles.teeBtnLabel, selected === t.key && { color: '#fff' }]}>{t.label}</Text>
          <Text style={[styles.teeBtnYds, selected === t.key && { color: 'rgba(255,255,255,0.7)' }]}>{t.yds}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PresetButtons({ active, onSelect }) {
  return (
    <View style={styles.presetRow}>
      {Object.entries(SETUP_PRESETS).map(([k, p]) => (
        <TouchableOpacity
          key={k}
          style={[styles.presetBtn, active === k && styles.presetBtnActive]}
          onPress={() => onSelect(k)}
          activeOpacity={0.8}
        >
          <Text style={styles.presetIcon}>{p.icon}</Text>
          <Text style={[styles.presetLabel, active === k && styles.presetLabelActive]}>{p.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Dashboard ───

export default function DashboardScreen({ navigation }) {
  const weather = useStore(s => s.weather);
  const setWeather = useStore(s => s.setWeather);
  const setWeatherError = useStore(s => s.setWeatherError);
  const rating = useStore(s => s.rating);
  const setRating = useStore(s => s.setRating);
  const teeBox = useStore(s => s.selectedTeeBox);
  const setTeeBox = useStore(s => s.setSelectedTeeBox);
  const setup = useStore(s => s.setup);
  const applyPreset = useStore(s => s.applyPreset);
  const selectedCourseId = useStore(s => s.selectedCourseId);
  const setSelectedCourseId = useStore(s => s.setSelectedCourseId);
  const learning = useStore(s => s.learning);
  const { course, holes, verified } = getCourse(selectedCourseId);
  const activeRound = useStore(s => s.activeRound);
  const startRound = useStore(s => s.startRound);
  const endRound = useStore(s => s.endRound);
  const cancelRound = useStore(s => s.cancelRound);
  const [activePreset, setActivePreset] = useState('daily_play');
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = useCallback(async () => {
    try {
      const w = await fetchWeather(course.lat, course.lon);
      setWeather(w);
    } catch (e) {
      setWeatherError(e.message);
    }
  }, [setWeather, setWeatherError, course.lat, course.lon]);

  // Initial weather fetch + refetch when the course changes
  useEffect(() => { loadWeather(); }, [loadWeather]);

  // Recompute rating when weather or setup changes
  useEffect(() => {
    if (!weather) return;
    const conds = {
      wind_speed_mph: weather.wind_speed_mph,
      wind_direction_deg: weather.wind_direction_deg,
      wind_gusts_mph: weather.wind_gusts_mph,
      temperature_f: weather.temperature_f,
      humidity_pct: weather.humidity_pct,
      precipitation: weather.precipitation,
      green_speed_stimp: setup.stimp,
      rough_height_inches: setup.rough,
      firmness: setup.firmness,
      pin_positions: setup.pins,
      tee_box: teeBox,
      tee_adjustments: setup.teeAdjs,
    };
    try {
      // Physics prior + per-course learned state (calibration multipliers
      // and the online ML residual model) — refines with every posted round.
      const result = computeRatingML(conds, course, holes, learning[selectedCourseId]);
      setRating(result);
    } catch (e) {
      console.warn('Rating computation failed:', e.message);
    }
  }, [weather, setup, teeBox, setRating, course, holes, learning, selectedCourseId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  };

  const onPresetSelect = (key) => {
    setActivePreset(key);
    applyPreset(SETUP_PRESETS[key]);
  };

  const teeInfo = course.tee_boxes[teeBox];

  const handleStartRound = () => {
    if (!rating) return;
    Alert.alert(
      'Start Round?',
      `This captures and locks today's rating at ${rating.today_rating} / ${rating.today_slope} for your entire round — it won't drift with the weather.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Lock It In', onPress: () => startRound() },
        { text: 'Lock + Track Strokes Gained', onPress: () => startRound({ trackSG: true }) },
      ],
    );
  };

  const handleEndRound = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'End Round',
        `Enter your gross score. Your differential is computed against the locked rating (${activeRound.dynamicRating} / ${activeRound.dynamicSlope}).`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Post Score',
            onPress: (score) => {
              const n = parseInt(score, 10);
              if (!n || n < 50 || n > 160) {
                Alert.alert('Invalid Score', 'Enter a score between 50 and 160.');
                return;
              }
              const round = endRound(n);
              if (round) {
                Alert.alert(
                  'Round Attested ✓',
                  `Score ${round.score} vs locked rating ${round.dynamicRating}\nDifferential: ${round.differential > 0 ? '+' : ''}${round.differential}\n\nSaved to Round History.`,
                );
              }
            },
          },
        ],
        'plain-text',
        '',
        'number-pad',
      );
    } else {
      // Android fallback (Alert.prompt is iOS-only)
      endRound(85);
    }
  };

  const handleCancelRound = () => {
    Alert.alert('Discard Round?', 'The locked snapshot will be thrown away and nothing is posted.', [
      { text: 'Keep Playing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: cancelRound },
    ]);
  };

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="LEVEL"
        subtitle={`${course.name} · ${course.location}`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green500} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Course picker — home / most played first */}
        <CoursePicker selectedId={selectedCourseId} onSelect={setSelectedCourseId} />

        {/* Start / active round */}
        <RoundBanner
          rating={rating}
          activeRound={activeRound}
          onStart={handleStartRound}
          onEnd={handleEndRound}
          onCancel={handleCancelRound}
        />

        {/* Live strokes-gained tracker (only when tracking is on) */}
        <LiveSGTracker />

        {/* Rating Hero — the headline number first; tap rating for charts */}
        <RatingHero
          rating={rating}
          onRatingPress={() => navigation?.navigate('RatingInsights')}
        />

        {/* Weather */}
        <WeatherCard weather={weather} onRefresh={loadWeather} />

        {/* Setup */}
        <SectionLabel>TEES & COURSE SETUP</SectionLabel>
        <TeeSelector selected={teeBox} onSelect={setTeeBox} teeBoxes={course.tee_boxes} />
        <PresetButtons active={activePreset} onSelect={onPresetSelect} />

        {/* Scorecard — static data, always visible */}
        <SectionLabel>SCORECARD</SectionLabel>
        <Scorecard
          holes={holes}
          teeBox={teeBox}
          teeInfo={teeInfo}
          rating={rating}
        />

        {/* Analysis */}
        <SectionLabel>TODAY'S ANALYSIS</SectionLabel>
        <FactorBreakdown factors={rating?.factor_summary} />
        <HoleDifficultyList
          holes={rating?.hole_difficulties}
          onHoleTap={(h) => navigation?.navigate('HoleDetail', { hole: h })}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {course.name} · Par {course.par} · {course.architect}, {course.year}
          </Text>
          <Text style={styles.footerMath}>
            Model: s_ij = θ_i + D_j + ε_ij · physics prior + online ML refinement
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 40, gap: 12 },

  // Course picker
  courseRow: { gap: 8 },
  courseChip: {
    width: 168, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder, paddingVertical: 9, paddingHorizontal: 11,
  },
  courseChipOn: { backgroundColor: COLORS.green700, borderColor: COLORS.green700 },
  courseChipTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  courseHome: { fontSize: 9 },
  courseName: { ...FONTS.bold, fontSize: 11.5, color: COLORS.ink, flex: 1 },
  courseVerified: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.green900,
    alignItems: 'center', justifyContent: 'center',
  },
  courseVerifiedText: { ...FONTS.bold, fontSize: 8, color: COLORS.green400 },
  courseMeta: { ...FONTS.regular, fontSize: 9, color: COLORS.gray500, marginTop: 3 },
  courseMore: {
    width: 64, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder, borderStyle: 'dashed',
  },
  courseMoreText: { ...FONTS.bold, fontSize: 16, color: COLORS.green600 },
  courseMoreSub: { ...FONTS.semibold, fontSize: 8, color: COLORS.gray500, textAlign: 'center', marginTop: 2 },

  sectionLabel: {
    ...FONTS.bold, fontSize: 11, color: COLORS.gray500,
    letterSpacing: 1.2, marginTop: 10, marginBottom: -2,
  },

  centerCard: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  loadingText: { ...FONTS.regular, fontSize: 13, color: COLORS.gray500 },

  // Weather
  weatherCard: {
    backgroundColor: '#E7F0E8', borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.green500 + '33',
  },
  weatherLoading: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  weatherCardFallback: { backgroundColor: '#FBF3DC', borderColor: COLORS.amber500 + '33' },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  weatherTitle: { ...FONTS.bold, fontSize: 11, color: COLORS.green400, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  refreshLink: { ...FONTS.semibold, fontSize: 12, color: COLORS.green400 },
  weatherStats: { flexDirection: 'row', justifyContent: 'space-between' },
  weatherStat: { alignItems: 'center', flex: 1 },
  weatherStatValue: { ...FONTS.heavy, fontSize: 20, color: COLORS.ink },
  weatherStatLabel: { ...FONTS.regular, fontSize: 10, color: COLORS.gray400, marginTop: 3 },

  // Tees
  teeRow: { flexDirection: 'row', gap: 8 },
  teeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder, alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
  },
  teeBtnLabel: { ...FONTS.bold, fontSize: 11, color: COLORS.gray300 },
  teeBtnYds: { ...FONTS.regular, fontSize: 9, color: COLORS.gray500, marginTop: 2 },

  // Presets
  presetRow: { flexDirection: 'row', gap: 8 },
  presetBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder, alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
  },
  presetBtnActive: { borderColor: COLORS.green600, backgroundColor: COLORS.green800 + '66' },
  presetIcon: { fontSize: 16 },
  presetLabel: { ...FONTS.semibold, fontSize: 9, color: COLORS.gray400, marginTop: 3 },
  presetLabelActive: { color: COLORS.green400 },

  // Rating Hero
  heroRow: { flexDirection: 'row', gap: 10 },
  heroCard: {
    flex: 1, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  heroLabel: { ...FONTS.bold, fontSize: 9, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue: { ...FONTS.black, fontSize: 30, lineHeight: 34, marginVertical: 4 },
  heroDelta: { ...FONTS.bold, fontSize: 12 },
  heroSub: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 4 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, marginTop: 6 },
  diffBadgeText: { ...FONTS.bold, fontSize: 10 },
  mlBadge: { ...FONTS.semibold, fontSize: 8.5, color: COLORS.green400, marginTop: 5 },
  heroTapHint: { ...FONTS.regular, fontSize: 8.5, color: COLORS.gray600, marginTop: 6 },

  // Start / active round banner
  startRoundBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.green700, borderRadius: RADIUS.lg,
    paddingVertical: 14, paddingHorizontal: SPACING.lg,
  },
  startRoundIcon: { fontSize: 16, color: COLORS.white },
  startRoundTitle: { ...FONTS.bold, fontSize: 16, color: COLORS.white },
  startRoundSub: { ...FONTS.regular, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  startRoundChev: { fontSize: 22, color: 'rgba(255,255,255,0.7)' },

  roundActive: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E7F0E8', borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.green600 + '66',
    padding: SPACING.lg,
  },
  roundLiveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red500 },
  roundLiveText: { ...FONTS.bold, fontSize: 10, color: COLORS.green400, letterSpacing: 0.5 },
  roundLocked: { ...FONTS.regular, fontSize: 11, color: COLORS.gray400, marginTop: 5, lineHeight: 15 },
  roundBtnCol: { alignItems: 'center', gap: 6 },
  endBtn: {
    backgroundColor: COLORS.green700, borderRadius: RADIUS.md,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  endBtnText: { ...FONTS.bold, fontSize: 13, color: COLORS.white },
  cancelText: { ...FONTS.regular, fontSize: 11, color: COLORS.red500 },

  // Cards
  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  cardTitle: { ...FONTS.bold, fontSize: 11, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Factor bars
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  factorLabel: { ...FONTS.semibold, fontSize: 10, color: COLORS.gray400, width: 60, textAlign: 'right' },
  factorBarBg: { flex: 1, height: 14, backgroundColor: COLORS.surfaceBorder, borderRadius: 7, overflow: 'hidden' },
  factorBar: { height: '100%', borderRadius: 7 },
  factorValue: { ...FONTS.bold, fontSize: 11, width: 44, textAlign: 'right' },

  // Hole difficulty list
  holeHeader: {
    flexDirection: 'row', alignItems: 'center', paddingBottom: 8,
    borderBottomWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: 4,
  },
  holeHeaderText: { ...FONTS.bold, fontSize: 9, color: COLORS.gray500, textTransform: 'uppercase' },
  holeRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.surfaceBorder,
  },
  holeNum: { ...FONTS.heavy, fontSize: 13, color: COLORS.green400 },
  holeText: { ...FONTS.regular, fontSize: 11, color: COLORS.gray300 },
  holeBarBg: { height: 8, backgroundColor: COLORS.surfaceBorder, borderRadius: 4, overflow: 'hidden', marginHorizontal: 6 },
  holeBar: { height: '100%', borderRadius: 4 },
  holeDelta: { ...FONTS.bold, fontSize: 11, textAlign: 'right' },
  rankBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  rankText: { ...FONTS.heavy, fontSize: 9, color: COLORS.white },
  tapHint: { ...FONTS.regular, fontSize: 10, color: COLORS.gray600, textAlign: 'center', marginTop: 10 },

  // Footer
  footer: { alignItems: 'center', paddingTop: 14, gap: 4 },
  footerText: { ...FONTS.regular, fontSize: 10, color: COLORS.gray600, textAlign: 'center' },
  footerMath: { ...FONTS.regular, fontSize: 9, color: COLORS.gray700 },
});
