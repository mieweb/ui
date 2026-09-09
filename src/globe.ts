/**
 * Globe entry point — separate from the main bundle.
 *
 * Usage:
 *   npm install @mieweb/ui react-globe.gl three
 *   import { Globe } from '@mieweb/ui/globe';
 *
 * Keeps three.js and react-globe.gl (~700KB) out of the default install so
 * consumers who don't render a globe aren't burdened. Client-only: render
 * behind a dynamic import / `ssr: false` boundary.
 */
export * from './components/Globe';
