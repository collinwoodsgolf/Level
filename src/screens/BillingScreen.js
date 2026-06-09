/**
 * ATTESTED — Billing
 * Subscription status, payment method, invoice history.
 */
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import SubHeader from '../components/SubHeader';

const MOCK_INVOICES = [
  { id: 'in_003', date: 'May 9, 2026', amount: '$6.99', status: 'Paid' },
  { id: 'in_002', date: 'Apr 9, 2026', amount: '$6.99', status: 'Paid' },
  { id: 'in_001', date: 'Mar 9, 2026', amount: '$6.99', status: 'Paid' },
];

export default function BillingScreen({ navigation }) {
  const isPremium = useStore(s => s.isPremium);

  return (
    <View style={s.container}>
      <SubHeader navigation={navigation} title="Billing" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Plan */}
        <Text style={s.sectionLabel}>CURRENT PLAN</Text>
        <View style={s.card}>
          <View style={s.planRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.planName}>{isPremium ? 'ATTESTED Pro' : 'Free Plan'}</Text>
              <Text style={s.planDesc}>
                {isPremium
                  ? 'All courses · live ratings · dynamic handicap'
                  : '1 course · basic ratings'}
              </Text>
            </View>
            <View style={[s.badge, isPremium && s.badgeActive]}>
              <Text style={[s.badgeText, isPremium && s.badgeTextActive]}>
                {isPremium ? 'ACTIVE' : 'FREE'}
              </Text>
            </View>
          </View>
          {!isPremium ? (
            <TouchableOpacity style={s.upgradeBtn} onPress={() => navigation.navigate('Payment')} activeOpacity={0.85}>
              <Text style={s.upgradeText}>Upgrade to Pro — from $4.92/mo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.manageBtn}
              onPress={() => Alert.alert('Manage Subscription', 'Subscriptions are managed through your App Store account settings.')}
              activeOpacity={0.85}
            >
              <Text style={s.manageText}>Manage Subscription</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment method */}
        <Text style={s.sectionLabel}>PAYMENT METHOD</Text>
        <View style={s.card}>
          {isPremium ? (
            <TouchableOpacity
              style={s.pmRow}
              onPress={() => Alert.alert('Payment Method', 'Card management will use the Stripe payment sheet in production.')}
            >
              <Text style={s.pmIcon}>💳</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.pmText}>Visa •••• 4242</Text>
                <Text style={s.pmSub}>Expires 08/28</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.pmRow}>
              <Text style={s.pmIcon}>💳</Text>
              <Text style={[s.pmText, { color: COLORS.gray500 }]}>No payment method on file</Text>
            </View>
          )}
        </View>

        {/* Invoices */}
        <Text style={s.sectionLabel}>BILLING HISTORY</Text>
        <View style={s.card}>
          {isPremium ? (
            MOCK_INVOICES.map((inv, i) => (
              <View key={inv.id}>
                {i > 0 && <View style={s.divider} />}
                <View style={s.invRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.invDate}>{inv.date}</Text>
                    <Text style={s.invId}>{inv.id}</Text>
                  </View>
                  <Text style={s.invAmount}>{inv.amount}</Text>
                  <View style={s.paidBadge}><Text style={s.paidText}>{inv.status}</Text></View>
                </View>
              </View>
            ))
          ) : (
            <View style={s.invRow}>
              <Text style={[s.pmText, { color: COLORS.gray500 }]}>No invoices yet</Text>
            </View>
          )}
        </View>

        <Text style={s.note}>
          Payments are processed securely via Stripe. Subscriptions renew automatically and can be cancelled anytime.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.xl, paddingBottom: 48 },
  sectionLabel: { ...FONTS.semibold, fontSize: 12, color: COLORS.gray500, letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
  card: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: 22, overflow: 'hidden',
  },

  planRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl },
  planName: { ...FONTS.bold, fontSize: 18, color: COLORS.ink },
  planDesc: { ...FONTS.regular, fontSize: 13, color: COLORS.gray400, marginTop: 4, lineHeight: 18 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.gray700 },
  badgeActive: { backgroundColor: COLORS.green900 },
  badgeText: { ...FONTS.bold, fontSize: 11, color: COLORS.gray400, letterSpacing: 1 },
  badgeTextActive: { color: COLORS.green400 },

  upgradeBtn: {
    backgroundColor: COLORS.green700, marginHorizontal: SPACING.xl, marginBottom: SPACING.xl,
    borderRadius: RADIUS.md, padding: 14, alignItems: 'center',
  },
  upgradeText: { ...FONTS.bold, fontSize: 15, color: COLORS.white },
  manageBtn: {
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xl,
    borderRadius: RADIUS.md, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  manageText: { ...FONTS.semibold, fontSize: 15, color: COLORS.gray300 },

  pmRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  pmIcon: { fontSize: 20, marginRight: 12 },
  pmText: { ...FONTS.semibold, fontSize: 15, color: COLORS.ink },
  pmSub: { ...FONTS.regular, fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  chevron: { ...FONTS.regular, fontSize: 20, color: COLORS.gray600 },

  invRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  invDate: { ...FONTS.semibold, fontSize: 14, color: COLORS.ink },
  invId: { ...FONTS.regular, fontSize: 11, color: COLORS.gray600, marginTop: 2 },
  invAmount: { ...FONTS.bold, fontSize: 14, color: COLORS.gray300, marginRight: 10 },
  paidBadge: { backgroundColor: COLORS.green900, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  paidText: { ...FONTS.bold, fontSize: 10, color: COLORS.green400 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.surfaceBorder, marginLeft: SPACING.lg },

  note: { ...FONTS.regular, fontSize: 12, color: COLORS.gray600, textAlign: 'center', lineHeight: 17, marginTop: 4 },
});
