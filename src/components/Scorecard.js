/**
 * LEVEL GOLF — Scorecard
 * Classic front/back-nine scorecard grid built from static course data,
 * so it ALWAYS renders — no dependency on weather or rating computation.
 * When a dynamic rating is available, an effective-yardage row is added.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';

const CELL_W = 44;
const LABEL_W = 64;

function Cell({ children, w = CELL_W, style, textStyle }) {
  return (
    <View style={[s.cell, { width: w }, style]}>
      <Text style={[s.cellText, textStyle]} numberOfLines={1}>{children}</Text>
    </View>
  );
}

function NineGrid({ title, holes, teeBox, effByHole, totalLabel }) {
  const pars = holes.map(h => h.par);
  const ydsArr = holes.map(h => h.yds[teeBox] ?? h.yds.black);
  const sumPar = pars.reduce((a, b) => a + b, 0);
  const sumYds = ydsArr.reduce((a, b) => a + b, 0);
  const effArr = effByHole ? holes.map(h => effByHole[h.hole]) : null;
  const sumEff = effArr ? effArr.reduce((a, b) => a + (b || 0), 0) : null;

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.nineTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View>
          {/* Hole numbers */}
          <View style={[s.row, s.rowHeader]}>
            <Cell w={LABEL_W} textStyle={s.labelText}>HOLE</Cell>
            {holes.map(h => (
              <Cell key={h.hole} textStyle={s.holeNumText}>{h.hole}</Cell>
            ))}
            <Cell w={52} textStyle={s.holeNumText}>{totalLabel}</Cell>
          </View>
          {/* Par */}
          <View style={s.row}>
            <Cell w={LABEL_W} textStyle={s.labelText}>PAR</Cell>
            {pars.map((p, i) => <Cell key={i}>{p}</Cell>)}
            <Cell w={52} textStyle={s.totalText}>{sumPar}</Cell>
          </View>
          {/* Yardage */}
          <View style={s.row}>
            <Cell w={LABEL_W} textStyle={s.labelText}>YDS</Cell>
            {ydsArr.map((y, i) => <Cell key={i}>{y}</Cell>)}
            <Cell w={52} textStyle={s.totalText}>{sumYds}</Cell>
          </View>
          {/* Effective yardage (dynamic) */}
          {effArr && (
            <View style={s.row}>
              <Cell w={LABEL_W} textStyle={[s.labelText, { color: COLORS.green500 }]}>EFF</Cell>
              {effArr.map((y, i) => (
                <Cell
                  key={i}
                  textStyle={{ color: y > ydsArr[i] ? COLORS.orange500 : COLORS.green400 }}
                >
                  {y ?? '—'}
                </Cell>
              ))}
              <Cell w={52} textStyle={[s.totalText, { color: COLORS.green400 }]}>{sumEff || '—'}</Cell>
            </View>
          )}
          {/* Handicap */}
          <View style={[s.row, { borderBottomWidth: 0 }]}>
            <Cell w={LABEL_W} textStyle={s.labelText}>HCP</Cell>
            {holes.map(h => <Cell key={h.hole} textStyle={s.hcpText}>{h.hcp}</Cell>)}
            <Cell w={52}>{''}</Cell>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function Scorecard({ holes, teeBox = 'black', teeInfo, rating }) {
  if (!holes?.length) return null;

  // Map effective yardage per hole when the dynamic rating is available
  const effByHole = rating?.hole_difficulties
    ? Object.fromEntries(rating.hole_difficulties.map(h => [h.hole, h.effective_yardage]))
    : null;

  const front = holes.slice(0, 9);
  const back = holes.slice(9, 18);

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={s.cardTitle}>SCORECARD</Text>
        {teeInfo && (
          <Text style={s.teeMeta}>
            {teeInfo.label} · {teeInfo.yardage.toLocaleString()} yds · {teeInfo.rating}/{teeInfo.slope}
          </Text>
        )}
      </View>
      <NineGrid title="FRONT NINE" holes={front} teeBox={teeBox} effByHole={effByHole} totalLabel="OUT" />
      <NineGrid title="BACK NINE" holes={back} teeBox={teeBox} effByHole={effByHole} totalLabel="IN" />
      {effByHole && (
        <Text style={s.note}>
          EFF = effective yardage under today's wind, temperature & conditions
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { ...FONTS.bold, fontSize: 11, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  teeMeta: { ...FONTS.semibold, fontSize: 11, color: COLORS.gray400 },
  nineTitle: { ...FONTS.bold, fontSize: 9, color: COLORS.gray600, letterSpacing: 1, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.surfaceBorder,
  },
  rowHeader: { backgroundColor: COLORS.surfaceBorder + '44', borderRadius: 4 },
  cell: { paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
  cellText: { ...FONTS.regular, fontSize: 12, color: COLORS.gray300 },
  labelText: { ...FONTS.bold, fontSize: 10, color: COLORS.gray500 },
  holeNumText: { ...FONTS.heavy, fontSize: 12, color: COLORS.green400 },
  totalText: { ...FONTS.heavy, fontSize: 12, color: COLORS.ink },
  hcpText: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500 },
  note: { ...FONTS.regular, fontSize: 10, color: COLORS.gray600, marginTop: 8, textAlign: 'center' },
});
