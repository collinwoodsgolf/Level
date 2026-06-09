/**
 * ATTESTED — Account Information
 * Profile details, editable name, handicap summary.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import SubHeader from '../components/SubHeader';

export default function AccountInfoScreen({ navigation }) {
  const user = useStore(st => st.user);
  const updateUser = useStore(st => st.updateUser);
  const rounds = useStore(st => st.rounds);
  const getHandicap = useStore(st => st.getHandicap);
  const [name, setName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const hcp = getHandicap();

  const memberSince = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Name cannot be empty.');
      return;
    }
    updateUser({ name: name.trim() });
    setEditing(false);
  };

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
              <Text style={s.hcpLabel}>HANDICAP INDEX</Text>
              <Text style={s.hcpNote}>vs dynamic rating</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <Text style={s.sectionLabel}>PROFILE</Text>
        <View style={s.card}>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Name</Text>
            {editing ? (
              <TextInput
                style={s.fieldInput}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
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
            <Text style={s.fieldLabel}>Member Since</Text>
            <Text style={s.fieldValue}>{memberSince}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Rounds Posted</Text>
            <Text style={s.fieldValue}>{rounds.length}</Text>
          </View>
        </View>

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
    borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: 22,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: SPACING.lg,
  },
  fieldLabel: { ...FONTS.regular, fontSize: 15, color: COLORS.ink },
  fieldValue: { ...FONTS.regular, fontSize: 15, color: COLORS.gray400, maxWidth: '60%', textAlign: 'right' },
  fieldInput: {
    ...FONTS.regular, fontSize: 15, color: COLORS.ink, textAlign: 'right',
    borderBottomWidth: 1, borderBottomColor: COLORS.green500, minWidth: 140, paddingVertical: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.surfaceBorder, marginLeft: SPACING.lg },
  chevron: { ...FONTS.regular, fontSize: 20, color: COLORS.gray600 },
});
