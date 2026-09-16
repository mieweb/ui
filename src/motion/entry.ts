/**
 * `@mieweb/ui/motion` — opt into real animations.
 *
 * Requires the optional peer dependency:
 *
 * ```sh
 * npm install motion
 * ```
 *
 * Then wrap the app once:
 *
 * ```tsx
 * import { MotionProvider } from '@mieweb/ui/motion';
 *
 * createRoot(el).render(
 *   <MotionProvider>
 *     <App />
 *   </MotionProvider>
 * );
 * ```
 *
 * Components that support motion detect the provider and upgrade themselves.
 * Without it they keep their CSS transitions, so importing this entry is the
 * whole opt-in — there is no per-component flag to set.
 */

export { MotionProvider, type MotionProviderProps } from './MotionProvider';

// Re-exported for apps building their own animated components on the same
// presets and runtime as the library.
export {
  useMotionRuntime,
  Animated,
  AnimatedPresence,
  motionPresets,
  type AnimatedProps,
  type MotionRuntime,
  type MotionPreset,
} from './index';
