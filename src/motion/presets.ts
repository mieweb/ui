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
  | 'sidebarLabel'
  | 'menu'
  | 'collapse'
  | 'toast'
  | 'fade'
  | 'pop';

/**
 * A physical edge, already resolved from any logical (`start`/`end`) position
 * and from writing direction.
 *
 * Presets that move an element along an axis take one of these as `custom`.
 * Resolution is the component's job, not the preset's: only the component knows
 * whether its `end` means right or left, and — for anything anchored — which
 * side it actually landed on after flipping away from a viewport edge.
 */
export type MotionEdge = 'top' | 'bottom' | 'left' | 'right';

/** Offset along the axis implied by `edge`, in px. */
function offsetFromEdge(
  edge: unknown,
  distance: number
): { x: number; y: number } {
  switch (edge) {
    case 'top':
      return { x: 0, y: -distance };
    case 'bottom':
      return { x: 0, y: distance };
    case 'left':
      return { x: -distance, y: 0 };
    default:
      return { x: distance, y: 0 };
  }
}

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
 * - `menu`, `toast` — a {@link MotionEdge}, already resolved from logical
 *   position and writing direction by the component.
 * - `overlay`, `modalContent`, `sidebarLabel`, `collapse`, `fade`, `pop` —
 *   unused.
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

  /**
   * Anchored popup surface — dropdown, select, autocomplete, command palette.
   *
   * `custom` is the side of the anchor the menu actually occupies, so the
   * closed state nudges back *toward* the trigger and the menu reads as coming
   * out of the control that opened it. Pass the post-flip side, not the
   * requested placement: a menu asked for `bottom` that flipped to `top` for
   * want of room must animate from the top, or it moves the wrong way.
   *
   * `transform-origin` is deliberately left to CSS (`origin-top` and friends).
   * It is static per side and never animates, so making it a variant would put
   * a second owner on a property motion has no reason to touch.
   *
   * Snappier than `modalContent`: a menu is a transient response to a click and
   * should feel instant, where a dialog is a context switch and can afford to
   * settle.
   */
  menu: {
    variants: {
      open: { opacity: 1, scale: 1, x: 0, y: 0 },
      closed: (edge: unknown) => ({
        opacity: 0,
        scale: 0.95,
        ...offsetFromEdge(edge, -4),
      }),
    },
    transition: { type: 'spring', stiffness: 600, damping: 40, mass: 0.6 },
  },

  /**
   * Disclosure content that expands and collapses — `Collapsible`, `Accordion`.
   *
   * The one preset that earns its keep on capability rather than polish:
   * `height: auto` is not interpolable in CSS, so the alternative is a
   * hard-coded max-height that either clips tall content or eases against dead
   * space on short content. Motion measures the real height instead.
   *
   * Animating `height` costs layout on every frame, unlike the transform and
   * opacity work everywhere else in this file. That is the price of the
   * capability; keep the duration short and don't reach for this preset when a
   * transform would do.
   *
   * Consumers must clip the element (`overflow-hidden`) or content spills past
   * the shrinking box mid-animation.
   *
   * Note that `MotionConfig reducedMotion="user"` does **not** cover this:
   * it drops transform and layout animations, and `height` is a plain value
   * animation to motion. Components using this preset are responsible for
   * honoring the preference themselves — see `usePrefersReducedMotion`.
   */
  collapse: {
    variants: {
      open: { height: 'auto', opacity: 1 },
      closed: { height: 0, opacity: 0 },
    },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  /**
   * Transient notification entering and leaving a stack.
   *
   * `custom` is the physical edge the toast lives against, so it enters from
   * the screen edge nearest it rather than always from the right — which is
   * what the `animate-slide-in-right` fallback does regardless of position.
   *
   * Scale is near-imperceptible on purpose: it softens the arrival without
   * making a message that may carry an error read as playful.
   */
  toast: {
    variants: {
      open: { opacity: 1, scale: 1, x: 0, y: 0 },
      closed: (edge: unknown) => ({
        opacity: 0,
        scale: 0.98,
        ...offsetFromEdge(edge, 24),
      }),
    },
    transition: { type: 'spring', stiffness: 400, damping: 36, mass: 0.8 },
  },

  /**
   * Generic presence fade, for surfaces with no meaningful direction —
   * drag overlays, connectivity banners, skeleton-to-content swaps.
   *
   * Survives `reducedMotion="user"` intact, since opacity is the one thing that
   * setting keeps. Prefer it over a transform preset wherever the movement is
   * decorative rather than explanatory.
   */
  fade: {
    variants: {
      open: { opacity: 1 },
      closed: { opacity: 0 },
    },
    transition: { duration: 0.15, ease: 'easeOut' },
  },

  /**
   * Small element arriving with emphasis — a count badge, a status pill.
   *
   * Overshoots past full size and settles back (`1 → 1.1 → 1`) so the arrival
   * is legible on an element too small for movement to register. Reserve it
   * for things that appear in response to an event worth noticing; on anything
   * large it reads as a bounce.
   *
   * The overshoot is a keyframe rather than a spring because the resting open
   * state has to be `scale: 1`. Expressing the emphasis as a spring target
   * would leave a mounted consumer parked at 1.1 — permanently 10% oversized —
   * since the open variant is also the at-rest state.
   */
  pop: {
    variants: {
      open: { opacity: 1, scale: [1, 1.1, 1] },
      closed: { opacity: 0, scale: 1 },
    },
    // `times` front-loads the overshoot so it reads as a pop rather than an
    // even swell. Keyframe arrays need a duration-based tween; a spring has no
    // way to run through intermediate values.
    //
    // `times` is scoped to `scale` on purpose. At the top level it also
    // applies to `opacity`, whose two-value tween then gets three time stops:
    // it overshoots to 1 early, falls back toward 0, and snaps to 1 at the end,
    // so the badge flickers instead of fading in.
    transition: {
      duration: 0.15,
      ease: 'easeOut',
      scale: { duration: 0.28, ease: 'easeOut', times: [0, 0.45, 1] },
    },
  },
};
