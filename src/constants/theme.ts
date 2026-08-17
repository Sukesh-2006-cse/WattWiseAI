/**
 * WattWise AI - Design Tokens & Dark Mode Theme Palette
 */

export const COLORS = {
  // Backgrounds
  background: '#0B0F14',
  cardBackground: '#151B22',
  cardHeader: '#1C242F',
  cardBorder: '#232D3B',
  inputBackground: '#111720',

  // Brand & Accents
  primary: '#22C55E',      // Emerald Green - Main primary accent
  primaryGlow: 'rgba(34, 197, 94, 0.15)',
  secondary: '#3B82F6',    // Electric Blue
  secondaryGlow: 'rgba(59, 130, 246, 0.15)',
  accent: '#A855F7',       // Purple accent

  // Status & Power Threshold Colors
  success: '#22C55E',      // Green - Normal/Online
  warning: '#F59E0B',      // Amber - High Load
  danger: '#EF4444',       // Red - Critical Load / Offline
  info: '#06B6D4',         // Cyan - Info/Simulated Voltage

  // Text Colors
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',

  // Badges & Pills
  badgeGreenBg: 'rgba(34, 197, 94, 0.15)',
  badgeGreenText: '#4ADE80',
  badgeYellowBg: 'rgba(245, 158, 11, 0.15)',
  badgeYellowText: '#FBBF24',
  badgeRedBg: 'rgba(239, 68, 68, 0.15)',
  badgeRedText: '#F87171',
  badgeBlueBg: 'rgba(59, 130, 246, 0.15)',
  badgeBlueText: '#60A5FA',
  badgeMutedBg: 'rgba(148, 163, 184, 0.12)',
  badgeMutedText: '#94A3B8',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};
