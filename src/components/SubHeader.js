/**
 * LEVEL GOLF — SubHeader
 * iOS-style page header with back chevron, used by pushed pages.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../utils/theme';

export default function SubHeader({ navigation, title, right }) {
  return (
    <View style={s.header}>
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={s.backText}>‹</Text>
      </TouchableOpacity>
      <Text style={s.title}>{title}</Text>
      <View style={s.right}>{right || null}</View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 58, paddingBottom: 12, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.surfaceBorder,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backText: { ...FONTS.regular, fontSize: 30, color: COLORS.green500, marginTop: -6 },
  title: { ...FONTS.bold, fontSize: 17, color: COLORS.ink, flex: 1, textAlign: 'center' },
  right: { width: 36, alignItems: 'flex-end' },
});
