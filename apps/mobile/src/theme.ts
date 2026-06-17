export const COLORS = {
  dark: {
    background: '#0B1020', // deep ink
    card: '#151B2E',
    cardLight: '#1E253F',
    border: '#242F4F',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    primary: '#6D5DFB', // violet-indigo
    primaryHover: '#8577ff',
    secondary: '#21D4C4', // teal/cyan
    success: '#1FB87A', // emerald (naik)
    danger: '#F0566E', // ruby (turun)
    warning: '#FFB020', // amber
    accent: '#8b5cf6',
    glassBg: 'rgba(21, 27, 46, 0.7)',
  },
  light: {
    background: '#F7F8FC',
    card: '#ffffff',
    cardLight: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    primary: '#6D5DFB', // violet-indigo
    primaryHover: '#584cd4',
    secondary: '#1ea195', // teal/cyan
    success: '#1FB87A', // emerald (naik)
    danger: '#F0566E', // ruby (turun)
    warning: '#FFB020', // amber
    accent: '#7c3aed',
    glassBg: 'rgba(255, 255, 255, 0.7)',
  }
};

export type ThemeType = 'dark' | 'light';

export const getThemeColors = (theme: ThemeType) => COLORS[theme];
