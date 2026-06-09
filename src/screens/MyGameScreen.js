/**
 * LEVEL GOLF — My Game (Player Insights)
 * How conditions outside your control affect YOUR scoring:
 * strokes gained/lost vs your own baseline in each condition bucket.
 * Sharpens automatically with every attested round.
 */
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { analyzePlayer, insightSentence, generateMockHistory } from '../services/insights';
import { useStore } from '../services/store';
import TopNav from '../components/TopNav';

function ConfidenceDots({ level }) {
  const n = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <View style={s.dotsRow}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[s.confDot, i < n && s.confDotOn]} />
      ))}
      <Text style={s.confText}>{level} confidence</Text>
    </View>
  );
}

function InsightCard({ ins }) {
  const isWeak = ins.kind === 'weakness';
  const color = isWeak ? COLORS.red500 : COLORS.green500;
  const barPct = Math.min(100, (Math.abs(ins.effect) / 0.6) * 100);
  return (
    <TouchableOpacity
      style={[s.card, { borderLeftWidth: 3, borderLeftColor: color }]}
      activeOpacity={0.75}
      onPress={() => Alert.alert(ins.label, `${insightSentence(ins)}\n\nCoach's tip: ${ins.tip}\n\nBased on ${ins.n} holes of exposure.`)}
    >
      <View style={s.cardTop}>
        <Text style={s.cardIcon}>{ins.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.cardLabel}>{ins.label}</Text>
          <Text style={s.cardMeta}>{ins.n} holes observed</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.effect, { color }]}>
            {isWeak ? '+' : '−'}{Math.abs(ins.effect).toFixed(2)}
          </Text>
          <Text style={s.effectUnit}>strokes/hole</Text>
        </View>
      </View>
      <View style={s.barBg}>
        <View style={[s.bar, { width: `${barPct}%`, backgroundColor: color }]} />
      </View>
      <View style={s.cardBottom}>
        <Text style={[s.kindBadge, { color }]}>
          {isWeak ? `≈ ${Math.abs(ins.per18).toFixed(1)} strokes/round lost` : `≈ ${Math.abs(ins.per18).toFixed(1)} strokes/round gained`}
        </Text>
        <ConfidenceDots level={ins.confidence} />
      </View>
    </TouchableOpacity>
  );
}

export default function MyGameScreen({ navigation }) {
  const user = useStore(st => st.user);
  const handedness = user?.handedness || 'right';
  const analysis = useMemo(
    () => analyzePlayer(generateMockHistory(), { handedness }),
    [handedness],
  );
  const weaknesses = analysis.insights.filter(i => i.kind === 'weakness');
  const strengths = analysis.insights.filter(i => i.kind === 'strength');
  const top = analysis.insights[0];

  return (
    <View style={s.container}>
      <TopNav navigation={navigation} title="MY GAME" subtitle="How conditions shape your scoring" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Headline takeaway */}
        {top && (
          <View style={s.heroCard}>
            <Text style={s.heroKicker}>BIGGEST {top.kind === 'weakness' ? 'LEAK' : 'EDGE'}</Text>
            <Text style={s.heroText}>{insightSentence(top)}</Text>
            <Text style={s.heroTip}>💡 {top.tip}</Text>
          </View>
        )}

        {/* Sample summary */}
        <View style={s.summaryRow}>
          <View style={s.sumItem}>
            <Text style={s.sumValue}>{analysis.rounds}</Text>
            <Text style={s.sumLabel}>ROUNDS</Text>
          </View>
          <View style={s.sumItem}>
            <Text style={s.sumValue}>{analysis.totalHoles}</Text>
            <Text style={s.sumLabel}>HOLES</Text>
          </View>
          <View style={s.sumItem}>
            <Text style={s.sumValue}>{analysis.baseline > 0 ? '+' : ''}{analysis.baseline}</Text>
            <Text style={s.sumLabel}>BASELINE/HOLE</Text>
          </View>
          <View style={s.sumItem}>
            <Text style={s.sumValue}>{analysis.insights.length}</Text>
            <Text style={s.sumLabel}>SIGNALS</Text>
          </View>
        </View>

        {weaknesses.length > 0 && (
          <>
            <Text style={s.sectionLabel}>COSTING YOU STROKES</Text>
            {weaknesses.map(ins => <InsightCard key={ins.key} ins={ins} />)}
          </>
        )}

        {strengths.length > 0 && (
          <>
            <Text style={s.sectionLabel}>WHERE YOU SHINE</Text>
            {strengths.map(ins => <InsightCard key={ins.key} ins={ins} />)}
          </>
        )}

        {analysis.needMore && (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyTitle}>Not enough rounds yet</Text>
            <Text style={s.emptyText}>
              Post at least one full attested round and your condition profile starts building automatically.
            </Text>
          </View>
        )}

        <Text style={s.foot}>
          Effects are measured against YOUR baseline after removing each hole's
          conditions-adjusted difficulty — so this isolates how the elements,
          not the architecture, move your score. Every attested round sharpens it.
          {'\n'}Wind directions oriented for a {handedness === 'left' ? 'left' : 'right'}-handed
          player — change in Account → Player Information.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg, paddingBottom: 48, gap: 10 },

  heroCard: {
    backgroundColor: '#E7F0E8', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.green500 + '33', padding: SPACING.lg,
  },
  heroKicker: { ...FONTS.bold, fontSize: 10, color: COLORS.green400, letterSpacing: 1.2 },
  heroText: { ...FONTS.semibold, fontSize: 15, color: COLORS.ink, marginTop: 6, lineHeight: 21 },
  heroTip: { ...FONTS.regular, fontSize: 12, color: COLORS.gray400, marginTop: 8, lineHeight: 17 },

  summaryRow: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    paddingVertical: 12,
  },
  sumItem: { flex: 1, alignItems: 'center' },
  sumValue: { ...FONTS.heavy, fontSize: 17, color: COLORS.green400 },
  sumLabel: { ...FONTS.bold, fontSize: 7, color: COLORS.gray500, letterSpacing: 0.8, marginTop: 3 },

  sectionLabel: { ...FONTS.bold, fontSize: 11, color: COLORS.gray500, letterSpacing: 1.2, marginTop: 8, marginBottom: -2 },

  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, padding: SPACING.lg,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 20 },
  cardLabel: { ...FONTS.semibold, fontSize: 14, color: COLORS.ink },
  cardMeta: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  effect: { ...FONTS.black, fontSize: 20 },
  effectUnit: { ...FONTS.regular, fontSize: 9, color: COLORS.gray500 },

  barBg: { height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  bar: { height: '100%', borderRadius: 3 },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  kindBadge: { ...FONTS.semibold, fontSize: 11 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  confDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.gray200 },
  confDotOn: { backgroundColor: COLORS.green500 },
  confText: { ...FONTS.regular, fontSize: 9, color: COLORS.gray500, marginLeft: 4 },

  emptyCard: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { ...FONTS.bold, fontSize: 16, color: COLORS.ink },
  emptyText: { ...FONTS.regular, fontSize: 13, color: COLORS.gray500, textAlign: 'center', marginTop: 6, lineHeight: 19 },

  foot: { ...FONTS.regular, fontSize: 10, color: COLORS.gray600, textAlign: 'center', lineHeight: 15, marginTop: 6 },
});
