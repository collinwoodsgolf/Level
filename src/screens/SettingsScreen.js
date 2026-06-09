/**
 * ATTESTED — Settings
 * App preferences, units, notifications, about.
 */
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import SubHeader from '../components/SubHeader';

function Row({ icon, label, value, onPress, toggle, toggleValue, last }) {
  return (
    <TouchableOpacity
      style={[s.row, !last && s.rowBorder]}
      onPress={onPress}
      activeOpacity={toggle ? 1 : 0.6}
      disabled={!!toggle}
    >
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.label}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onPress}
          trackColor={{ false: COLORS.gray700, true: COLORS.green700 }}
          thumbColor={COLORS.white}
        />
      ) : (
        <View style={s.right}>
          {!!value && <Text style={s.value}>{value}</Text>}
          <Text style={s.chevron}>›</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const prefs = useStore(st => st.prefs);
  const setPref = useStore(st => st.setPref);

  return (
    <View style={s.container}>
      <SubHeader navigation={navigation} title="Settings" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>GENERAL</Text>
        <View style={s.card}>
          <Row
            icon="🔔" label="Notifications" toggle
            toggleValue={prefs.notifications}
            onPress={() => setPref('notifications', !prefs.notifications)}
          />
          <Row
            icon="📍" label="GPS Round Verification" toggle
            toggleValue={prefs.gpsTracking}
            onPress={() => setPref('gpsTracking', !prefs.gpsTracking)}
            last
          />
        </View>

        <Text style={s.sectionLabel}>UNITS</Text>
        <View style={s.card}>
          <Row
            icon="📏" label="Distance"
            value={prefs.distanceUnit === 'yards' ? 'Yards' : 'Meters'}
            onPress={() => setPref('distanceUnit', prefs.distanceUnit === 'yards' ? 'meters' : 'yards')}
          />
          <Row
            icon="🌡️" label="Temperature"
            value={prefs.tempUnit === 'F' ? '°F' : '°C'}
            onPress={() => setPref('tempUnit', prefs.tempUnit === 'F' ? 'C' : 'F')}
            last
          />
        </View>

        <Text style={s.sectionLabel}>ABOUT</Text>
        <View style={s.card}>
          <Row
            icon="📖" label="How Dynamic Ratings Work"
            onPress={() => Alert.alert(
              'Dynamic Rating',
              "ATTESTED combines GPS-verified course conditions, live weather, and USGA-calibrated math to compute how hard the course is playing right now — so an 85 on a brutal day counts for what it's worth.",
            )}
          />
          <Row
            icon="🔒" label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy policy page coming soon.')}
          />
          <Row
            icon="📄" label="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms of service page coming soon.')}
          />
          <Row
            icon="💬" label="Contact Support"
            onPress={() => Alert.alert('Support', 'support@attested.golf')}
            last
          />
        </View>

        <Text style={s.version}>ATTESTED v1.0.0 (Build 1)</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: SPACING.lg },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.surfaceBorder },
  icon: { fontSize: 17, marginRight: 12, width: 24, textAlign: 'center' },
  label: { ...FONTS.regular, fontSize: 15, color: COLORS.white, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
  value: { ...FONTS.regular, fontSize: 14, color: COLORS.gray400, marginRight: 8 },
  chevron: { ...FONTS.regular, fontSize: 20, color: COLORS.gray600 },
  version: { ...FONTS.regular, fontSize: 12, color: COLORS.gray600, textAlign: 'center', marginTop: 8 },
});
