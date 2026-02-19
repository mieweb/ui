/**
 * DataVis entry point — separate from the main bundle.
 *
 * Usage:
 *   npm install @mieweb/ui @mieweb/wcdatavis
 *   import { DataVis } from '@mieweb/ui/datavis';
 *
 * This keeps @mieweb/wcdatavis (and its jQuery dependency chain) out of
 * the default install/bundle so consumers who don't need DataVis grids
 * aren't burdened.
 */
export * from './components/DataVis';
