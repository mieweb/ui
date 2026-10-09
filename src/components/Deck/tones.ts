import type { AccentName, SlideTone } from './types';

export interface ToneSpec {
  isLight: boolean;
  /** Slide ground. */
  surface: string;
  text: string;
  muted: string;
  hairline: string;
  card: string;
}

const dark = {
  isLight: false,
  text: 'text-white',
  muted: 'text-white/70',
  hairline: 'border-white/10',
  card: 'bg-white/5',
} as const;

export const TONES: Record<SlideTone, ToneSpec> = {
  brand: {
    ...dark,
    surface:
      'bg-gradient-to-br from-primary-900 via-primary-950 to-primary-950',
  },
  deep: {
    ...dark,
    surface: 'bg-gradient-to-b from-neutral-900 to-neutral-950',
  },
  ink: { ...dark, surface: 'bg-neutral-950' },
  glow: {
    ...dark,
    surface: 'bg-gradient-to-br from-primary-950 via-primary-800 to-accent/70',
  },
  light: {
    isLight: true,
    surface: 'bg-white',
    text: 'text-neutral-900',
    muted: 'text-neutral-600',
    hairline: 'border-neutral-200',
    card: 'bg-neutral-50',
  },
};

export interface AccentSpec {
  text: string;
  soft: string;
  border: string;
  /** Solid fill for bars and dots. */
  fill: string;
  /** SVG fill / stroke utilities. */
  svgFill: string;
  svgStroke: string;
}

const onDark: Record<AccentName, AccentSpec> = {
  primary: {
    text: 'text-primary-300',
    soft: 'bg-primary-400/15',
    border: 'border-primary-400/30',
    fill: 'bg-primary-400',
    svgFill: 'fill-primary-400',
    svgStroke: 'stroke-primary-400',
  },
  secondary: {
    text: 'text-secondary-300',
    soft: 'bg-secondary-400/15',
    border: 'border-secondary-400/30',
    fill: 'bg-secondary-400',
    svgFill: 'fill-secondary-400',
    svgStroke: 'stroke-secondary-400',
  },
  accent: {
    text: 'text-accent',
    soft: 'bg-accent/15',
    border: 'border-accent/30',
    fill: 'bg-accent',
    svgFill: 'fill-accent',
    svgStroke: 'stroke-accent',
  },
  success: {
    text: 'text-success',
    soft: 'bg-success/15',
    border: 'border-success/30',
    fill: 'bg-success',
    svgFill: 'fill-success',
    svgStroke: 'stroke-success',
  },
  warning: {
    text: 'text-warning',
    soft: 'bg-warning/15',
    border: 'border-warning/30',
    fill: 'bg-warning',
    svgFill: 'fill-warning',
    svgStroke: 'stroke-warning',
  },
  danger: {
    text: 'text-destructive',
    soft: 'bg-destructive/15',
    border: 'border-destructive/30',
    fill: 'bg-destructive',
    svgFill: 'fill-destructive',
    svgStroke: 'stroke-destructive',
  },
};

// Light grounds need darker text shades for contrast; fills stay the same.
const lightText: Record<AccentName, string> = {
  primary: 'text-primary-800',
  secondary: 'text-secondary-800',
  accent: 'text-neutral-900',
  success: 'text-neutral-900',
  warning: 'text-neutral-900',
  danger: 'text-destructive',
};

export function accent(
  name: AccentName = 'accent',
  isLight = false
): AccentSpec {
  const spec = onDark[name];
  return isLight ? { ...spec, text: lightText[name] } : spec;
}

/** A slide's resolved tone \u2014 for renderers, which sit outside the `SlideFrame` that provides it to children. */
export const toneOf = (slide: { tone?: SlideTone }, fallback: SlideTone) =>
  TONES[slide.tone ?? fallback];

/** Cycled when a series of items has no accents of its own. */
export const ACCENT_CYCLE: AccentName[] = [
  'accent',
  'primary',
  'secondary',
  'success',
  'warning',
];
