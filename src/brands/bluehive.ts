/**
 * BlueHive Brand Configuration
 *
 * The official brand theme for BlueHive Health.
 * Primary color: #27aae1 (BlueHive Blue)
 */

import type { BrandConfig } from './types';

/**
 * BlueHive brand configuration.
 * This defines all the design tokens used in BlueHive Health applications.
 */
export const bluehiveBrand: BrandConfig = {
  name: 'bluehive',
  displayName: 'BlueHive Health',
  description: 'DOT Physical scheduling and healthcare compliance platform',

  colors: {
    // Primary color scale - BlueHive Blue (#27aae1)
    primary: {
      50: '#e6f7fc',
      100: '#b3e6f6',
      200: '#80d5f0',
      300: '#4dc4ea',
      400: '#27aae1',
      500: '#27aae1',
      600: '#1f98ca',
      700: '#1786b3',
      800: '#0f749c',
      900: '#086285',
      950: '#00506e',
    },

    // Light mode semantic colors
    light: {
      background: '#ffffff',
      foreground: '#171717',
      card: '#ffffff',
      cardForeground: '#171717',
      muted: '#f5f5f5',
      mutedForeground: '#737373',
      border: '#e5e7eb',
      input: '#e5e7eb',
      ring: '#27aae1',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      success: '#22c55e',
      successForeground: '#ffffff',
      warning: '#f59e0b',
      warningForeground: '#ffffff',
    },

    // Dark mode semantic colors
    dark: {
      background: '#171717',
      foreground: '#fafafa',
      card: '#262626',
      cardForeground: '#fafafa',
      muted: '#404040',
      mutedForeground: '#a1a1aa',
      border: '#404040',
      input: '#404040',
      ring: '#27aae1',
      destructive: '#dc2626',
      destructiveForeground: '#fafafa',
      success: '#16a34a',
      successForeground: '#fafafa',
      warning: '#d97706',
      warningForeground: '#fafafa',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  boxShadow: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    dropdown:
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    modal: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
};

/**
 * BlueHive Tailwind preset.
 * Use this in your tailwind.config.js:
 *
 * ```js
 * import { bluehivePreset } from '@mieweb/ui/brands/bluehive';
 *
 * export default {
 *   presets: [bluehivePreset],
 *   // ... rest of config
 * }
 * ```
 */
export { bluehiveBrand as default };
