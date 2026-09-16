/**
 * `Animated` / `AnimatedPresence` — the ergonomic layer components use.
 *
 * These exist so an individual component never has to branch on whether motion
 * is available. It declares the preset it wants and the CSS classes that stand
 * in when motion is absent; this module picks the element to render.
 *
 * Adding motion to a further component should be a matter of swapping its
 * root `<div>` for an `<Animated>` and naming a preset — no new imports, no
 * new dependency, and no behavior change for apps that have not opted in.
 */

import * as React from 'react';
import { cn } from '../utils/cn';
import { useMotionRuntime, type MotionPresenceProps } from './runtime';
import type { MotionPreset } from './presets';

// =============================================================================
// Animated
// =============================================================================

export interface AnimatedProps extends React.HTMLAttributes<HTMLElement> {
  /** Intrinsic element to render. */
  as?: 'div' | 'nav' | 'span';
  /** Which shared animation recipe to use. */
  preset: MotionPreset;
  /**
   * - `toggle` — element stays mounted and animates between open and closed.
   * - `presence` — element mounts and unmounts; wrap it in `<AnimatedPresence>`
   *   so the exit animation gets a chance to run.
   */
  mode: 'toggle' | 'presence';
  /** Current state. Only read in `toggle` mode. */
  open?: boolean;
  /** Per-preset context value — see the `custom` contract in `presets.ts`. */
  custom?: unknown;
  /**
   * Classes applied whenever this element is **not** animating — no provider,
   * a disabled provider, or `enabled={false}`. This is where a component's
   * existing CSS transition lives, so the two paths never both try to drive
   * the same property.
   */
  fallbackClassName?: string;
  /**
   * Set `false` to stop this element animating even when a runtime is active.
   *
   * For states where an animated element would be wrong rather than merely
   * unnecessary. Motion writes a `transform` to hold an element at its resting
   * position, and a transformed ancestor becomes the containing block for any
   * `position: fixed` descendant — so an element that is only sometimes
   * animated should opt out the rest of the time.
   *
   * Flipping this (or the provider's `disabled`) swaps the element back to a
   * plain tag, which **remounts** it — deliberately. See the note on the
   * render branches below.
   */
  enabled?: boolean;
}

export const Animated = React.forwardRef<HTMLElement, AnimatedProps>(
  function Animated(
    {
      as = 'div',
      preset,
      mode,
      open = false,
      custom,
      className,
      fallbackClassName,
      enabled = true,
      children,
      ...rest
    },
    ref
  ) {
    const runtime = useMotionRuntime();

    /*
     * Anything not animating renders the plain tag with the CSS fallback —
     * no provider, a disabled provider, or `enabled={false}` alike.
     *
     * Crossing between this branch and the motion one changes the element
     * type, which remounts the subtree. That is deliberate. The obvious
     * alternative — keeping the motion component mounted and only withholding
     * its animation props — corrupts `toggle`-mode elements in both
     * directions, because motion only writes variant styles at mount or in
     * response to an animation:
     *
     * - props added in place (a drawer crossing into its mobile breakpoint
     *   while closed) never get the `closed` transform, so the drawer sits
     *   fully visible over the page;
     * - props removed in place strand whatever inline `transform` motion last
     *   wrote, so a sidebar returning to desktop stays off-canvas.
     *
     * Fresh mounts are correct in both worlds, so remounting at the flip is
     * the fix. The flips are rare — a breakpoint cross, a test toggling the
     * provider — and a remount that resets local state beats a stale
     * transform that removes the navigation.
     */
    if (!runtime || !runtime.enabled || !enabled) {
      const Tag = as as React.ElementType;
      return (
        <Tag ref={ref} className={cn(fallbackClassName, className)} {...rest}>
          {children}
        </Tag>
      );
    }

    const Component =
      as === 'nav' ? runtime.Nav : as === 'span' ? runtime.Span : runtime.Div;

    const motionProps =
      mode === 'toggle'
        ? runtime.toggle(preset, open, custom)
        : runtime.presence(preset, custom);

    return (
      <Component ref={ref} className={className} {...motionProps} {...rest}>
        {children}
      </Component>
    );
  }
);

Animated.displayName = 'Animated';

// =============================================================================
// AnimatedPresence
// =============================================================================

/**
 * Keeps unmounting children on screen long enough to animate out.
 *
 * Without a runtime this is a pass-through, so children disappear immediately —
 * which is exactly what they do today. Children rendered conditionally inside
 * it need a stable `key`.
 */
export function AnimatedPresence({
  children,
  initial,
  onExitComplete,
}: MotionPresenceProps): React.JSX.Element {
  const runtime = useMotionRuntime();

  if (!runtime) {
    return <>{children}</>;
  }

  const { Presence } = runtime;
  return (
    <Presence initial={initial} onExitComplete={onExitComplete}>
      {children}
    </Presence>
  );
}

AnimatedPresence.displayName = 'AnimatedPresence';
