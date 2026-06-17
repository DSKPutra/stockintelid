export const COLORS = {
  dark: {
    background: '#0b0f19',
    card: '#151f32',
    cardLight: '#1f2d48',
    border: '#243452',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    primary: '#3b82f6', // blue
    primaryHover: '#60a5fa',
    success: '#10b981', // green
    danger: '#ef4444', // red
    warning: '#f59e0b', // amber
    accent: '#8b5cf6', // purple
    glassBg: 'rgba(21, 31, 50, 0.7)',
  },
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    cardLight: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    primary: '#2563eb', // blue
    primaryHover: '#3b82f6',
    success: '#059669', // green
    danger: '#dc2626', // red
    warning: '#d97706', // amber
    accent: '#7c3aed', // purple
    glassBg: 'rgba(255, 255, 255, 0.7)',
  }
};

export type ThemeType = 'dark' | 'light';

export const getThemeColors = (theme: ThemeType) => COLORS[theme];
