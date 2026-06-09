/**
 * ATTESTED Design System — iOS App Theme
 * Light, creme-and-white, hunter green brand, Tiger-Sunday red accents.
 */

export const COLORS = {
  // Hunter green brand scale (dark → light tints)
  green900: '#DCEBDF',   // lightest tint — badge backgrounds
  green800: '#CFE3D4',   // tint — avatar/chip backgrounds
  green700: '#355E3B',   // HUNTER GREEN — primary buttons & brand
  green600: '#2C5134',   // deep hunter — pressed/borders
  green500: '#3C6B47',   // accent text & links
  green400: '#27502F',   // strong accent text on tints
  green100: '#EAF2EB',
  green50:  '#F4F8F4',

  // Ink (text on light surfaces)
  ink: '#1F2A22',

  // Neutrals — warm, tuned for light surfaces
  // (gray300–700 are TEXT tones: 300 = body, 700 = faintest)
  white: '#ffffff',
  gray50:  '#FCFAF5',
  gray100: '#F4F1E8',
  gray200: '#E9E4D6',
  gray300: '#3D4A40',
  gray400: '#5E6B61',
  gray500: '#7C8780',
  gray600: '#A3ADA5',
  gray700: '#D8DED6',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',

  // Semantic
  red500: '#DA291C',   // Tiger Woods Sunday red
  red600: '#B91C1C',
  orange500: '#D9580C',
  amber500: '#C77F06',
  blue500: '#2563eb',
  blue600: '#1d4ed8',

  // Light creme surfaces
  surface: '#FAF7F0',         // app background — light creme
  surfaceElevated: '#FFFFFF', // headers, sheets, tab bar
  surfaceCard: '#FFFFFF',     // cards
  surfaceBorder: '#E6E0D2',   // warm hairlines

  // Tee box colors
  teeBlack: '#1f2937',
  teeGold: '#b8860b',
  teeBlue: '#2563eb',
  teeWhite: '#8A949F',
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

// Difficulty color coding (text/accents on light surfaces)
export function getDifficultyColor(delta) {
  if (delta >= 3) return COLORS.red600;
  if (delta >= 1) return COLORS.orange500;
  if (delta >= 0) return COLORS.gray500;
  return COLORS.green500;
}

// Difficulty tint backgrounds (light)
export function getDifficultyBg(delta) {
  if (delta >= 3) return '#FBE4E2';
  if (delta >= 1) return '#FBEEDD';
  if (delta >= 0) return '#F1EFE7';
  return '#E3EEE5';
}
