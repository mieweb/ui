/**
 * OrgChart entry point — separate from the main bundle.
 *
 * Usage:
 *   npm install @mieweb/ui @xyflow/react elkjs
 *   import '@xyflow/react/dist/style.css';
 *   import { OrgChart } from '@mieweb/ui/org-chart';
 *
 * Keeps React Flow and elkjs (~1.6MB, loaded lazily on first layout) out of
 * the default install so consumers who don't render a hierarchy aren't
 * burdened. Client-only: render behind a client boundary.
 */
export * from './components/OrgChart';
