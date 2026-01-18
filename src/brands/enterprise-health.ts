/**
 * Enterprise Health Brand Configuration
 *
 * The official brand theme for Enterprise Health.
 * Primary color: #7b2d8e (Enterprise Health Purple)
 * Accent color: #f5a623 (Enterprise Health Gold)
 */

import type { BrandConfig } from './types';

/**
 * Enterprise Health brand configuration.
 * This defines all the design tokens used in Enterprise Health applications.
 */
export const enterpriseHealthBrand: BrandConfig = {
  name: 'enterprise-health',
  displayName: 'Enterprise Health',
  description: 'Employee health and occupational medicine platform',

  colors: {
    // Primary color scale - Enterprise Health Purple (#7b2d8e)
    primary: {
      50: '#faf5fc',
      100: '#f4eaf8',
      200: '#ead5f1',
      300: '#dab3e6',
      400: '#c487d5',
      500: '#a85cc0',
      600: '#7b2d8e',
      700: '#6c2880',
      800: '#5a236b',
      900: '#4b1f59',
      950: '#2f0a3b',
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
      ring: '#7b2d8e',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      success: '#22c55e',
      successForeground: '#ffffff',
      warning: '#f5a623',
      warningForeground: '#171717',
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
      ring: '#a85cc0',
      destructive: '#dc2626',
      destructiveForeground: '#fafafa',
      success: '#16a34a',
      successForeground: '#fafafa',
      warning: '#f5a623',
      warningForeground: '#171717',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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

export { enterpriseHealthBrand as default };
