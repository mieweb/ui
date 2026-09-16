/**
 * Motion runtime — the seam between components and an optional animation library.
 *
 * Components in the main entry never import `motion`. They ask this module for
 * a runtime; if an app has opted in by rendering `<MotionProvider>` from
 * `@mieweb/ui/motion`, they get one and animate. If not, `useMotionRuntime()`
 * returns `null` and they fall back to their existing CSS transitions. That is
 * what keeps `motion` out of the bundle of every app that hasn't asked for it —
 * the opt-in is resolved in the *module graph*, not by a prop.
 *
 * Like `presets`, this module must stay free of any `motion` import.
 */

import * as React from 'react';
import { motionPresets, type MotionPreset } from './presets';

// =============================================================================
// Types
// =============================================================================

export interface MotionPresenceProps {
  children?: React.ReactNode;
  /** Suppress the initial mount animation. */
  initial?: boolean;
  /**
   * Fires once every exiting child has finished and been removed.
   *
   * Needed by anything that guards the DOM while it is open — a focus trap, a
   * scroll lock — because those guards must outlive `open` for as long as the
   * subtree is still on screen. Never fires when no runtime is active, since
   * there is no exit to wait for.
   */
  onExitComplete?: () => void;
}

/**
 * The capabilities a motion library must supply. Deliberately small: element
 * factories, a presence wrapper, and prop builders. Components depend on this
 * interface, never on a concrete library, so swapping or dropping the library
 * stays a one-file change.
 */
export interface MotionRuntime {
  /**
   * Whether animations should actually run.
   *
   * A disabled provider still supplies a runtime rather than `null` so that
   * consumers can tell "disabled" apart from "never opted in": `Modal` uses it
   * to decide whether an exit animation will ever report completion, and
   * `AnimatedPresence` keeps its wrapper element stable across the flip.
   * `Animated` itself renders the plain fallback tag whenever this is false —
   * withholding animation props from a mounted motion component corrupts
   * `toggle`-mode elements, so the swap (and the remount it implies) is the
   * correct behaviour. See the render branches in `Animated`.
   */
  enabled: boolean;
  /** Animated `div`. */
  Div: React.ElementType;
  /** Animated `nav`. */
  Nav: React.ElementType;
  /** Animated `span`, for inline content that must not become a block. */
  Span: React.ElementType;
  /** Enables exit animations for conditionally rendered children. */
  Presence: React.ComponentType<MotionPresenceProps>;
  /**
   * Props for an element that stays mounted and animates between states.
   * Skips the initial animation so a closed drawer doesn't slide out on load.
   */
  toggle: (
    preset: MotionPreset,
    open: boolean,
    custom?: unknown
  ) => Record<string, unknown>;
  /** Props for an element that mounts and unmounts inside `Presence`. */
  presence: (preset: MotionPreset, custom?: unknown) => Record<string, unknown>;
}

// =============================================================================
// Context
// =============================================================================

/**
 * The context is stashed on `globalThis` under a registered symbol rather than
 * held in a module-local `const`.
 *
 * `@mieweb/ui` and `@mieweb/ui/motion` are separate bundle entries, and CJS
 * builds cannot code-split. Without this, the provider and the components
 * would each get their own copy of the context object and the provider would
 * silently never be seen — animations would simply never turn on, with no
 * error to explain why. A duplicated install of the package causes the same
 * failure. Keying off the global symbol registry makes the context a true
 * singleton in every one of those cases.
 *
 * The key is versioned. Two copies of this package sharing one page share
 * whatever lives under the key, so the `v1` suffix is a compatibility
 * contract: bump it if the `MotionRuntime` interface ever changes shape,
 * or an old provider will hand a new component a runtime it cannot use.
 */
const CONTEXT_KEY = Symbol.for('@mieweb/ui.motionRuntimeContext.v1');

type GlobalWithMotionContext = typeof globalThis & {
  [CONTEXT_KEY]?: React.Context<MotionRuntime | null>;
};

function getMotionRuntimeContext(): React.Context<MotionRuntime | null> {
  const globalScope = globalThis as GlobalWithMotionContext;
  if (!globalScope[CONTEXT_KEY]) {
    globalScope[CONTEXT_KEY] = React.createContext<MotionRuntime | null>(null);
  }
  return globalScope[CONTEXT_KEY];
}

/** @internal Consumed by `<MotionProvider>` in the `@mieweb/ui/motion` entry. */
export const MotionRuntimeContext = getMotionRuntimeContext();

// =============================================================================
// Hooks
// =============================================================================

/**
 * The active motion runtime, or `null` when the app has not opted in.
 *
 * Components must treat `null` as the normal case and keep a CSS path that
 * looks good on its own — motion is an enhancement, never a requirement.
 */
export function useMotionRuntime(): MotionRuntime | null {
  return React.useContext(MotionRuntimeContext);
}

// =============================================================================
// Prop builders
// =============================================================================

/**
 * Builds the `toggle`/`presence` prop builders around a library-agnostic core.
 * Exported so `<MotionProvider>` can assemble a runtime without restating the
 * preset lookup.
 *
 * @internal
 */
export function createPresetPropBuilders(): Pick<
  MotionRuntime,
  'toggle' | 'presence'
> {
  return {
    toggle(preset, open, custom) {
      const { variants, transition } = motionPresets[preset];
      return {
        variants,
        transition,
        custom,
        // `false` pins the element to its current variant on mount instead of
        // animating into it.
        initial: false,
        animate: open ? 'open' : 'closed',
      };
    },

    presence(preset, custom) {
      const { variants, transition } = motionPresets[preset];
      return {
        variants,
        transition,
        custom,
        initial: 'closed',
        animate: 'open',
        exit: 'closed',
      };
    },
  };
}
