/**
 * ATTESTED — TopNav
 * Shared header: logo + title on the left, avatar menu on the top right.
 * Menu pages: Account Information, Billing, Settings, Round History, Sign Out.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import Logo from './Logo';

const MENU_ITEMS = [
  { key: 'AccountInfo', icon: '👤', label: 'Account Information' },
  { key: 'Billing', icon: '💳', label: 'Billing' },
  { key: 'Settings', icon: '⚙️', label: 'Settings' },
  { key: 'RoundHistory', icon: '🗂', label: 'Round History' },
];

export default function TopNav({ navigation, title, subtitle }) {
  const [open, setOpen] = useState(false);
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const getHandicap = useStore(s => s.getHandicap);
  const hcp = getHandicap();

  const go = (screen) => {
    setOpen(false);
    // Small delay so the modal fully dismisses before navigation (iOS)
    setTimeout(() => navigation.navigate(screen), 120);
  };

  const handleSignOut = () => {
    setOpen(false);
    setTimeout(() => {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]);
    }, 150);
  };

  return (
    <View style={s.header}>
      <View style={s.left}>
        <Logo size={34} />
        <View style={{ marginLeft: 10 }}>
          <Text style={s.title}>{title || 'ATTESTED'}</Text>
          {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Top-right avatar button */}
      <TouchableOpacity style={s.avatarBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={s.avatarText}>{(user?.name || 'G').charAt(0).toUpperCase()}</Text>
      </TouchableOpacity>

      {/* Dropdown menu */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={s.menu}>
            {/* Identity header */}
            <View style={s.menuProfile}>
              <View style={s.menuAvatar}>
                <Text style={s.menuAvatarText}>{(user?.name || 'G').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuName} numberOfLines={1}>{user?.name || 'Golfer'}</Text>
                <Text style={s.menuEmail} numberOfLines={1}>{user?.email || ''}</Text>
              </View>
              {hcp != null && (
                <View style={s.hcpBadge}>
                  <Text style={s.hcpBadgeText}>{hcp}</Text>
                  <Text style={s.hcpBadgeLabel}>HCP</Text>
                </View>
              )}
            </View>
            <View style={s.divider} />

            {MENU_ITEMS.map(item => (
              <TouchableOpacity key={item.key} style={s.menuRow} onPress={() => go(item.key)} activeOpacity={0.6}>
                <Text style={s.menuIcon}>{item.icon}</Text>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}

            <View style={s.divider} />
            <TouchableOpacity style={s.menuRow} onPress={handleSignOut} activeOpacity={0.6}>
              <Text style={s.menuIcon}>↩︎</Text>
              <Text style={[s.menuLabel, { color: COLORS.red500 }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 58, paddingBottom: 12, paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.surfaceBorder,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { ...FONTS.heavy, fontSize: 19, color: COLORS.ink, letterSpacing: 1.5 },
  subtitle: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 1 },

  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.green700, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.green500 + '55',
  },
  avatarText: { ...FONTS.bold, fontSize: 16, color: COLORS.white },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  menu: {
    position: 'absolute', top: 104, right: SPACING.xl, width: 290,
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  menuProfile: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.green700,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuAvatarText: { ...FONTS.bold, fontSize: 17, color: COLORS.white },
  menuName: { ...FONTS.semibold, fontSize: 15, color: COLORS.ink },
  menuEmail: { ...FONTS.regular, fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  hcpBadge: {
    backgroundColor: COLORS.green900, borderRadius: RADIUS.md,
    paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', marginLeft: 8,
  },
  hcpBadgeText: { ...FONTS.heavy, fontSize: 14, color: COLORS.green400 },
  hcpBadgeLabel: { ...FONTS.bold, fontSize: 8, color: COLORS.green600, letterSpacing: 1 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.surfaceBorder, marginVertical: 4 },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  menuIcon: { fontSize: 16, width: 28, textAlign: 'center', marginRight: 10 },
  menuLabel: { ...FONTS.regular, fontSize: 15, color: COLORS.ink, flex: 1 },
  chevron: { ...FONTS.regular, fontSize: 20, color: COLORS.gray600 },
});
