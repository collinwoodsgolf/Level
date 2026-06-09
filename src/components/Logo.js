/**
 * ATTESTED — Placeholder Logo
 * Pure React Native views (no SVG dependency): rounded badge,
 * flagstick + pennant over a putting green arc.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

export default function Logo({ size = 72, wordmark = false, tagline = false }) {
  const s = size;
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.badge,
          {
            width: s,
            height: s,
            borderRadius: s * 0.28,
          },
        ]}
      >
        {/* Green (putting surface) */}
        <View
          style={[
            styles.green,
            {
              width: s * 0.62,
              height: s * 0.2,
              borderRadius: s * 0.31,
              bottom: s * 0.16,
            },
          ]}
        />
        {/* Hole */}
        <View
          style={[
            styles.hole,
            {
              width: s * 0.12,
              height: s * 0.055,
              borderRadius: s * 0.06,
              bottom: s * 0.225,
            },
          ]}
        />
        {/* Flagstick */}
        <View
          style={[
            styles.stick,
            {
              width: Math.max(2, s * 0.035),
              height: s * 0.46,
              bottom: s * 0.25,
            },
          ]}
        />
        {/* Pennant (CSS-triangle) */}
        <View
          style={[
            styles.flag,
            {
              borderTopWidth: s * 0.11,
              borderBottomWidth: s * 0.11,
              borderLeftWidth: s * 0.3,
              top: s * 0.17,
              left: s * 0.5,
            },
          ]}
        />
        {/* Verified tick — the "attested" mark */}
        <View
          style={[
            styles.tickDot,
            {
              width: s * 0.26,
              height: s * 0.26,
              borderRadius: s * 0.13,
              top: s * 0.1,
              left: s * 0.12,
            },
          ]}
        >
          <Text style={{ color: COLORS.green800, fontSize: s * 0.15, fontWeight: '900' }}>✓</Text>
        </View>
      </View>

      {wordmark && (
        <Text style={[styles.wordmark, { fontSize: size * 0.42, marginTop: size * 0.22 }]}>
          ATTESTED
        </Text>
      )}
      {tagline && (
        <Text style={styles.tagline}>Dynamic Course Intelligence</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  badge: {
    backgroundColor: COLORS.green800,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  green: {
    position: 'absolute',
    backgroundColor: COLORS.green500,
    opacity: 0.9,
  },
  hole: {
    position: 'absolute',
    backgroundColor: '#0b3018',
  },
  stick: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  flag: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fbbf24',
    transform: [{ scaleY: 0.62 }],
  },
  tickDot: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.95,
  },
  wordmark: {
    ...FONTS.black,
    color: COLORS.white,
    letterSpacing: 4,
  },
  tagline: {
    ...FONTS.medium,
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
