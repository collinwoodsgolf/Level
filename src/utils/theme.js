/**
 * ATTESTED Design System — iOS App Theme
 * Dark-mode-first, golf-inspired, premium feel
 */

export const COLORS = {
  // Primary greens (brand)
  green900: '#14532d',
  green800: '#166534',
  green700: '#15803d',
  green600: '#16a34a',
  green500: '#22c55e',
  green400: '#4ade80',
  green100: '#dcfce7',
  green50:  '#f0fdf4',

  // Neutrals
  white: '#ffffff',
  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',

  // Semantic
  red500: '#ef4444',
  red600: '#dc2626',
  orange500: '#f97316',
  amber500: '#f59e0b',
  blue500: '#3b82f6',
  blue600: '#2563eb',

  // Dark mode surfaces
  surface: '#0f1117',
  surfaceElevated: '#1a1d27',
  surfaceCard: '#222636',
  surfaceBorder: '#2e3347',

  // Tee box colors
  teeBlack: '#1f2937',
  teeGold: '#b8860b',
  teeBlue: '#2563eb',
  teeWhite: '#9ca3af',
};

export const FONTS = {
  // System fonts for iOS native feel
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semibold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  heavy: { fontFamily: 'System', fontWeight: '800' },
  black: { fontFamily: 'System', fontWeight: '900' },
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const RADIUS = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 999,
};

// Difficulty color coding
export function getDifficultyColor(delta) {
  if (delta >= 3) return COLORS.red600;
  if (delta >= 1) return COLORS.orange500;
  if (delta >= 0) return COLORS.gray500;
  return COLORS.green500;
}

export function getDifficultyBg(delta) {
  if (delta >= 3) return '#2d1215';
  if (delta >= 1) return '#2d1f0e';
  if (delta >= 0) return '#1a1d27';
  return '#0d2818';
}
