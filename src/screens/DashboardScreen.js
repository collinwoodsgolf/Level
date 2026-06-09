/**
 * ATTESTED — Main Dashboard
 * Today's dynamic rating, weather, scorecard, factor breakdown, hole-by-hole.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, getDifficultyColor, getDifficultyBg } from '../utils/theme';
import { useStore, SETUP_PRESETS } from '../services/store';
import { MANHATTAN_WOODS, MANHATTAN_WOODS_HOLES } from '../services/courseData';
import { computeRating } from '../services/ratingEngine';
import { fetchWeather } from '../services/weather';
import TopNav from '../components/TopNav';
import Scorecard from '../components/Scorecard';

// ─── Sub-components ───

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
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
        <WeatherStat value={`${weather.wind_direction_deg}°`} label="direction" />
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

function RatingHero({ rating }) {
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
      <View style={[styles.heroCard, { borderColor: dc + '33' }]}>
        <Text style={styles.heroLabel}>TODAY'S RATING</Text>
        <Text style={[styles.heroValue, { color: dc }]}>{rating.today_rating}</Text>
        <Text style={[styles.heroDelta, { color: dc }]}>
          {rating.rating_delta > 0 ? '+' : ''}{rating.rating_delta} vs static
        </Text>
        <View style={[styles.diffBadge, { backgroundColor: getDifficultyBg(rating.rating_delta), borderColor: dc + '44' }]}>
          <Text style={[styles.diffBadgeText, { color: dc }]}>{rating.difficulty_label}</Text>
        </View>
      </View>
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
                : COLORS.surfaceBorder,
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

function TeeSelector({ selected, onSelect }) {
  const tees = [
    { key: 'black', label: 'Black', yds: '7,110', color: COLORS.teeBlack },
    { key: 'gold', label: 'Gold', yds: '6,645', color: COLORS.teeGold },
    { key: 'blue', label: 'Blue', yds: '6,180', color: COLORS.teeBlue },
    { key: 'white', label: 'White', yds: '5,520', color: COLORS.teeWhite },
  ];
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
  const [activePreset, setActivePreset] = useState('daily_play');
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = useCallback(async () => {
    try {
      const w = await fetchWeather(MANHATTAN_WOODS.lat, MANHATTAN_WOODS.lon);
      setWeather(w);
    } catch (e) {
      setWeatherError(e.message);
    }
  }, [setWeather, setWeatherError]);

  // Initial weather fetch
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
      const result = computeRating(conds, MANHATTAN_WOODS, MANHATTAN_WOODS_HOLES);
      setRating(result);
    } catch (e) {
      console.warn('Rating computation failed:', e.message);
    }
  }, [weather, setup, teeBox, setRating]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  };

  const onPresetSelect = (key) => {
    setActivePreset(key);
    applyPreset(SETUP_PRESETS[key]);
  };

  const teeInfo = MANHATTAN_WOODS.tee_boxes[teeBox];

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="ATTESTED"
        subtitle={`${MANHATTAN_WOODS.name} · ${MANHATTAN_WOODS.location}`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green500} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Hero — the headline number first */}
        <RatingHero rating={rating} />

        {/* Weather */}
        <WeatherCard weather={weather} onRefresh={loadWeather} />

        {/* Setup */}
        <SectionLabel>TEES & COURSE SETUP</SectionLabel>
        <TeeSelector selected={teeBox} onSelect={setTeeBox} />
        <PresetButtons active={activePreset} onSelect={onPresetSelect} />

        {/* Scorecard — static data, always visible */}
        <SectionLabel>SCORECARD</SectionLabel>
        <Scorecard
          holes={MANHATTAN_WOODS_HOLES}
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
            {MANHATTAN_WOODS.name} · Par {MANHATTAN_WOODS.par} · {MANHATTAN_WOODS.architect}, {MANHATTAN_WOODS.year}
          </Text>
          <Text style={styles.footerMath}>
            Model: s_ij = θ_i + D_j + ε_ij · v2 corrected coefficients
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

  sectionLabel: {
    ...FONTS.bold, fontSize: 11, color: COLORS.gray500,
    letterSpacing: 1.2, marginTop: 10, marginBottom: -2,
  },

  centerCard: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  loadingText: { ...FONTS.regular, fontSize: 13, color: COLORS.gray500 },

  // Weather
  weatherCard: {
    backgroundColor: '#0d2818', borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.green500 + '33',
  },
  weatherLoading: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  weatherCardFallback: { backgroundColor: '#26200d', borderColor: COLORS.amber500 + '33' },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  weatherTitle: { ...FONTS.bold, fontSize: 11, color: COLORS.green400, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  refreshLink: { ...FONTS.semibold, fontSize: 12, color: COLORS.green400 },
  weatherStats: { flexDirection: 'row', justifyContent: 'space-between' },
  weatherStat: { alignItems: 'center', flex: 1 },
  weatherStatValue: { ...FONTS.heavy, fontSize: 20, color: COLORS.white },
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
