/**
 * Ozwell entry point — separate from the main bundle.
 *
 * Usage:
 *   npm install @mieweb/ui @ozwell/react
 *   import { OzwellWidget } from '@mieweb/ui/ozwell';
 *
 * For the animated Rive button, also install:
 *   npm install @rive-app/react-canvas
 *
 * This keeps @ozwell/react and @rive-app/react-canvas out of the default
 * install/bundle so consumers who don't need the Ozwell widget aren't burdened.
 */
export {
  OzwellWidget,
  useOzwell,
  type OzwellWidgetProps,
  type OzwellChatProps,
  type OzwellTool,
  type OzwellToolFunction,
  type OzwellToolParameter,
  type OzwellError,
  type UseOzwellReturn,
} from './components/AI/OzwellWidget';

export {
  OzwellAnimatedButton,
  type OzwellAnimatedButtonProps,
} from './components/AI/OzwellAnimatedButton';
