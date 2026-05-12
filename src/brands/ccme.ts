/**
 * ccMe Brand Configuration
 *
 * The official brand theme for ccMe — patient-owned health record platform.
 * Primary color: #9ed0c4 (Sage Green)
 * Font: Nunito
 */

import type { BrandConfig } from './types';

/**
 * ccMe brand configuration.
 * Sage-green primary palette with Nunito display font.
 */
export const ccmeBrand: BrandConfig = {
  name: 'ccme',
  displayName: 'ccMe',
  description: 'Patient-owned health record platform',

  colors: {
    // Primary color scale — Sage Green (#9ed0c4)
    primary: {
      50: '#eef8f6',
      100: '#d4ede9',
      200: '#b9e2dc',
      300: '#aed9d1',
      400: '#9ed0c4',
      500: '#9ed0c4',
      600: '#7ab8ac',
      700: '#5a9e91',
      800: '#357068',
      900: '#2b6b60',
      950: '#1a524a',
    },

    // Neutral scale — sage-tinted grays so dark:bg-neutral-* utilities and
    // surfaces feel cohesive with the sage primary instead of cool slate.
    neutral: {
      50: '#f5faf8',
      100: '#e8f0ed',
      200: '#cfdcd7',
      300: '#a9bcb5',
      400: '#7a918a',
      500: '#5b736d',
      600: '#445853',
      700: '#2f3f3b',
      800: '#1f2c29',
      900: '#142220',
      950: '#0a1614',
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
      ring: '#9ed0c4',
      destructive: '#dc2626',
      destructiveForeground: '#ffffff',
      success: '#16a34a',
      successForeground: '#ffffff',
      warning: '#d97706',
      warningForeground: '#451a03',
    },

    // Dark mode semantic colors — sage-tinted dark neutrals so the page
    // chrome feels warm and on-brand instead of cool Tailwind slate.
    dark: {
      background: '#0a1614',
      foreground: '#f0f7f5',
      card: '#132521',
      cardForeground: '#f0f7f5',
      muted: '#1a2e2a',
      mutedForeground: '#94aaa3',
      border: '#284037',
      input: '#132521',
      ring: '#9ed0c4',
      destructive: '#dc2626',
      destructiveForeground: '#fafafa',
      success: '#16a34a',
      successForeground: '#fafafa',
      warning: '#d97706',
      warningForeground: '#451a03',
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

export { ccmeBrand as default };
