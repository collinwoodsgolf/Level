/**
 * LEVEL GOLF — Account Information
 * Profile, player information (phone, GHIN, handedness), GHIN vs Level
 * handicap comparison, security.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import SubHeader from '../components/SubHeader';

/**
 * Mock GHIN index lookup. Production: GHIN API integration — the player's
 * official index pulled by GHIN number, refreshed on each revision date.
 */
function mockGhinIndex(ghin) {
  if (!ghin || ghin.replace(/\D/g, '').length < 7) return null;
  return 9.8;
}

export default function AccountInfoScreen({ navigation }) {
  const user = useStore(st => st.user);
  const updateUser = useStore(st => st.updateUser);
  const rounds = useStore(st => st.rounds);
  const getHandicap = useStore(st => st.getHandicap);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [ghin, setGhin] = useState(user?.ghin || '');
  const [editing, setEditing] = useState(false);
  const hcp = getHandicap();
  const handedness = user?.handedness || 'right';
  const ghinIndex = mockGhinIndex(user?.ghin);
  const ghinDelta = ghinIndex != null && hcp != null ? +(hcp - ghinIndex).toFixed(1) : null;

  const memberSince = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Name cannot be empty.');
      return;
    }
    updateUser({ name: name.trim(), phone: phone.trim(), ghin: ghin.trim() });
    setEditing(false);
  };

  const setHandedness = (h) => updateUser({ handedness: h });

  return (
    <View style={s.container}>
      <SubHeader
        navigation={navigation}
        title="Account Information"
        right={
          <TouchableOpacity onPress={editing ? save : () => setEditing(true)}>
            <Text style={s.editLink}>{editing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + handicap */}
        <View style={s.profileTop}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user?.name || 'G').charAt(0).toUpperCase()}</Text>
          </View>
          {hcp != null && (
            <View style={s.hcpCard}>
              <Text style={s.hcpValue}>{hcp}</Text>
              <Text style={s.hcpLabel}>LEVEL HANDICAP</Text>
              <Text style={s.hcpNote}>vs dynamic rating</Text>
            </View>
          )}
        </View>

        {/* Player information */}
        <Text style={s.sectionLabel}>PLAYER INFORMATION</Text>
        <View style={s.card}>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Name</Text>
            {editing ? (
              <TextInput style={s.fieldInput} value={name} onChangeText={setName} autoCapitalize="words" />
            ) : (
              <Text style={s.fieldValue}>{user?.name || '—'}</Text>
            )}
          </View>
          <View style={s.divider} />
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Email</Text>
            <Text style={s.fieldValue}>{user?.email || '—'}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Phone</Text>
            {editing ? (
              <TextInput
                style={s.fieldInput} value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" placeholder="(555) 555-5555"
                placeholderTextColor={COLORS.gray600}
              />
            ) : (
              <Text style={s.fieldValue}>{user?.phone || '—'}</Text>
            )}
          </View>
          <View style={s.divider} />
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>GHIN #</Text>
            {editing ? (
              <TextInput
                style={s.fieldInput} value={ghin} onChangeText={setGhin}
                keyboardType="number-pad" placeholder="1234567"
                placeholderTextColor={COLORS.gray600}
              />
            ) : (
              <Text style={s.fieldValue}>{user?.ghin || '—'}</Text>
            )}
          </View>
          <View style={s.divider} />
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Plays</Text>
            <View style={s.handRow}>
              {[['right', 'Righty'], ['left', 'Lefty']].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.handBtn, handedness === key && s.handBtnOn]}
                  onPress={() => setHandedness(key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.handText, handedness === key && { color: COLORS.white }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Member Since</Text>
            <Text style={s.fieldValue}>{memberSince}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Rounds Posted</Text>
            <Text style={s.fieldValue}>{rounds.length}</Text>
          </View>
        </View>
        <Text style={s.handNote}>
          Handedness orients wind and (soon) putt-break insights in My Game —
          a left-to-right wind is your fade side as a {handedness === 'right' ? 'righty' : 'lefty'}.
        </Text>

        {/* GHIN vs Level comparison */}
        <Text style={s.sectionLabel}>GHIN vs LEVEL</Text>
        {ghinIndex != null ? (
          <View style={s.compareCard}>
            <View style={s.compareRow}>
              <View style={s.compareItem}>
                <Text style={[s.compareValue, { color: COLORS.gray400 }]}>{ghinIndex}</Text>
                <Text style={s.compareLabel}>GHIN INDEX</Text>
                <Text style={s.compareSub}>static ratings</Text>
              </View>
              <Text style={s.compareVs}>vs</Text>
              <View style={s.compareItem}>
                <Text style={[s.compareValue, { color: COLORS.green400 }]}>{hcp ?? '—'}</Text>
                <Text style={s.compareLabel}>LEVEL HANDICAP</Text>
                <Text style={s.compareSub}>dynamic ratings</Text>
              </View>
              {ghinDelta != null && (
                <View style={[s.deltaBadge, { backgroundColor: ghinDelta <= 0 ? COLORS.green900 : '#FBE4E2' }]}>
                  <Text style={[s.deltaText, { color: ghinDelta <= 0 ? COLORS.green400 : COLORS.red500 }]}>
                    {ghinDelta > 0 ? '+' : ''}{ghinDelta}
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.compareNote}>
              {ghinDelta == null ? '' : ghinDelta < 0
                ? 'Your Level handicap is lower — you\'ve been playing tougher conditions than GHIN gives you credit for.'
                : ghinDelta > 0
                  ? 'Your Level handicap runs higher — your recent scores came on easier-than-rated days.'
                  : 'Dead even — conditions have washed out across your recent rounds.'}
            </Text>
          </View>
        ) : (
          <View style={s.compareEmpty}>
            <Text style={s.compareEmptyText}>
              Add your GHIN # above to see how your official index compares with
              your conditions-adjusted Level handicap.
            </Text>
          </View>
        )}

        <Text style={s.sectionLabel}>SECURITY</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.fieldRow}
            onPress={() => Alert.alert('Change Password', 'A reset link will be sent to your email.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Send Link', onPress: () => Alert.alert('Sent', 'Check your inbox.') },
            ])}
          >
            <Text style={s.fieldLabel}>Change Password</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity
            style={s.fieldRow}
            onPress={() => Alert.alert(
              'Delete Account',
              'This permanently deletes your account, rounds, and handicap history.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account deletion', 'Account deletion will be available in the App Store release.') },
              ],
            )}
          >
            <Text style={[s.fieldLabel, { color: COLORS.red500 }]}>Delete Account</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.xl, paddingBottom: 48 },
  editLink: { ...FONTS.semibold, fontSize: 16, color: COLORS.green500 },

  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 26 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLORS.green700, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...FONTS.bold, fontSize: 30, color: COLORS.white },
  hcpCard: {
    flex: 1, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, alignItems: 'center', paddingVertical: 12,
  },
  hcpValue: { ...FONTS.black, fontSize: 28, color: COLORS.green400 },
  hcpLabel: { ...FONTS.bold, fontSize: 9, color: COLORS.gray500, letterSpacing: 1, marginTop: 2 },
  hcpNote: { ...FONTS.regular, fontSize: 10, color: COLORS.gray600, marginTop: 1 },

  sectionLabel: { ...FONTS.semibold, fontSize: 12, color: COLORS.gray500, letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: SPACING.lg,
  },
  fieldLabel: { ...FONTS.regular, fontSize: 15, color: COLORS.ink },
  fieldValue: { ...FONTS.regular, fontSize: 15, color: COLORS.gray400, maxWidth: '60%', textAlign: 'right' },
  fieldInput: {
    ...FONTS.regular, fontSize: 15, color: COLORS.ink, textAlign: 'right',
    borderBottomWidth: 1, borderBottomColor: COLORS.green500, minWidth: 140, paddingVertical: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.surfaceBorder, marginLeft: SPACING.lg },
  chevron: { ...FONTS.regular, fontSize: 20, color: COLORS.gray600 },

  handRow: { flexDirection: 'row', gap: 6 },
  handBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder,
  },
  handBtnOn: { backgroundColor: COLORS.green700, borderColor: COLORS.green700 },
  handText: { ...FONTS.semibold, fontSize: 13, color: COLORS.gray400 },
  handNote: { ...FONTS.regular, fontSize: 11, color: COLORS.gray600, lineHeight: 15, marginBottom: 18, paddingHorizontal: 4 },

  compareCard: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, padding: SPACING.lg, marginBottom: 22,
  },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  compareItem: { alignItems: 'center' },
  compareValue: { ...FONTS.black, fontSize: 26 },
  compareLabel: { ...FONTS.bold, fontSize: 8, color: COLORS.gray500, letterSpacing: 0.8, marginTop: 2 },
  compareSub: { ...FONTS.regular, fontSize: 9, color: COLORS.gray600, marginTop: 1 },
  compareVs: { ...FONTS.regular, fontSize: 13, color: COLORS.gray600 },
  deltaBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 4 },
  deltaText: { ...FONTS.heavy, fontSize: 14 },
  compareNote: {
    ...FONTS.regular, fontSize: 11, color: COLORS.gray500, textAlign: 'center',
    marginTop: 10, lineHeight: 16,
  },

  compareEmpty: {
    backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, borderStyle: 'dashed', marginBottom: 22,
  },
  compareEmptyText: { ...FONTS.regular, fontSize: 12, color: COLORS.gray500, textAlign: 'center', lineHeight: 17 },
});
