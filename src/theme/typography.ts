import { TextStyle } from 'react-native';

export const typography = {
  sizes: {
    '2xs': 11,
    xs: 13,
    sm: 15,
    base: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 40,
  },
  lineHeights: {
    '2xs': 14,
    xs: 18,
    sm: 22,
    base: 26,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
  },
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
} as const;

export type Typography = typeof typography;
