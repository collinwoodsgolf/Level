/**
 * LEVEL GOLF — Round History
 * Every posted round with the dynamic rating it was played against,
 * its differential, and the resulting handicap index.
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import SubHeader from '../components/SubHeader';

function fmtDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function RoundCard({ round }) {
  const diff = round.differential;
  const diffColor = diff <= 5 ? COLORS.green400 : diff <= 10 ? COLORS.amber500 : COLORS.orange500;
  const playedHarder = round.dynamicRating > round.staticRating;
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.course}>{round.course}</Text>
          <Text style={s.meta}>{fmtDate(round.date)} · {round.tee} tees · {round.weather}</Text>
        </View>
        {round.attested && (
          <View style={s.attestedBadge}>
            <Text style={s.attestedText}>✓ ATTESTED</Text>
          </View>
        )}
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>{round.score}</Text>
          <Text style={s.statLabel}>SCORE</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={[s.statValue, { color: playedHarder ? COLORS.orange500 : COLORS.green400 }]}>
            {round.dynamicRating}
          </Text>
          <Text style={s.statLabel}>DYN RATING</Text>
          <Text style={s.statSub}>static {round.staticRating}</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statValue}>{round.dynamicSlope}</Text>
          <Text style={s.statLabel}>DYN SLOPE</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={[s.statValue, { color: diffColor }]}>{diff > 0 ? '+' : ''}{diff}</Text>
          <Text style={s.statLabel}>DIFFERENTIAL</Text>
        </View>
      </View>

      {/* Strokes gained (when tracked) */}
      {round.sg && (
        <View style={s.sgRow}>
          {[['tee', 'TEE'], ['approach', 'APP'], ['short', 'ARG'], ['putting', 'PUTT'], ['total', 'SG TOT']].map(([k, label]) => (
            <View key={k} style={[s.sgChip, k === 'total' && s.sgChipTotal]}>
              <Text style={[s.sgValue, { color: round.sg[k] >= 0 ? COLORS.green400 : COLORS.red500 }]}>
                {round.sg[k] > 0 ? '+' : ''}{round.sg[k].toFixed(1)}
              </Text>
              <Text style={s.sgLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function RoundHistoryScreen({ navigation }) {
  const rounds = useStore(st => st.rounds);
  const getHandicap = useStore(st => st.getHandicap);
  const hcp = getHandicap();
  const avgScore = rounds.length
    ? (rounds.reduce((a, r) => a + r.score, 0) / rounds.length).toFixed(1)
    : '—';
  const best = rounds.length ? Math.min(...rounds.map(r => r.differential)) : null;

  return (
    <View style={s.container}>
      <SubHeader navigation={navigation} title="Round History" />

      {/* Summary strip */}
      <View style={s.summary}>
        <View style={s.sumItem}>
          <Text style={s.sumValue}>{hcp ?? '—'}</Text>
          <Text style={s.sumLabel}>HANDICAP</Text>
        </View>
        <View style={s.sumItem}>
          <Text style={s.sumValue}>{rounds.length}</Text>
          <Text style={s.sumLabel}>ROUNDS</Text>
        </View>
        <View style={s.sumItem}>
          <Text style={s.sumValue}>{avgScore}</Text>
          <Text style={s.sumLabel}>AVG SCORE</Text>
        </View>
        <View style={s.sumItem}>
          <Text style={s.sumValue}>{best != null ? (best > 0 ? '+' : '') + best : '—'}</Text>
          <Text style={s.sumLabel}>BEST DIFF</Text>
        </View>
      </View>
      <Text style={s.tagline}>
        Differentials are computed against the dynamic rating the day you played — tough days count.
      </Text>

      <FlatList
        data={rounds}
        keyExtractor={r => r.id}
        renderItem={({ item }) => <RoundCard round={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>⛳</Text>
            <Text style={s.emptyText}>No rounds yet</Text>
            <Text style={s.emptySub}>Post your first round and your dynamic handicap starts here.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },

  summary: {
    flexDirection: 'row', marginHorizontal: SPACING.xl, marginTop: SPACING.lg,
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, paddingVertical: 14,
  },
  sumItem: { flex: 1, alignItems: 'center' },
  sumValue: { ...FONTS.heavy, fontSize: 20, color: COLORS.green400 },
  sumLabel: { ...FONTS.bold, fontSize: 8, color: COLORS.gray500, letterSpacing: 1, marginTop: 3 },
  tagline: {
    ...FONTS.regular, fontSize: 11, color: COLORS.gray600, textAlign: 'center',
    marginTop: 10, marginHorizontal: SPACING.xxl, lineHeight: 15,
  },

  list: { padding: SPACING.xl, gap: 12, paddingBottom: 48 },
  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, padding: SPACING.lg,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  course: { ...FONTS.bold, fontSize: 15, color: COLORS.ink },
  meta: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 3 },
  attestedBadge: {
    backgroundColor: COLORS.green900, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8,
  },
  attestedText: { ...FONTS.bold, fontSize: 9, color: COLORS.green400, letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...FONTS.heavy, fontSize: 18, color: COLORS.ink },
  statLabel: { ...FONTS.bold, fontSize: 7.5, color: COLORS.gray500, letterSpacing: 0.8, marginTop: 3 },
  statSub: { ...FONTS.regular, fontSize: 9, color: COLORS.gray600, marginTop: 1 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: COLORS.surfaceBorder },

  sgRow: {
    flexDirection: 'row', gap: 6, marginTop: 12, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.surfaceBorder,
  },
  sgChip: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md, paddingVertical: 6,
  },
  sgChipTotal: { backgroundColor: COLORS.green900 },
  sgValue: { ...FONTS.heavy, fontSize: 12 },
  sgLabel: { ...FONTS.bold, fontSize: 6.5, color: COLORS.gray500, letterSpacing: 0.6, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { ...FONTS.bold, fontSize: 17, color: COLORS.ink },
  emptySub: { ...FONTS.regular, fontSize: 13, color: COLORS.gray500, textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
});
