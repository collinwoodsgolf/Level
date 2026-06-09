/**
 * ATTESTED — Wagers
 * Peer-to-peer matches: two players lock in against the same dynamic
 * rating snapshot at tee-off, so the terms are attested and indisputable.
 * DraftKings-style verified betting integration is planned (placeholder).
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import TopNav from '../components/TopNav';

const STAKES = [5, 10, 20, 50];
const FORMATS = [
  { key: 'net_stroke', label: 'Net Stroke Play', desc: 'Dynamic handicaps applied' },
  { key: 'match', label: 'Match Play', desc: 'Hole by hole' },
  { key: 'skins', label: 'Skins', desc: 'Carry-overs' },
];

function NewMatchCard({ friends, rating, onCreate }) {
  const [opponent, setOpponent] = useState(null);
  const [stake, setStake] = useState(10);
  const [format, setFormat] = useState('net_stroke');

  const create = () => {
    if (!opponent) {
      Alert.alert('Pick an Opponent', 'Select who you are playing against.');
      return;
    }
    if (!rating) {
      Alert.alert('No Rating Yet', "Today's dynamic rating hasn't been computed — check the dashboard.");
      return;
    }
    const f = friends.find(x => x.id === opponent);
    Alert.alert(
      'Start Match?',
      `You vs ${f.name}\n$${stake} · ${FORMATS.find(x => x.key === format).label}\n\nLocks today's rating at ${rating.today_rating} / ${rating.today_slope}. Both players tap Start Round to begin.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Match',
          onPress: () => {
            onCreate({ opponent: f, stake, format: FORMATS.find(x => x.key === format).label });
            setOpponent(null);
          },
        },
      ],
    );
  };

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>NEW MATCH</Text>

      <Text style={s.fieldLabel}>Opponent</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.oppRow}>
        {friends.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[s.oppChip, opponent === f.id && s.oppChipOn]}
            onPress={() => setOpponent(f.id)}
            activeOpacity={0.7}
          >
            <View style={[s.oppAvatar, opponent === f.id && { backgroundColor: COLORS.green700 }]}>
              <Text style={[s.oppAvatarText, opponent === f.id && { color: COLORS.white }]}>{f.initials}</Text>
            </View>
            <Text style={s.oppName} numberOfLines={1}>{f.name.split(' ')[0]}</Text>
            <Text style={s.oppHcp}>{f.handicap}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.fieldLabel}>Stake</Text>
      <View style={s.stakeRow}>
        {STAKES.map(v => (
          <TouchableOpacity
            key={v}
            style={[s.stakeBtn, stake === v && s.stakeBtnOn]}
            onPress={() => setStake(v)}
            activeOpacity={0.8}
          >
            <Text style={[s.stakeText, stake === v && { color: COLORS.white }]}>${v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.fieldLabel}>Format</Text>
      <View style={s.formatCol}>
        {FORMATS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.formatRow, format === f.key && s.formatRowOn]}
            onPress={() => setFormat(f.key)}
            activeOpacity={0.8}
          >
            <View style={[s.radio, format === f.key && s.radioOn]} />
            <Text style={s.formatLabel}>{f.label}</Text>
            <Text style={s.formatDesc}>{f.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {rating && (
        <View style={s.lockNote}>
          <Text style={s.lockNoteText}>
            🔒 Locks today's rating: <Text style={{ ...FONTS.bold, color: COLORS.green400 }}>
              {rating.today_rating} / {rating.today_slope}
            </Text>
          </Text>
        </View>
      )}

      <TouchableOpacity style={s.startBtn} onPress={create} activeOpacity={0.85}>
        <Text style={s.startBtnText}>Start Match — Both Players Tap In</Text>
      </TouchableOpacity>
    </View>
  );
}

function WagerCard({ wager, onSettle }) {
  const active = wager.status === 'active';
  return (
    <View style={[s.card, active && { borderColor: COLORS.green500 + '66' }]}>
      <View style={s.wagerTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.wagerVs}>You vs {wager.opponent.name}</Text>
          <Text style={s.wagerMeta}>
            ${wager.stake} · {wager.format} · locked {wager.lockedRating}/{wager.lockedSlope}
          </Text>
        </View>
        <View style={[s.statusBadge, active ? s.statusActive : s.statusSettled]}>
          <Text style={[s.statusText, active ? { color: COLORS.green400 } : { color: COLORS.gray500 }]}>
            {active ? 'LIVE' : wager.result === 'won' ? 'WON' : wager.result === 'lost' ? 'LOST' : 'PUSH'}
          </Text>
        </View>
      </View>
      {active && (
        <View style={s.settleRow}>
          <TouchableOpacity style={[s.settleBtn, { borderColor: COLORS.green600 }]} onPress={() => onSettle(wager.id, 'won')}>
            <Text style={[s.settleText, { color: COLORS.green500 }]}>I Won</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.settleBtn, { borderColor: COLORS.red500 }]} onPress={() => onSettle(wager.id, 'lost')}>
            <Text style={[s.settleText, { color: COLORS.red500 }]}>They Won</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settleBtn} onPress={() => onSettle(wager.id, 'push')}>
            <Text style={[s.settleText, { color: COLORS.gray400 }]}>Push</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function WagersScreen({ navigation }) {
  const friends = useStore(st => st.friends);
  const rating = useStore(st => st.rating);
  const wagers = useStore(st => st.wagers);
  const createWager = useStore(st => st.createWager);
  const settleWager = useStore(st => st.settleWager);

  const active = wagers.filter(w => w.status === 'active');
  const settled = wagers.filter(w => w.status !== 'active');

  const handleSettle = (id, result) => {
    Alert.alert('Settle Match', 'Both players confirm the result in production — for now this settles instantly.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => settleWager(id, result) },
    ]);
  };

  return (
    <View style={s.container}>
      <TopNav navigation={navigation} title="WAGERS" subtitle="Attested peer-to-peer matches" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {active.length > 0 && (
          <>
            <Text style={s.sectionLabel}>LIVE MATCHES</Text>
            {active.map(w => <WagerCard key={w.id} wager={w} onSettle={handleSettle} />)}
          </>
        )}

        <Text style={s.sectionLabel}>CREATE</Text>
        <NewMatchCard friends={friends} rating={rating} onCreate={createWager} />

        {settled.length > 0 && (
          <>
            <Text style={s.sectionLabel}>HISTORY</Text>
            {settled.map(w => <WagerCard key={w.id} wager={w} onSettle={handleSettle} />)}
          </>
        )}

        {/* DraftKings placeholder */}
        <View style={s.dkCard}>
          <Text style={s.dkIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.dkTitle}>Verified Betting — Coming Soon</Text>
            <Text style={s.dkDesc}>
              Planned sportsbook integration (e.g. DraftKings) for escrowed, verifiable wagers
              backed by GPS-attested scores and locked dynamic ratings.
            </Text>
          </View>
        </View>

        <Text style={s.disclaimer}>
          Wagers are friendly side-bets settled between players. Play responsibly;
          must be of legal age where applicable.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg, paddingBottom: 48, gap: 12 },
  sectionLabel: { ...FONTS.bold, fontSize: 11, color: COLORS.gray500, letterSpacing: 1.2, marginTop: 6, marginBottom: -2 },

  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  cardTitle: { ...FONTS.bold, fontSize: 11, color: COLORS.gray500, letterSpacing: 0.5, marginBottom: 4 },

  fieldLabel: { ...FONTS.semibold, fontSize: 12, color: COLORS.gray400, marginTop: 12, marginBottom: 8 },

  oppRow: { gap: 8 },
  oppChip: {
    width: 64, alignItems: 'center', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder, paddingVertical: 8,
  },
  oppChipOn: { borderColor: COLORS.green600, backgroundColor: COLORS.green50 },
  oppAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.green800,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  oppAvatarText: { ...FONTS.bold, fontSize: 11, color: COLORS.green400 },
  oppName: { ...FONTS.semibold, fontSize: 10, color: COLORS.ink },
  oppHcp: { ...FONTS.heavy, fontSize: 10, color: COLORS.gray500, marginTop: 1 },

  stakeRow: { flexDirection: 'row', gap: 8 },
  stakeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder,
  },
  stakeBtnOn: { backgroundColor: COLORS.green700, borderColor: COLORS.green700 },
  stakeText: { ...FONTS.bold, fontSize: 14, color: COLORS.gray300 },

  formatCol: { gap: 6 },
  formatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder, borderRadius: RADIUS.md,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  formatRowOn: { borderColor: COLORS.green600, backgroundColor: COLORS.green50 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.gray600 },
  radioOn: { borderColor: COLORS.green700, backgroundColor: COLORS.green700 },
  formatLabel: { ...FONTS.semibold, fontSize: 13, color: COLORS.ink },
  formatDesc: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginLeft: 'auto' },

  lockNote: {
    backgroundColor: '#E7F0E8', borderRadius: RADIUS.md, padding: 10, marginTop: 14,
  },
  lockNoteText: { ...FONTS.regular, fontSize: 12, color: COLORS.gray300, textAlign: 'center' },

  startBtn: {
    backgroundColor: COLORS.green700, borderRadius: RADIUS.md,
    padding: 14, alignItems: 'center', marginTop: 10,
  },
  startBtnText: { ...FONTS.bold, fontSize: 15, color: COLORS.white },

  wagerTop: { flexDirection: 'row', alignItems: 'center' },
  wagerVs: { ...FONTS.bold, fontSize: 15, color: COLORS.ink },
  wagerMeta: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 3 },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusActive: { backgroundColor: COLORS.green900 },
  statusSettled: { backgroundColor: COLORS.gray100 },
  statusText: { ...FONTS.bold, fontSize: 10, letterSpacing: 1 },

  settleRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  settleBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md, paddingVertical: 9, alignItems: 'center',
  },
  settleText: { ...FONTS.semibold, fontSize: 12 },

  dkCard: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, borderStyle: 'dashed',
    padding: SPACING.lg, marginTop: 6,
  },
  dkIcon: { fontSize: 26 },
  dkTitle: { ...FONTS.bold, fontSize: 14, color: COLORS.ink },
  dkDesc: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 4, lineHeight: 16 },

  disclaimer: { ...FONTS.regular, fontSize: 10, color: COLORS.gray600, textAlign: 'center', lineHeight: 14 },
});
