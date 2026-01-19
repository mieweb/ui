'use strict';

// src/brands/waggleline.ts
var wagglelineBrand = {
  name: "waggleline",
  displayName: "Waggleline",
  description: "Experience visualization and orchestration platform for customer journeys",
  colors: {
    // Primary color scale - Waggleline Blue (#17AEED)
    primary: {
      50: "#E6F7FF",
      100: "#BAE7FF",
      200: "#91D5FF",
      300: "#69C0FF",
      400: "#40A9FF",
      500: "#17AEED",
      600: "#00A4EB",
      700: "#0084C8",
      800: "#006AA5",
      900: "#004D7A",
      950: "#003355"
    },
    // Light mode semantic colors
    light: {
      background: "#fafafa",
      // gray-50 equivalent
      foreground: "#1a1a1a",
      card: "#ffffff",
      cardForeground: "#1a1a1a",
      muted: "#f5f5f5",
      mutedForeground: "#6b7280",
      border: "#e5e7eb",
      input: "#e5e7eb",
      ring: "#17AEED",
      destructive: "#ef4444",
      destructiveForeground: "#ffffff",
      success: "#009C4E",
      // Brand green
      successForeground: "#ffffff",
      warning: "#FFD200",
      // Brand yellow
      warningForeground: "#1a1a1a"
    },
    // Dark mode semantic colors (charcoal-based, not pure black)
    dark: {
      background: "#1F2937",
      // panel.DEFAULT - charcoal
      foreground: "#f9fafb",
      card: "#2D3748",
      // panel.card
      cardForeground: "#f9fafb",
      muted: "#374151",
      // panel.elevated
      mutedForeground: "#9ca3af",
      border: "#374151",
      input: "#374151",
      ring: "#17AEED",
      destructive: "#dc2626",
      destructiveForeground: "#f9fafb",
      success: "#009C4E",
      // Brand green
      successForeground: "#f9fafb",
      warning: "#FFD200",
      // Brand yellow
      warningForeground: "#1a1a1a"
    }
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
    }
  },
  borderRadius: {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px"
  },
  boxShadow: {
    card: "0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
    // soft
    dropdown: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    modal: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)"
    // soft-lg
  }
};

exports.wagglelineBrand = wagglelineBrand;
//# sourceMappingURL=chunk-SWV5E75F.cjs.map
//# sourceMappingURL=chunk-SWV5E75F.cjs.map