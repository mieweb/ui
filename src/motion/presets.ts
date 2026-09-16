/**
 * Motion presets — the shared vocabulary of animations.
 *
 * This module is intentionally **free of any `motion` import**. It ships in the
 * main `@mieweb/ui` entry so components can describe *what* they animate
 * without pulling in a runtime to actually do it. The `@mieweb/ui/motion` entry
 * is what turns these descriptions into real animations.
 *
 * Every preset is expressed as an open/closed variant pair so the same
 * definition serves both usages:
 *
 * - **toggle** — the element stays mounted and animates between `open` and
 *   `closed` (a drawer sliding in and out).
 * - **presence** — the element mounts and unmounts, entering on `open` and
 *   exiting back to `closed` (a modal).
 */

// =============================================================================
// Types
// =============================================================================

/** Named animation recipes shared by components. */
export type MotionPreset =
  | 'drawerStart'
  | 'overlay'
  | 'modalContent'
  | 'sidebarLabel';

/**
 * A variant value. Either a plain target object or a function of the element's
 * `custom` value — the latter lets a single preset adapt to context, e.g. a
 * drawer flipping its off-canvas direction in RTL.
 */
export type MotionVariant =
  | Record<string, unknown>
  | ((custom: unknown) => Record<string, unknown>);

export interface MotionPresetDefinition {
  variants: {
    open: MotionVariant;
    closed: MotionVariant;
  };
  transition: Record<string, unknown>;
}

// =============================================================================
// Presets
// =============================================================================

/**
 * `custom` contract per preset:
 *
 * - `drawerStart` — `boolean`, whether the document direction is RTL.
 * - `overlay`, `modalContent`, `sidebarLabel` — unused.
 */
export const motionPresets: Record<MotionPreset, MotionPresetDefinition> = {
  /**
   * Off-canvas panel pinned to the inline-start edge. Animates `x` only, which
   * the compositor can handle without layout or paint.
   */
  drawerStart: {
    variants: {
      open: { x: '0%' },
      // Off-canvas direction follows writing direction, mirroring the
      // `-translate-x-full rtl:translate-x-full` CSS fallback.
      closed: (isRtl: unknown) => ({ x: isRtl ? '100%' : '-100%' }),
    },
    transition: { type: 'spring', stiffness: 400, damping: 40, mass: 1 },
  },

  /** Scrim behind a drawer or modal. */
  overlay: {
    variants: {
      open: { opacity: 1 },
      closed: { opacity: 0 },
    },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  /** Centered dialog surface — rises and settles rather than popping. */
  modalContent: {
    variants: {
      open: { opacity: 1, scale: 1, y: 0 },
      closed: { opacity: 0, scale: 0.96, y: 8 },
    },
    transition: { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 },
  },

  /**
   * Text that disappears as its container narrows — sidebar labels on collapse.
   *
   * Opacity only, and deliberately so. An inline-axis slide would read slightly
   * better but would make every label direction-aware, and resolving direction
   * per nav item is a disproportionate amount of plumbing for an 8px nudge.
   * Fading also degrades to itself under reduced motion instead of becoming a
   * different animation.
   *
   * Short because it runs on many elements at once and has to finish inside the
   * container's own width transition, or labels are still fading after the rail
   * has stopped moving.
   */
  sidebarLabel: {
    variants: {
      open: { opacity: 1 },
      closed: { opacity: 0 },
    },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
};
