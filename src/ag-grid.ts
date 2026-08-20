/**
 * AG Grid entry point — separate from the main bundle.
 *
 * @deprecated AGGrid is deprecated — use DataVis NITRO (`@mieweb/ui/datavis`)
 * for all tables. This entry point will be removed in a future major release.
 *
 * Usage:
 *   npm install @mieweb/ui ag-grid-community ag-grid-react
 *   import { AGGrid } from '@mieweb/ui/ag-grid';
 *
 * This keeps ag-grid-community and ag-grid-react out of the default
 * install/bundle so consumers who don't need grids aren't burdened.
 */
export * from './components/AGGrid';
