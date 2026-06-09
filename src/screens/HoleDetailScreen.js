/**
 * ATTESTED — Hole Detail Screen
 * Deep-dive breakdown of a single hole's difficulty factors
 */
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, getDifficultyColor, getDifficultyBg } from '../utils/theme';
import { useStore } from '../services/store';

const FACTOR_META = {
  wind_distance:    { label: 'Wind (Distance)',  icon: '💨', unit: 'strokes', desc: 'Head/tail wind effect on ball flight distance' },
  crosswind:        { label: 'Crosswind',        icon: '🌬️', unit: 'strokes', desc: 'Lateral wind adding difficulty to accuracy' },
  temperature:      { label: 'Temperature',      icon: '🌡️', unit: 'strokes', desc: 'Ball compression & air density changes' },
  tee_position:     { label: 'Tee Position',     icon: '⛳', unit: 'strokes', desc: 'Forward or back tee adjustment for the day' },
  green_difficulty: { label: 'Green Complex',     icon: '🏌️', unit: 'strokes', desc: 'Pin, speed, shape, tiers, bunkers' },
  precipitation:    { label: 'Precipitation',     icon: '🌧️', unit: 'strokes', desc: 'Rain impact on distance and control' },
  rough_height:     { label: 'Rough Height',      icon: '🌿', unit: 'strokes', desc: 'Penalty from taller rough on misses' },
  firmness:         { label: 'Firmness',          icon: '⛰️', unit: 'strokes', desc: 'Soft/firm conditions on approaches & greens' },
};

function WindCompass({ headwind, crosswind, windSpeed, windDir, holeHeading }) {
  const arrowAngle = ((windDir - holeHeading + 180) % 360);
  return (
    <View style={cs.compassWrap}>
      <View style={cs.compassCircle}>
        <Text style={cs.compassN}>N</Text>
        <View style={[cs.compassArrow, { transform: [{ rotate: `${arrowAngle}deg` }] }]}>
          <Text style={cs.arrowText}>↑</Text>
        </View>
        <Text style={cs.compassCenter}>{Math.round(windSpeed)}</Text>
        <Text style={cs.compassUnit}>mph</Text>
      </View>
      <View style={cs.windLabels}>
        <Text style={[cs.windVal, headwind > 0 ? cs.windBad : cs.windGood]}>
          {headwind > 0 ? 'Headwind' : 'Tailwind'} {Math.abs(headwind).toFixed(1)} mph
        </Text>
        <Text style={cs.windVal}>
          Crosswind {crosswind.toFixed(1)} mph
        </Text>
      </View>
    </View>
  );
}

function FactorBar({ name, value, maxAbs }) {
  const meta = FACTOR_META[name] || { label: name, icon: '•', desc: '' };
  const pct = Math.min(Math.abs(value) / Math.max(maxAbs, 0.01), 1) * 100;
  const isPositive = value > 0;
  const barColor = isPositive ? COLORS.red500 : value < 0 ? COLORS.green500 : COLORS.gray600;

  return (
    <View style={cs.factorRow}>
      <View style={cs.factorHeader}>
        <Text style={cs.factorIcon}>{meta.icon}</Text>
        <Text style={cs.factorLabel}>{meta.label}</Text>
        <Text style={[cs.factorValue, { color: barColor }]}>
          {value > 0 ? '+' : ''}{value.toFixed(3)}
        </Text>
      </View>
      <View style={cs.barTrack}>
        <View style={[
          cs.barFill,
          {
            width: `${Math.max(pct, 2)}%`,
            backgroundColor: barColor,
            alignSelf: isPositive ? 'flex-start' : 'flex-end',
          },
        ]} />
      </View>
      <Text style={cs.factorDesc}>{meta.desc}</Text>
    </View>
  );
}

export default function HoleDetailScreen({ route, navigation }) {
  const { holeNumber } = route.params;
  const rating = useStore(s => s.rating);
  const weather = useStore(s => s.weather);
  const selectedTeeBox = useStore(s => s.selectedTeeBox);

  if (!rating) {
    return (
      <View style={cs.emptyContainer}>
        <Text style={cs.emptyText}>No rating data available</Text>
      </View>
    );
  }

  const holeData = rating.hole_difficulties.find(h => h.hole === holeNumber);
  if (!holeData) {
    return (
      <View style={cs.emptyContainer}>
        <Text style={cs.emptyText}>Hole {holeNumber} not found</Text>
      </View>
    );
  }

  const maxFactor = Math.max(
    ...Object.values(holeData.components).map(v => Math.abs(v)),
    0.01
  );

  const deltaColor = getDifficultyColor(holeData.difficulty_delta);
  const deltaBg = getDifficultyBg(holeData.difficulty_delta);

  return (
    <View style={cs.container}>
      {/* Header */}
      <View style={cs.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={cs.backBtn}>
          <Text style={cs.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={cs.headerTitle}>Hole {holeNumber}</Text>
        <View style={cs.headerBadge}>
          <Text style={[cs.headerPar, { color: COLORS.gray400 }]}>Par {holeData.par}</Text>
        </View>
      </View>

      <ScrollView style={cs.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={[cs.heroCard, { backgroundColor: deltaBg }]}>
          <View style={cs.heroRow}>
            <View style={cs.heroCol}>
              <Text style={cs.heroLabel}>Delta</Text>
              <Text style={[cs.heroValue, { color: deltaColor }]}>
                {holeData.difficulty_delta > 0 ? '+' : ''}{holeData.difficulty_delta.toFixed(2)}
              </Text>
            </View>
            <View style={cs.heroDivider} />
            <View style={cs.heroCol}>
              <Text style={cs.heroLabel}>Rank</Text>
              <Text style={cs.heroValue}>#{holeData.difficulty_rank || '—'}</Text>
            </View>
            <View style={cs.heroDivider} />
            <View style={cs.heroCol}>
              <Text style={cs.heroLabel}>HCP</Text>
              <Text style={cs.heroValue}>{holeData.handicap_index}</Text>
            </View>
          </View>
        </View>

        {/* Yardage section */}
        <View style={cs.section}>
          <Text style={cs.sectionTitle}>Distance</Text>
          <View style={cs.yardageCard}>
            <View style={cs.yardCol}>
              <Text style={cs.yardLabel}>Card</Text>
              <Text style={cs.yardVal}>{holeData.yardage}</Text>
              <Text style={cs.yardUnit}>yds</Text>
            </View>
            <View style={cs.yardArrow}>
              <Text style={cs.yardArrowText}>→</Text>
            </View>
            <View style={cs.yardCol}>
              <Text style={cs.yardLabel}>Actual</Text>
              <Text style={cs.yardVal}>{holeData.actual_yardage}</Text>
              <Text style={cs.yardUnit}>yds</Text>
            </View>
            <View style={cs.yardArrow}>
              <Text style={cs.yardArrowText}>→</Text>
            </View>
            <View style={cs.yardCol}>
              <Text style={[cs.yardLabel, { color: COLORS.green400 }]}>Effective</Text>
              <Text style={[cs.yardVal, { color: COLORS.green400 }]}>{holeData.effective_yardage}</Text>
              <Text style={cs.yardUnit}>yds</Text>
            </View>
          </View>
          <Text style={cs.yardNote}>
            Effective yardage accounts for wind, elevation, temperature, humidity, and firmness
          </Text>
        </View>

        {/* Wind */}
        <View style={cs.section}>
          <Text style={cs.sectionTitle}>Wind Vector</Text>
          <WindCompass
            headwind={holeData.headwind_mph}
            crosswind={holeData.crosswind_mph}
            windSpeed={weather?.wind_speed_mph || 0}
            windDir={weather?.wind_direction_deg || 0}
            holeHeading={0}
          />
        </View>

        {/* Factor breakdown */}
        <View style={cs.section}>
          <Text style={cs.sectionTitle}>Difficulty Factors</Text>
          <Text style={cs.sectionSub}>
            Each factor shows its stroke impact on this hole
          </Text>
          {Object.entries(holeData.components)
            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
            .map(([key, val]) => (
              <FactorBar key={key} name={key} value={val} maxAbs={maxFactor} />
            ))}
        </View>

        {/* Pin position */}
        <View style={cs.section}>
          <Text style={cs.sectionTitle}>Pin Position</Text>
          <View style={cs.pinCard}>
            <View style={cs.pinVisual}>
              <View style={cs.greenShape}>
                <View style={[cs.pinDot, pinDotPosition(holeData.pin_position)]} />
              </View>
            </View>
            <View style={cs.pinInfo}>
              <Text style={cs.pinLabel}>{formatPin(holeData.pin_position)}</Text>
              <Text style={cs.pinNote}>
                Green complexity contributes {holeData.components.green_difficulty > 0 ? '+' : ''}
                {holeData.components.green_difficulty.toFixed(3)} strokes
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function formatPin(pin) {
  return (pin || 'center').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function pinDotPosition(pin) {
  const map = {
    center:      { top: '45%', left: '45%' },
    front:       { top: '70%', left: '45%' },
    back:        { top: '20%', left: '45%' },
    front_left:  { top: '65%', left: '25%' },
    front_right: { top: '65%', left: '65%' },
    back_left:   { top: '25%', left: '25%' },
    back_right:  { top: '25%', left: '65%' },
  };
  return map[pin] || map.center;
}

const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  emptyContainer: { flex: 1, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...FONTS.medium, fontSize: 16, color: COLORS.gray500 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.surfaceElevated, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder,
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { ...FONTS.semibold, fontSize: 16, color: COLORS.green500 },
  headerTitle: { ...FONTS.bold, fontSize: 22, color: COLORS.ink },
  headerBadge: { paddingVertical: 4, paddingLeft: 12 },
  headerPar: { ...FONTS.semibold, fontSize: 16 },

  scroll: { flex: 1, paddingHorizontal: SPACING.xl },

  heroCard: {
    borderRadius: RADIUS.lg, padding: SPACING.xl, marginTop: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  heroCol: { alignItems: 'center' },
  heroLabel: { ...FONTS.medium, fontSize: 12, color: COLORS.gray400, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { ...FONTS.bold, fontSize: 28, color: COLORS.ink },
  heroDivider: { width: 1, height: 40, backgroundColor: COLORS.surfaceBorder },

  section: { marginTop: 28 },
  sectionTitle: { ...FONTS.bold, fontSize: 18, color: COLORS.ink, marginBottom: 4 },
  sectionSub: { ...FONTS.regular, fontSize: 13, color: COLORS.gray500, marginBottom: 16 },

  yardageCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md, padding: SPACING.xl,
    marginTop: 12,
  },
  yardCol: { alignItems: 'center' },
  yardLabel: { ...FONTS.medium, fontSize: 11, color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  yardVal: { ...FONTS.bold, fontSize: 24, color: COLORS.ink },
  yardUnit: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  yardArrow: { paddingHorizontal: 8 },
  yardArrowText: { ...FONTS.bold, fontSize: 18, color: COLORS.gray600 },
  yardNote: { ...FONTS.regular, fontSize: 12, color: COLORS.gray600, marginTop: 10, lineHeight: 17 },

  compassWrap: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md, padding: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
  },
  compassCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.surfaceBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  compassN: { ...FONTS.bold, fontSize: 10, color: COLORS.gray500, position: 'absolute', top: 4 },
  compassArrow: { position: 'absolute', top: 8, width: 24, height: 40, alignItems: 'center' },
  arrowText: { ...FONTS.bold, fontSize: 18, color: COLORS.green500 },
  compassCenter: { ...FONTS.bold, fontSize: 18, color: COLORS.ink },
  compassUnit: { ...FONTS.regular, fontSize: 10, color: COLORS.gray500 },
  windLabels: { marginLeft: SPACING.xl, flex: 1 },
  windVal: { ...FONTS.medium, fontSize: 14, color: COLORS.gray300, marginBottom: 6 },
  windBad: { color: COLORS.red500 },
  windGood: { color: COLORS.green500 },

  factorRow: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: 10,
  },
  factorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  factorIcon: { fontSize: 16, marginRight: 8 },
  factorLabel: { ...FONTS.semibold, fontSize: 14, color: COLORS.ink, flex: 1 },
  factorValue: { ...FONTS.bold, fontSize: 14 },
  barTrack: {
    height: 6, backgroundColor: COLORS.surfaceBorder, borderRadius: 3,
    marginBottom: 6, overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
  factorDesc: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500 },

  pinCard: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md, padding: SPACING.xl, marginTop: 12, alignItems: 'center',
  },
  pinVisual: { marginRight: SPACING.xl },
  greenShape: {
    width: 64, height: 72, borderRadius: 32, backgroundColor: COLORS.green900,
    borderWidth: 1, borderColor: COLORS.green700, position: 'relative',
  },
  pinDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.red500, borderWidth: 1.5, borderColor: COLORS.white,
  },
  pinInfo: { flex: 1 },
  pinLabel: { ...FONTS.bold, fontSize: 16, color: COLORS.ink, marginBottom: 4 },
  pinNote: { ...FONTS.regular, fontSize: 13, color: COLORS.gray400, lineHeight: 18 },
});
