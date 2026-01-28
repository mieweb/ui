'use strict';

// src/tailwind-preset.ts
var miewebUISafelist = [
  // Semantic colors
  "border-border",
  "border-input",
  "ring-ring",
  "bg-background",
  "bg-card",
  "bg-muted",
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-info",
  "text-foreground",
  "text-card-foreground",
  "text-muted-foreground",
  "text-primary",
  "text-primary-foreground",
  "text-success",
  "text-success-foreground",
  "text-warning",
  "text-warning-foreground",
  "text-destructive",
  "text-destructive-foreground",
  "text-info",
  "text-info-foreground",
  "focus:ring-ring",
  "focus:ring-primary",
  "focus:border-transparent",
  "focus:ring-destructive",
  "border-primary",
  "border-destructive",
  "ring-primary",
  "ring-2",
  "ring-offset-2",
  // Grid classes for QuickAction and responsive layouts
  "grid-cols-1",
  "grid-cols-2",
  "grid-cols-3",
  "grid-cols-4",
  "grid-cols-6",
  "sm:grid-cols-1",
  "sm:grid-cols-2",
  "sm:grid-cols-3",
  "sm:grid-cols-4",
  "sm:grid-cols-6",
  "md:grid-cols-2",
  "md:grid-cols-3",
  "md:grid-cols-4",
  "lg:grid-cols-2",
  "lg:grid-cols-3",
  "lg:grid-cols-4",
  // Switch component
  "bg-neutral-200",
  "dark:bg-neutral-700",
  "bg-primary-500",
  "h-5",
  "w-9",
  "h-6",
  "w-11",
  "h-7",
  "w-14",
  "h-4",
  "w-4",
  "w-5",
  "w-6",
  "translate-x-0.5",
  "translate-x-4",
  "translate-x-5",
  "translate-x-7",
  // SchedulePicker / overflow handling
  "overflow-x-auto",
  "overflow-hidden",
  // Select component
  "truncate"
];
var miewebUIPreset = {
  darkMode: ["class", '[data-theme="dark"]'],
  safelist: miewebUISafelist,
  theme: {
    extend: {
      colors: {
        // Primary color scale - easily overridable by consumers
        primary: {
          DEFAULT: "var(--mieweb-primary, var(--mieweb-primary-500, #27aae1))",
          50: "var(--mieweb-primary-50, #f0f9ff)",
          100: "var(--mieweb-primary-100, #e0f4fe)",
          200: "var(--mieweb-primary-200, #b9eafd)",
          300: "var(--mieweb-primary-300, #7cdbfc)",
          400: "var(--mieweb-primary-400, #36c9f8)",
          500: "var(--mieweb-primary-500, #27aae1)",
          600: "var(--mieweb-primary-600, #0c90c9)",
          700: "var(--mieweb-primary-700, #0b73a3)",
          800: "var(--mieweb-primary-800, #0f6086)",
          900: "var(--mieweb-primary-900, #124f6f)",
          950: "var(--mieweb-primary-950, #0c334a)",
          foreground: "var(--mieweb-primary-foreground, hsl(210 40% 98%))"
        },
        // Semantic colors using CSS variables for theming
        border: "var(--mieweb-border, hsl(214.3 31.8% 91.4%))",
        input: "var(--mieweb-input, hsl(214.3 31.8% 91.4%))",
        ring: "var(--mieweb-ring, hsl(221.2 83.2% 53.3%))",
        background: "var(--mieweb-background, hsl(0 0% 100%))",
        foreground: "var(--mieweb-foreground, hsl(222.2 84% 4.9%))",
        // Component-specific semantic colors
        card: {
          DEFAULT: "var(--mieweb-card, hsl(0 0% 100%))",
          foreground: "var(--mieweb-card-foreground, hsl(222.2 84% 4.9%))"
        },
        muted: {
          DEFAULT: "var(--mieweb-muted, hsl(210 40% 96.1%))",
          foreground: "var(--mieweb-muted-foreground, hsl(215.4 16.3% 46.9%))"
        },
        destructive: {
          DEFAULT: "var(--mieweb-destructive, hsl(0 84.2% 60.2%))",
          foreground: "var(--mieweb-destructive-foreground, hsl(210 40% 98%))"
        },
        success: {
          DEFAULT: "var(--mieweb-success, hsl(142.1 76.2% 36.3%))",
          foreground: "var(--mieweb-success-foreground, hsl(355.7 100% 97.3%))"
        },
        warning: {
          DEFAULT: "var(--mieweb-warning, hsl(45.4 93.4% 47.5%))",
          foreground: "var(--mieweb-warning-foreground, hsl(26 83.3% 14.1%))"
        },
        info: {
          DEFAULT: "var(--mieweb-info, hsl(204 94% 94%))",
          foreground: "var(--mieweb-info-foreground, hsl(213 31% 91%))"
        }
      },
      fontFamily: {
        sans: [
          "var(--mieweb-font-sans, ui-sans-serif)",
          "system-ui",
          "sans-serif"
        ]
      },
      borderRadius: {
        "2xl": "var(--mieweb-radius-2xl, 1rem)",
        lg: "var(--mieweb-radius-lg, 0.75rem)",
        md: "var(--mieweb-radius-md, 0.5rem)",
        sm: "var(--mieweb-radius-sm, 0.25rem)",
        xl: "var(--mieweb-radius-xl, 1rem)"
      },
      boxShadow: {
        card: "var(--mieweb-shadow-card, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1))"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-0.5rem)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(0.5rem)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "fade-out": "fade-out 150ms ease-in",
        "slide-in-from-top": "slide-in-from-top 150ms ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 150ms ease-out",
        "slide-in-right": "slide-in-right 300ms ease-out",
        "slide-in-left": "slide-in-left 300ms ease-out",
        "scale-in": "scale-in 150ms ease-out"
      }
    }
  }
};
var tailwind_preset_default = miewebUIPreset;

exports.miewebUIPreset = miewebUIPreset;
exports.miewebUISafelist = miewebUISafelist;
exports.tailwind_preset_default = tailwind_preset_default;
//# sourceMappingURL=chunk-SJ3BF4BO.cjs.map
//# sourceMappingURL=chunk-SJ3BF4BO.cjs.map