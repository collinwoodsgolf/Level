/**
 * ATTESTED — Rating Insights
 * Opened by tapping Today's Rating. Charts how every factor moves
 * every hole: per-hole stacked component bars around a zero axis,
 * factor totals, and each hole's delta.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, getDifficultyColor } from '../utils/theme';
import { useStore } from '../services/store';
import SubHeader from '../components/SubHeader';

export const FACTOR_META = {
  wind_distance:    { label: 'Wind',     color: '#2563EB' },
  crosswind:        { label: 'X-Wind',   color: '#7C3AED' },
  temperature:      { label: 'Temp',     color: '#0E7490' },
  tee_position:     { label: 'Tees',     color: '#A16207' },
  green_difficulty: { label: 'Greens',   color: '#355E3B' },
  precipitation:    { label: 'Rain',     color: '#0891B2' },
  rough_height:     { label: 'Rough',    color: '#65A30D' },
  firmness:         { label: 'Firmness', color: '#92400E' },
};
const FACTOR_KEYS = Object.keys(FACTOR_META);

function Legend({ active, onToggle }) {
  return (
    <View style={s.legend}>
      {FACTOR_KEYS.map(k => {
        const on = !active || active === k;
        return (
          <TouchableOpacity
            key={k}
            style={[s.legendItem, !on && { opacity: 0.35 }]}
            onPress={() => onToggle(k)}
            activeOpacity={0.7}
          >
            <View style={[s.legendDot, { backgroundColor: FACTOR_META[k].color }]} />
            <Text style={s.legendText}>{FACTOR_META[k].label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Factor totals across all 18 holes */
function FactorTotals({ factors }) {
  const mx = Math.max(...Object.values(factors).map(Math.abs), 0.3);
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>FACTOR TOTALS — STROKES ON THE RATING</Text>
      {FACTOR_KEYS.map(k => {
        const v = factors[k] || 0;
        const pct = Math.min(100, (Math.abs(v) / mx) * 100);
        return (
          <View key={k} style={s.totalRow}>
            <Text style={s.totalLabel}>{FACTOR_META[k].label}</Text>
            <View style={s.totalBarBg}>
              <View style={[s.totalBar, { width: `${pct}%`, backgroundColor: FACTOR_META[k].color }]} />
            </View>
            <Text style={[s.totalValue, { color: v > 0 ? COLORS.red500 : v < 0 ? COLORS.green500 : COLORS.gray500 }]}>
              {v > 0 ? '+' : ''}{v.toFixed(2)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Per-hole stacked bar around a zero axis:
 * negative components stack left of center, positives stack right.
 */
function HoleStack({ hole, maxAbs, activeFactor }) {
  const comps = hole.components || {};
  const pos = [];
  const neg = [];
  FACTOR_KEYS.forEach(k => {
    const v = comps[k] || 0;
    if (activeFactor && k !== activeFactor) return;
    if (v > 0) pos.push({ k, v });
    else if (v < 0) neg.push({ k, v: Math.abs(v) });
  });
  const half = 50; // percent each side of axis
  const scale = (v) => Math.min(half, (v / maxAbs) * half);
  const dc = getDifficultyColor(hole.difficulty_delta * 3);

  return (
    <View style={s.holeRow}>
      <Text style={s.holeNum}>{hole.hole}</Text>
      <Text style={s.holePar}>P{hole.par}</Text>
      <View style={s.stackTrack}>
        {/* negative side */}
        <View style={s.negSide}>
          {neg.map(seg => (
            <View
              key={seg.k}
              style={{ width: `${scale(seg.v) * 2}%`, height: '100%', backgroundColor: FACTOR_META[seg.k].color }}
            />
          ))}
        </View>
        <View style={s.axis} />
        {/* positive side */}
        <View style={s.posSide}>
          {pos.map(seg => (
            <View
              key={seg.k}
              style={{ width: `${scale(seg.v) * 2}%`, height: '100%', backgroundColor: FACTOR_META[seg.k].color }}
            />
          ))}
        </View>
      </View>
      <Text style={[s.holeDelta, { color: dc }]}>
        {hole.difficulty_delta > 0 ? '+' : ''}{hole.difficulty_delta.toFixed(2)}
      </Text>
    </View>
  );
}

export default function RatingInsightsScreen({ navigation }) {
  const rating = useStore(st => st.rating);
  const [activeFactor, setActiveFactor] = useState(null);

  if (!rating) {
    return (
      <View style={s.container}>
        <SubHeader navigation={navigation} title="Rating Insights" />
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>No rating computed yet.</Text>
          <Text style={s.emptySub}>Head back to the dashboard and let the weather load.</Text>
        </View>
      </View>
    );
  }

  const holes = rating.hole_difficulties || [];
  // Max one-sided magnitude across holes (sum of pos or neg components)
  const maxAbs = Math.max(
    ...holes.map(h => {
      const comps = Object.values(h.components || {});
      const p = comps.filter(v => v > 0).reduce((a, b) => a + b, 0);
      const n = Math.abs(comps.filter(v => v < 0).reduce((a, b) => a + b, 0));
      return Math.max(p, n);
    }),
    0.2,
  );
  const dc = getDifficultyColor(rating.rating_delta);

  return (
    <View style={s.container}>
      <SubHeader navigation={navigation} title="Rating Insights" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Headline */}
        <View style={s.headline}>
          <View style={s.headItem}>
            <Text style={[s.headValue, { color: dc }]}>{rating.today_rating}</Text>
            <Text style={s.headLabel}>TODAY</Text>
          </View>
          <Text style={s.headVs}>vs</Text>
          <View style={s.headItem}>
            <Text style={[s.headValue, { color: COLORS.gray400 }]}>{rating.usga_static_rating}</Text>
            <Text style={s.headLabel}>STATIC</Text>
          </View>
          <View style={[s.headBadge, { borderColor: dc + '55' }]}>
            <Text style={[s.headBadgeText, { color: dc }]}>
              {rating.rating_delta > 0 ? '+' : ''}{rating.rating_delta} · {rating.difficulty_label}
            </Text>
          </View>
        </View>

        {/* Factor totals */}
        <FactorTotals factors={rating.factor_summary || {}} />

        {/* Per-hole stacked chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>PER-HOLE FACTOR IMPACT</Text>
          <Text style={s.hint}>
            Tap a factor to isolate it. Bars left of the axis make the hole easier; right make it harder.
          </Text>
          <Legend
            active={activeFactor}
            onToggle={(k) => setActiveFactor(f => (f === k ? null : k))}
          />
          <View style={s.axisLabels}>
            <Text style={s.axisLabel}>easier ←</Text>
            <Text style={s.axisLabel}>→ harder</Text>
          </View>
          {holes.map(h => (
            <HoleStack key={h.hole} hole={h} maxAbs={maxAbs} activeFactor={activeFactor} />
          ))}
          <View style={s.nineSplit}>
            <Text style={s.nineText}>
              Front 9: <Text style={{ color: getDifficultyColor(rating.front_nine_delta * 2), ...FONTS.bold }}>
                {rating.front_nine_delta > 0 ? '+' : ''}{rating.front_nine_delta}
              </Text>
            </Text>
            <Text style={s.nineText}>
              Back 9: <Text style={{ color: getDifficultyColor(rating.back_nine_delta * 2), ...FONTS.bold }}>
                {rating.back_nine_delta > 0 ? '+' : ''}{rating.back_nine_delta}
              </Text>
            </Text>
          </View>
        </View>

        <Text style={s.foot}>
          Components are strokes added to (or removed from) each hole's expected
          difficulty under today's exact conditions.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg, paddingBottom: 48, gap: 12 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { ...FONTS.bold, fontSize: 16, color: COLORS.ink },
  emptySub: { ...FONTS.regular, fontSize: 13, color: COLORS.gray500, marginTop: 6, textAlign: 'center' },

  headline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, padding: SPACING.lg, gap: 12,
  },
  headItem: { alignItems: 'center' },
  headValue: { ...FONTS.black, fontSize: 30 },
  headLabel: { ...FONTS.bold, fontSize: 8, color: COLORS.gray500, letterSpacing: 1, marginTop: 2 },
  headVs: { ...FONTS.regular, fontSize: 13, color: COLORS.gray600 },
  headBadge: {
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5, marginLeft: 6,
  },
  headBadgeText: { ...FONTS.bold, fontSize: 11 },

  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  cardTitle: { ...FONTS.bold, fontSize: 11, color: COLORS.gray500, letterSpacing: 0.5, marginBottom: 10 },
  hint: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginBottom: 10, lineHeight: 16 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.gray100, borderRadius: RADIUS.full,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...FONTS.semibold, fontSize: 10, color: COLORS.gray300 },

  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  totalLabel: { ...FONTS.semibold, fontSize: 10, color: COLORS.gray400, width: 56, textAlign: 'right' },
  totalBarBg: { flex: 1, height: 12, backgroundColor: COLORS.gray100, borderRadius: 6, overflow: 'hidden' },
  totalBar: { height: '100%', borderRadius: 6 },
  totalValue: { ...FONTS.bold, fontSize: 11, width: 44, textAlign: 'right' },

  axisLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 58 },
  axisLabel: { ...FONTS.regular, fontSize: 9, color: COLORS.gray600 },

  holeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  holeNum: { ...FONTS.heavy, fontSize: 12, color: COLORS.green400, width: 22 },
  holePar: { ...FONTS.regular, fontSize: 9, color: COLORS.gray600, width: 22 },
  stackTrack: {
    flex: 1, height: 14, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.gray100, borderRadius: 7, overflow: 'hidden',
  },
  negSide: { flex: 1, height: '100%', flexDirection: 'row-reverse' },
  axis: { width: 1.5, height: '100%', backgroundColor: COLORS.gray600 },
  posSide: { flex: 1, height: '100%', flexDirection: 'row' },
  holeDelta: { ...FONTS.bold, fontSize: 10, width: 44, textAlign: 'right' },

  nineSplit: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 12,
    paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.surfaceBorder,
  },
  nineText: { ...FONTS.regular, fontSize: 12, color: COLORS.gray400 },

  foot: { ...FONTS.regular, fontSize: 10, color: COLORS.gray600, textAlign: 'center', lineHeight: 15 },
});
