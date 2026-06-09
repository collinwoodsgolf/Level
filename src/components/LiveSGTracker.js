/**
 * LEVEL GOLF — Live Strokes Gained Tracker
 * Shown during an active round when SG tracking is on.
 * Four taps per hole: score, putts, fairway, green — SG vs today's
 * conditions-adjusted baseline updates live.
 * TODO(GPS): auto-capture shots from phone GPS → zero-tap strokes gained.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import { aggregateRoundSG, computeHoleSG, SG_LABELS } from '../services/strokesGained';

function Stepper({ label, value, onChange, min = 0, max = 12 }) {
  return (
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{label}</Text>
      <View style={s.stepRow}>
        <TouchableOpacity
          style={s.stepBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={s.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.stepValue}>{value}</Text>
        <TouchableOpacity
          style={s.stepBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={s.stepBtnText}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Toggle({ label, value, onChange, disabled }) {
  return (
    <TouchableOpacity
      style={[s.toggle, value && s.toggleOn, disabled && { opacity: 0.35 }]}
      onPress={() => !disabled && onChange(!value)}
      activeOpacity={0.8}
    >
      <Text style={[s.toggleText, value && { color: COLORS.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LiveSGTracker() {
  const activeRound = useStore(st => st.activeRound);
  const recordHoleStats = useStore(st => st.recordHoleStats);
  const [hole, setHole] = useState(1);
  const [score, setScore] = useState(4);
  const [putts, setPutts] = useState(2);
  const [fir, setFir] = useState(true);
  const [gir, setGir] = useState(true);

  if (!activeRound?.sgEnabled) return null;

  const meta = activeRound.holeMeta?.[hole] || { par: 4, difficulty_delta: 0 };
  const isPar3 = meta.par === 3;
  const saved = activeRound.holeStats?.[hole];
  const running = aggregateRoundSG(activeRound.holeStats, activeRound.holeMeta);
  const preview = computeHoleSG(
    { score, putts, fir: isPar3 ? null : fir, gir }, meta,
  );

  const save = () => {
    recordHoleStats(hole, { score, putts, fir: isPar3 ? null : fir, gir });
    // Advance to the next unrecorded hole, reset sensible defaults
    const next = hole < 18 ? hole + 1 : 18;
    const nextPar = activeRound.holeMeta?.[next]?.par || 4;
    setHole(next);
    setScore(nextPar);
    setPutts(2);
    setFir(true);
    setGir(false);
  };

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.title}>STROKES GAINED — LIVE</Text>
        <Text style={s.holesDone}>{running?.holes || 0}/18 holes</Text>
      </View>

      {/* Running totals */}
      <View style={s.totalsRow}>
        {Object.entries(SG_LABELS).map(([k, label]) => (
          <View key={k} style={s.totalItem}>
            <Text style={[s.totalValue, {
              color: (running?.[k] ?? 0) >= 0 ? COLORS.green500 : COLORS.red500,
            }]}>
              {running ? (running[k] > 0 ? '+' : '') + running[k].toFixed(1) : '—'}
            </Text>
            <Text style={s.totalLabel}>{label.toUpperCase()}</Text>
          </View>
        ))}
        <View style={[s.totalItem, s.totalDivider]}>
          <Text style={[s.totalValue, {
            color: (running?.total ?? 0) >= 0 ? COLORS.green500 : COLORS.red500, ...FONTS.black,
          }]}>
            {running ? (running.total > 0 ? '+' : '') + running.total.toFixed(1) : '—'}
          </Text>
          <Text style={s.totalLabel}>TOTAL</Text>
        </View>
      </View>

      {/* Hole picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.holeRow}>
        {Array.from({ length: 18 }, (_, i) => i + 1).map(n => {
          const done = !!activeRound.holeStats?.[n];
          const on = hole === n;
          return (
            <TouchableOpacity
              key={n}
              style={[s.holeChip, done && s.holeChipDone, on && s.holeChipOn]}
              onPress={() => {
                setHole(n);
                const st = activeRound.holeStats?.[n];
                const par = activeRound.holeMeta?.[n]?.par || 4;
                setScore(st?.score ?? par);
                setPutts(st?.putts ?? 2);
                setFir(st?.fir ?? true);
                setGir(st?.gir ?? false);
              }}
            >
              <Text style={[s.holeChipText, (on || done) && { color: COLORS.white }]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Entry */}
      <View style={s.entryRow}>
        <Stepper label={`SCORE · PAR ${meta.par}`} value={score} onChange={setScore} min={1} />
        <Stepper label="PUTTS" value={putts} onChange={setPutts} min={0} max={6} />
      </View>
      <View style={s.entryRow}>
        <Toggle label="Fairway" value={fir} onChange={setFir} disabled={isPar3} />
        <Toggle label="Green in Reg" value={gir} onChange={setGir} />
      </View>

      {/* Hole preview + save */}
      <TouchableOpacity style={s.saveBtn} onPress={save} activeOpacity={0.85}>
        <Text style={s.saveText}>
          {saved ? 'Update' : 'Save'} Hole {hole}
          {preview ? `  ·  ${preview.total > 0 ? '+' : ''}${preview.total.toFixed(2)} SG` : ''}
        </Text>
      </TouchableOpacity>

      <Text style={s.note}>
        SG vs scratch under today's locked conditions · GPS auto-tracking coming soon
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.green600 + '55', padding: SPACING.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { ...FONTS.bold, fontSize: 11, color: COLORS.green400, letterSpacing: 1 },
  holesDone: { ...FONTS.semibold, fontSize: 11, color: COLORS.gray500 },

  totalsRow: {
    flexDirection: 'row', backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md, paddingVertical: 8, marginBottom: 10,
  },
  totalItem: { flex: 1, alignItems: 'center' },
  totalDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.gray200 },
  totalValue: { ...FONTS.heavy, fontSize: 13 },
  totalLabel: { ...FONTS.bold, fontSize: 6, color: COLORS.gray500, letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },

  holeRow: { gap: 6, paddingBottom: 10 },
  holeChip: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder,
  },
  holeChipDone: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  holeChipOn: { backgroundColor: COLORS.green700, borderColor: COLORS.green700 },
  holeChipText: { ...FONTS.bold, fontSize: 11, color: COLORS.gray400 },

  entryRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  stepper: { flex: 1 },
  stepLabel: { ...FONTS.bold, fontSize: 8, color: COLORS.gray500, letterSpacing: 0.6, marginBottom: 4, textAlign: 'center' },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.gray100, borderRadius: RADIUS.md, paddingHorizontal: 6, paddingVertical: 4,
  },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  stepBtnText: { ...FONTS.bold, fontSize: 15, color: COLORS.green700 },
  stepValue: { ...FONTS.black, fontSize: 18, color: COLORS.ink },

  toggle: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder,
  },
  toggleOn: { backgroundColor: COLORS.green700, borderColor: COLORS.green700 },
  toggleText: { ...FONTS.semibold, fontSize: 12, color: COLORS.gray400 },

  saveBtn: { backgroundColor: COLORS.green700, borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center', marginTop: 2 },
  saveText: { ...FONTS.bold, fontSize: 13, color: COLORS.white },
  note: { ...FONTS.regular, fontSize: 9, color: COLORS.gray600, textAlign: 'center', marginTop: 8 },
});
