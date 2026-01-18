'use strict';

// src/brands/enterprise-health.ts
var enterpriseHealthBrand = {
  name: "enterprise-health",
  displayName: "Enterprise Health",
  description: "Employee health and occupational medicine platform",
  colors: {
    // Primary color scale - Enterprise Health Burgundy/Purple (#6E2B68)
    // Derived from rgb(110, 43, 104) found on their website
    primary: {
      50: "#fdf5fc",
      100: "#faeaf8",
      200: "#f5d4f0",
      300: "#edb3e4",
      400: "#e086d2",
      500: "#c95ab8",
      600: "#6e2b68",
      // Main brand color
      700: "#5e2559",
      800: "#4e1f4a",
      900: "#42193d",
      950: "#280e25"
    },
    // Light mode semantic colors
    // Based on actual Enterprise Health website styles
    light: {
      background: "#ffffff",
      foreground: "#222326",
      // rgb(34, 35, 38) - their main text color
      card: "#ffffff",
      cardForeground: "#222326",
      muted: "#f8f9fb",
      // rgb(248, 249, 251) - their section backgrounds
      mutedForeground: "#6a6d77",
      // rgb(106, 109, 119) - their secondary text
      border: "#e3e6ec",
      // rgb(227, 230, 236) - their border color
      input: "#e3e6ec",
      ring: "#6e2b68",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      success: "#22c55e",
      successForeground: "#ffffff",
      warning: "#f8b700",
      // Gold/yellow accent from logo
      warningForeground: "#222326"
    },
    // Dark mode semantic colors
    dark: {
      background: "#1a1a1d",
      foreground: "#fafafa",
      card: "#27272a",
      cardForeground: "#fafafa",
      muted: "#3f3f46",
      mutedForeground: "#a1a1aa",
      border: "#3f3f46",
      input: "#3f3f46",
      ring: "#c95ab8",
      // Lighter primary for dark mode
      destructive: "#dc2626",
      destructiveForeground: "#fafafa",
      success: "#16a34a",
      successForeground: "#fafafa",
      warning: "#f8b700",
      warningForeground: "#222326"
    }
  },
  typography: {
    fontFamily: {
      // Jost is the font used on enterprisehealth.com
      sans: ["Jost", "ui-sans-serif", "system-ui", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
    }
  },
  // Enterprise Health uses larger, more rounded corners
  borderRadius: {
    none: "0",
    sm: "0.375rem",
    // 6px - used for small badges
    md: "0.625rem",
    // 10px - used for buttons
    lg: "0.75rem",
    // 12px - used for inputs
    xl: "1rem",
    // 16px
    "2xl": "1.5rem",
    // 24px - used for cards
    full: "9999px"
  },
  // Enterprise Health card shadows are subtle and layered
  boxShadow: {
    card: "0 16px 32px 0 rgba(34, 35, 38, 0.05), 0 8px 16px 0 rgba(34, 35, 38, 0.05)",
    dropdown: "0 8px 16px 0 rgba(34, 35, 38, 0.08)",
    modal: "0 24px 48px 0 rgba(34, 35, 38, 0.12), 0 12px 24px 0 rgba(34, 35, 38, 0.08)"
  }
};

exports.enterpriseHealthBrand = enterpriseHealthBrand;
//# sourceMappingURL=chunk-P52GA3GJ.cjs.map
//# sourceMappingURL=chunk-P52GA3GJ.cjs.map