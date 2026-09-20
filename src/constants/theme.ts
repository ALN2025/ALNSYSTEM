export const Colors = {
  background: '#0A0A12',
  surface: '#14141F',
  surfaceLight: '#1E1E2E',
  surfaceGlass: 'rgba(30, 30, 46, 0.85)',
  border: '#2A2A3E',
  borderLight: '#3A3A52',

  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#00CEC9',
  accent: '#FD79A8',
  warning: '#FDCB6E',
  danger: '#FF6B6B',
  success: '#00B894',

  text: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',

  gradients: {
    primary: ['#6C5CE7', '#A29BFE'] as const,
    secondary: ['#00CEC9', '#55EFC4'] as const,
    accent: ['#FD79A8', '#E84393'] as const,
    sunset: ['#FF6B6B', '#FDCB6E'] as const,
    ocean: ['#0984E3', '#00CEC9'] as const,
    dark: ['#0A0A12', '#14141F'] as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 40,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  }),
};
