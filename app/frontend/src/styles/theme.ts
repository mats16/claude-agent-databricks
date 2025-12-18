/**
 * Theme constants for consistent styling across the application
 * Based on brand guidelines and existing patterns
 */

// Brand colors
export const colors = {
  // Primary brand color (Orange/Gold)
  brand: '#f5a623',
  brandLight: 'rgba(245, 166, 35, 0.1)',
  brandDark: '#d4890c',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F7F7F7',
  sidebarBg: '#F7F7F7',

  // Borders
  border: '#f0f0f0',
  borderDark: '#e5e5e5',

  // Text colors
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  textDisabled: '#cccccc',

  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',

  // UI specific
  link: '#1677ff',
  danger: '#ff4d4f',
} as const;

// Spacing scale (in pixels)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border radius scale
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.08)',
  xl: '0 10px 15px rgba(0, 0, 0, 0.1)',
} as const;

// Typography
export const typography = {
  fontFamily: '"Noto Sans JP", sans-serif',
  fontSizeSmall: 12,
  fontSizeBase: 14,
  fontSizeLarge: 16,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
} as const;

// Z-index layers
export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modal: 1000,
  overlay: 1100,
  tooltip: 1200,
} as const;

// Layout constants
export const layout = {
  maxContentWidth: 768,
  sidebarWidth: 280,
  headerHeight: 56,
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
