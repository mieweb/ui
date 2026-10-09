/**
 * `@mieweb/ui/maps` — Leaflet maps, separate from the main bundle.
 *
 *   npm install leaflet
 *   import 'leaflet/dist/leaflet.css';
 *   import { PointMap } from '@mieweb/ui/maps';
 *
 * Client-only. In a deck, register it as a graphic:
 * `<Deck graphics={{ map: PointMap }} />` with `{ type: 'custom', component: 'map', props }`.
 */
export * from './components/PointMap';
