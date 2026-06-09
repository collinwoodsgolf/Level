/**
 * ATTESTED — Payment / Subscription Screen
 * Stripe-powered checkout for Pro subscriptions
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';

const PLANS = [
  {
    id: 'annual',
    label: 'Annual',
    price: '$59',
    period: '/year',
    savings: 'Save 26%',
    monthly: '$4.92/mo',
    stripePriceId: 'price_attested_annual', // TODO: real Stripe price ID
    popular: true,
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$6.99',
    period: '/month',
    savings: null,
    monthly: '$6.99/mo',
    stripePriceId: 'price_attested_monthly',
    popular: false,
  },
];

const FEATURES = [
  { icon: '📡', text: 'Real-time dynamic course ratings' },
  { icon: '🌦️', text: 'Live weather integration & forecasts' },
  { icon: '⛳', text: 'All courses nationwide (1,000+ at launch)' },
  { icon: '📊', text: 'Per-hole difficulty breakdowns' },
  { icon: '🏌️', text: 'GPS-verified handicap adjustments' },
  { icon: '🔔', text: 'Course condition alerts & notifications' },
  { icon: '📈', text: 'Historical rating trends & analytics' },
];

export default function PaymentScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const setPremium = useStore(s => s.setPremium);

  const handleSubscribe = async () => {
    setLoading(true);
    const plan = PLANS.find(p => p.id === selectedPlan);

    // TODO: Replace with real Stripe integration
    // In production:
    // 1. Call backend to create Stripe checkout session
    // 2. Present Stripe payment sheet via @stripe/stripe-react-native
    // 3. Confirm payment and update user subscription status
    // 4. Backend webhook verifies payment and grants access

    setTimeout(() => {
      setLoading(false);
      setPremium(true);
      Alert.alert(
        'Welcome to Pro!',
        `Your ${plan.label} subscription is now active. Enjoy full access to ATTESTED.`,
        [{ text: 'Let\'s Go', onPress: () => navigation.goBack() }]
      );
    }, 2000);
  };

  const activePlan = PLANS.find(p => p.id === selectedPlan);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Go Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>ATTESTED</Text>
          <Text style={s.heroSub}>Dynamic Course Intelligence</Text>
          <Text style={s.heroDesc}>
            Unlock the full power of real-time course ratings, GPS-verified conditions, and per-hole difficulty analysis.
          </Text>
        </View>

        {/* Plan selection */}
        <View style={s.plansRow}>
          {PLANS.map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={[
                s.planCard,
                selectedPlan === plan.id && s.planCardActive,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.7}
            >
              {plan.popular && (
                <View style={s.popularBadge}>
                  <Text style={s.popularText}>BEST VALUE</Text>
                </View>
              )}
              <Text style={[s.planLabel, selectedPlan === plan.id && s.planLabelActive]}>
                {plan.label}
              </Text>
              <View style={s.planPriceRow}>
                <Text style={[s.planPrice, selectedPlan === plan.id && s.planPriceActive]}>
                  {plan.price}
                </Text>
                <Text style={s.planPeriod}>{plan.period}</Text>
              </View>
              <Text style={s.planMonthly}>{plan.monthly}</Text>
              {plan.savings && (
                <View style={s.savingsBadge}>
                  <Text style={s.savingsText}>{plan.savings}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Features */}
        <View style={s.featuresSection}>
          <Text style={s.featuresTitle}>Everything in Pro</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Trust badges */}
        <View style={s.trustRow}>
          <View style={s.trustItem}>
            <Text style={s.trustIcon}>🔒</Text>
            <Text style={s.trustText}>Secure{'\n'}Payment</Text>
          </View>
          <View style={s.trustItem}>
            <Text style={s.trustIcon}>↩️</Text>
            <Text style={s.trustText}>7-Day{'\n'}Free Trial</Text>
          </View>
          <View style={s.trustItem}>
            <Text style={s.trustIcon}>🚫</Text>
            <Text style={s.trustText}>Cancel{'\n'}Anytime</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.ctaBtn, loading && s.ctaBtnDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.ctaText}>
              Start Free Trial — {activePlan?.price}{activePlan?.period}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={s.ctaNote}>
          7-day free trial, then {activePlan?.price}{activePlan?.period}. Cancel anytime.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.surfaceElevated, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeText: { ...FONTS.regular, fontSize: 20, color: COLORS.gray400 },
  headerTitle: { ...FONTS.bold, fontSize: 20, color: COLORS.white },

  scroll: { flex: 1 },

  hero: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: SPACING.xxl },
  heroTitle: { ...FONTS.black, fontSize: 36, color: COLORS.green500, letterSpacing: 4 },
  heroSub: { ...FONTS.medium, fontSize: 14, color: COLORS.gray400, marginTop: 4, letterSpacing: 0.5 },
  heroDesc: { ...FONTS.regular, fontSize: 15, color: COLORS.gray300, textAlign: 'center', marginTop: 16, lineHeight: 22 },

  plansRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: 12,
  },
  planCard: {
    flex: 1, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.surfaceBorder, padding: SPACING.xl,
    alignItems: 'center',
  },
  planCardActive: { borderColor: COLORS.green500 },
  popularBadge: {
    position: 'absolute', top: -10,
    backgroundColor: COLORS.green700, paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  popularText: { ...FONTS.bold, fontSize: 10, color: COLORS.white, letterSpacing: 1 },
  planLabel: { ...FONTS.semibold, fontSize: 14, color: COLORS.gray400, marginTop: 8 },
  planLabelActive: { color: COLORS.white },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  planPrice: { ...FONTS.bold, fontSize: 28, color: COLORS.gray300 },
  planPriceActive: { color: COLORS.white },
  planPeriod: { ...FONTS.regular, fontSize: 14, color: COLORS.gray500, marginLeft: 2 },
  planMonthly: { ...FONTS.regular, fontSize: 12, color: COLORS.gray500, marginTop: 4 },
  savingsBadge: {
    backgroundColor: COLORS.green900, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full, marginTop: 8,
  },
  savingsText: { ...FONTS.bold, fontSize: 11, color: COLORS.green400 },

  featuresSection: { marginTop: 32, paddingHorizontal: SPACING.xxl },
  featuresTitle: { ...FONTS.bold, fontSize: 18, color: COLORS.white, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureIcon: { fontSize: 18, marginRight: 14, width: 24, textAlign: 'center' },
  featureText: { ...FONTS.regular, fontSize: 15, color: COLORS.gray300, flex: 1 },

  trustRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 32, paddingHorizontal: SPACING.xl,
  },
  trustItem: { alignItems: 'center' },
  trustIcon: { fontSize: 24, marginBottom: 6 },
  trustText: { ...FONTS.medium, fontSize: 12, color: COLORS.gray400, textAlign: 'center', lineHeight: 16 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surfaceElevated, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 36,
  },
  ctaBtn: {
    backgroundColor: COLORS.green700, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center',
  },
  ctaBtnDisabled: { opacity: 0.7 },
  ctaText: { ...FONTS.bold, fontSize: 16, color: COLORS.white },
  ctaNote: { ...FONTS.regular, fontSize: 12, color: COLORS.gray500, textAlign: 'center', marginTop: 10 },
});
