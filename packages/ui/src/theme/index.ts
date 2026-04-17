// ─── Zhim Design System ─────────────────────────────────────────────────────
// Brand: Warm saffron-orange primary, deep forest green secondary,
// cream/off-white background. Rooted in Bhutanese monastery colour vocabulary.

export const colors = {
  // Primary — Saffron (Kira textile, butter lamp)
  primary: {
    50:  '#FFF8E7',
    100: '#FFEFC0',
    200: '#FFE094',
    300: '#FFD060',
    400: '#FFC02E',
    500: '#F5A800',  // Main brand orange-saffron
    600: '#D08C00',
    700: '#A66E00',
    800: '#7A5100',
    900: '#4D3300',
  },

  // Secondary — Forest green (pine forests, GNH land)
  secondary: {
    50:  '#EAF4EE',
    100: '#C6E4CF',
    200: '#9FD1B0',
    300: '#71BC8D',
    400: '#4BAB72',
    500: '#2A9A58',  // Main brand green
    600: '#228A4C',
    700: '#18753E',
    800: '#0F5E30',
    900: '#074820',
  },

  // Neutral — Warm grey (yak wool, stone)
  neutral: {
    50:  '#FAF9F7',
    100: '#F2EFE9',
    200: '#E4DDD4',
    300: '#D1C8BC',
    400: '#B8ADA0',
    500: '#9E9285',
    600: '#7E766B',
    700: '#5F5950',
    800: '#3E3A34',
    900: '#201D19',
  },

  // Semantic
  success: '#2A9A58',
  error:   '#D93030',
  warning: '#F5A800',
  info:    '#1A73E8',

  // Food tags
  veg:     '#2E7D32',
  nonVeg:  '#C62828',
  buddhist:'#7B1FA2',

  // Backgrounds
  bg:        '#FAF9F7',
  bgCard:    '#FFFFFF',
  bgMuted:   '#F2EFE9',

  // Text
  text:      '#201D19',
  textMuted: '#7E766B',
  textLight: '#B8ADA0',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const typography = {
  // Display — Jomolhari for Dzongkha, Inter for English
  fontFamily: {
    sans:       'Inter',
    sansBold:   'Inter-Bold',
    dzongkha:   'Jomolhari',
    dzongkhaBold: 'Jomolhari',  // Jomolhari has limited weights; use size for emphasis
    mono:       'SpaceMono',
  },

  fontSize: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 28,
    '3xl': 32,
    '4xl': 40,
  },

  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    relaxed: 1.75,
    // Dzongkha Uchen script needs generous line height
    dzongkha: 2.0,
  },

  fontWeight: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
};

export const spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
};

export const radii = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const theme = { colors, typography, spacing, radii, shadows };
export type Theme = typeof theme;
