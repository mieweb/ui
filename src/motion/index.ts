/**
 * Motion primitives that are safe for the main `@mieweb/ui` entry.
 *
 * Nothing re-exported here imports `motion`. The provider that does lives in
 * `./MotionProvider` and is published separately as `@mieweb/ui/motion` —
 * keep it out of this barrel or the dependency stops being optional.
 *
 * `MotionRuntimeContext` and `createPresetPropBuilders` are deliberately *not*
 * re-exported: they are `@internal` plumbing for `<MotionProvider>`, which
 * imports them from `./runtime` directly. This barrel feeds the public API of
 * both entries.
 */

export { Animated, AnimatedPresence, type AnimatedProps } from './Animated';
export {
  useMotionRuntime,
  type MotionRuntime,
  type MotionPresenceProps,
} from './runtime';
export {
  motionPresets,
  type MotionPreset,
  type MotionPresetDefinition,
  type MotionVariant,
} from './presets';
