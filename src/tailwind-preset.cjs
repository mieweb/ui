/**
 * @mieweb/ui Tailwind CSS Preset (CommonJS)
 *
 * This file is used during build time by tailwind.config.js
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  // Safelist classes used by @mieweb/ui components that may not be detected
  // when components are imported from node_modules (especially with Tailwind CSS 4)
  safelist: [
    // CaseManagementHeader — logical spacing, details grid, responsive
    // built-in actions (icon-only below md):
    '-ms-2',
    'gap-x-10',
    'hidden',
    'max-w-[60%]',
    'md:hidden',
    'md:inline-flex',
    // Semantic colors
    'border-border',
    'border-input',
    'ring-ring',
    'bg-background',
    'bg-card',
    'bg-muted',
    'bg-destructive',
    'text-foreground',
    'text-card-foreground',
    'text-muted-foreground',
    'text-destructive',
    'text-destructive-foreground',
    'focus:ring-ring',
    'focus:border-transparent',
    'focus:ring-destructive',
    'border-destructive',
    // Grid classes for QuickAction and responsive layouts
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-6',
    'sm:grid-cols-1',
    'sm:grid-cols-2',
    'sm:grid-cols-3',
    'sm:grid-cols-4',
    'sm:grid-cols-6',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'md:grid-cols-4',
    'lg:grid-cols-2',
    'lg:grid-cols-3',
    'lg:grid-cols-4',
    // Switch component
    'bg-neutral-200',
    'dark:bg-neutral-700',
    'bg-primary-500',
    // BusinessHoursEditor rules-variant day chips
    'border-primary-800',
    'bg-primary-800',
    'text-white',
    'h-5',
    'w-9',
    'h-6',
    'w-11',
    'h-7',
    'w-14',
    'h-4',
    'w-4',
    'w-5',
    'w-6',
    'translate-x-0.5',
    'translate-x-4',
    'translate-x-5',
    'translate-x-7',
    // RTL primitives batch: Badge/Input/Label icon+required markers, Text
    // logical alignment, Switch thumb travel (LTR data-state pairs + rtl mirror)
    'me-1',
    'ms-0.5',
    'ms-1',
    'text-start',
    'text-end',
    'data-[state=checked]:translate-x-4',
    'data-[state=checked]:translate-x-5',
    'data-[state=checked]:translate-x-7',
    'rtl:-translate-x-0.5',
    'rtl:data-[state=checked]:-translate-x-4',
    'rtl:data-[state=checked]:-translate-x-5',
    'rtl:data-[state=checked]:-translate-x-7',
    // RTL layout+nav batch: AppHeader alignment, Card accent/badge positions,
    // Sheet sides, Sidebar off-canvas + paddings, Table cell alignment
    'me-auto',
    'ms-auto',
    '-end-1',
    'start-0',
    'end-0',
    'ps-4',
    'start-2',
    'end-2',
    'border-e',
    'border-s',
    'me-3',
    'ms-2',
    'ps-2',
    '-me-2',
    '-end-3',
    'start-3',
    'pe-4',
    'ps-10',
    'rtl:translate-x-full',
    'translate-x-0',
    '-translate-x-full',
    '[&:has([role=checkbox])]:pe-0',
    // MediaEditor media-surface height cap: the small-screen `dvh` cap, and the
    // md variants that hand desktop back its original percentage cap. Purging
    // these uncaps the player on a phone, which is the bug the cap exists for.
    'max-h-[55dvh]',
    'md:max-h-[50%]',
    'md:max-h-none',
    // SchedulePicker / overflow handling
    'overflow-x-auto',
    'overflow-hidden',
    // Scrollable floating panels (DateInput calendar, Autocomplete, Select, Table, ScrollArea, …)
    'overflow-auto',
    // Select component
    'truncate',
    // SourceTip hover card — trigger affordance, gradient header, ring, scroll cap
    'cursor-help',
    'w-80',
    'decoration-dashed',
    'decoration-primary-400/70',
    'underline-offset-4',
    'bg-gradient-to-br',
    'from-primary-700',
    'to-primary-600',
    'ring-black/5',
    'dark:ring-white/10',
    'ring-1',
    'overflow-y-auto',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'max-h-52',
    'text-primary-100/90',
    'text-[10px]',
    'text-[11px]',
    'text-[13px]',
    'px-3.5',
    'py-2.5',
    'mt-2.5',
    'pt-2.5',
    'mt-0.5',
    'mt-1.5',
    'h-1.5',
    'w-1.5',
    'border-dashed',
    'shadow-xl',
    // CustomizableDashboard — responsive column grid, flattened columns,
    // drag handle, drop placeholder
    'grid-cols-1',
    'md:grid-cols-2',
    'lg:grid-cols-3',
    'max-lg:contents',
    'max-md:hidden',
    'min-h-16',
    'min-h-32',
    'cursor-grab',
    'active:cursor-grabbing',
    'touch-none',
    'opacity-40',
    'group-hover/portlet:opacity-100',
    'focus-visible:opacity-100',
    '[@media(hover:none)]:opacity-100',
    'group/portlet',
    '[&>:nth-child(2)]:ms-auto',
    'flex-nowrap',
    'bg-card/80',
    'border-dashed',
    'border-2',
    'bg-primary-500/10',
    'gap-0.5',
    'p-0.5',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--mieweb-primary-50, #f0f9ff)',
          100: 'var(--mieweb-primary-100, #e0f4fe)',
          200: 'var(--mieweb-primary-200, #b9eafd)',
          300: 'var(--mieweb-primary-300, #7cdbfc)',
          400: 'var(--mieweb-primary-400, #36c9f8)',
          500: 'var(--mieweb-primary-500, #27aae1)',
          600: 'var(--mieweb-primary-600, #0c90c9)',
          700: 'var(--mieweb-primary-700, #0b73a3)',
          800: 'var(--mieweb-primary-800, #0f6086)',
          900: 'var(--mieweb-primary-900, #124f6f)',
          950: 'var(--mieweb-primary-950, #0c334a)',
        },
        // Ozwell brand accent (the "Hey Ozwell" octopus blue) — a sub-brand color distinct from the host
        // app's primary. Themeable via --mieweb-ozwell; falls back to the octopus blue.
        ozwell: {
          DEFAULT: 'var(--mieweb-ozwell, #0BA0E0)',
          foreground: 'var(--mieweb-ozwell-foreground, hsl(0 0% 100%))',
        },
        border: 'var(--mieweb-border, hsl(214.3 31.8% 91.4%))',
        input: 'var(--mieweb-input, hsl(214.3 31.8% 91.4%))',
        ring: 'var(--mieweb-ring, hsl(221.2 83.2% 53.3%))',
        background: 'var(--mieweb-background, hsl(0 0% 100%))',
        foreground: 'var(--mieweb-foreground, hsl(222.2 84% 4.9%))',
        card: {
          DEFAULT: 'var(--mieweb-card, hsl(0 0% 100%))',
          foreground: 'var(--mieweb-card-foreground, hsl(222.2 84% 4.9%))',
        },
        muted: {
          DEFAULT: 'var(--mieweb-muted, hsl(210 40% 96.1%))',
          foreground: 'var(--mieweb-muted-foreground, hsl(215.4 16.3% 46.9%))',
        },
        destructive: {
          DEFAULT:
            'var(--mieweb-destructive, var(--mieweb-destructive-500, hsl(0 72.2% 50.6%)))',
          foreground: 'var(--mieweb-destructive-foreground, hsl(210 40% 98%))',
        },
        success: {
          DEFAULT: 'var(--mieweb-success, hsl(142.1 76.2% 36.3%))',
          foreground: 'var(--mieweb-success-foreground, hsl(355.7 100% 97.3%))',
        },
        warning: {
          DEFAULT: 'var(--mieweb-warning, hsl(45.4 93.4% 47.5%))',
          foreground: 'var(--mieweb-warning-foreground, hsl(26 83.3% 14.1%))',
        },
      },
      fontFamily: {
        sans: [
          'var(--mieweb-font-sans, ui-sans-serif)',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: 'var(--mieweb-radius-lg, 0.75rem)',
        md: 'var(--mieweb-radius-md, 0.5rem)',
        sm: 'var(--mieweb-radius-sm, 0.25rem)',
        xl: 'var(--mieweb-radius-xl, 1rem)',
      },
      boxShadow: {
        card: 'var(--mieweb-shadow-card, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1))',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-0.5rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(0.5rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'ozwell-message-flare': {
          '0%': {
            boxShadow:
              '0 0 0 0 color-mix(in srgb, var(--mieweb-primary-700, #0b73a3) 34%, transparent)',
          },
          '70%': {
            boxShadow:
              '0 0 0 8px color-mix(in srgb, var(--mieweb-primary-700, #0b73a3) 0%, transparent)',
          },
          '100%': {
            boxShadow:
              '0 0 0 0 color-mix(in srgb, var(--mieweb-primary-700, #0b73a3) 0%, transparent)',
          },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'fade-out': 'fade-out 150ms ease-in',
        'slide-in-from-top': 'slide-in-from-top 150ms ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 150ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
        'ozwell-message-flare': 'ozwell-message-flare 1.8s ease-out',
      },
    },
  },
};
