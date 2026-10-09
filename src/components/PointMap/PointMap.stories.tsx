import type { Meta, StoryObj } from '@storybook/react-vite';
import 'leaflet/dist/leaflet.css';
import { PointMap } from './PointMap';

const regions = [
  { label: 'Northeast', value: 42, lat: 41.5, lng: -74.5 },
  { label: 'Southeast', value: 58, lat: 33.5, lng: -84.4 },
  { label: 'Midwest', value: 37, lat: 41.9, lng: -89.4 },
  { label: 'Southwest', value: 29, lat: 32.8, lng: -99.9 },
  { label: 'West', value: 45, lat: 38.5, lng: -119.4 },
];

const meta: Meta<typeof PointMap> = {
  id: 'presentations-pointmap',
  title: 'Modules/Presentations/PointMap',
  component: PointMap,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    meta: {
      origin: {
        repo: 'bluehive-health/bluehive-marketing',
        note: 'Merges ReportRegionMap (bubbles by value) and ReportProviderClaimsMap (points) on plain Leaflet.',
      },
    },
    docs: {
      description: {
        component: `### What it's for

Points on a real map — regional totals as bubbles sized by value, or individual locations as dots — with the same points listed as text underneath.

### Use it when

- Where something is matters: coverage by region, new locations this quarter.

### Don't use it when

- You're comparing a figure across every state — a [TileCartogramSection](?path=/docs/reports-tilecartogramsection--docs) gives small states equal weight.

### Example

\`\`\`tsx
'use client';
import 'leaflet/dist/leaflet.css';
import { PointMap } from '@mieweb/ui/maps';

<PointMap label="Signups by region" points={[{ label: 'West', value: 45, lat: 38.5, lng: -119.4 }]} showValues />
\`\`\`

### Limitations

- Needs the optional \`leaflet\` peer and its CSS; client-only (Leaflet is loaded on mount).
- Tiles default to OpenStreetMap, which asks heavy users to use their own tile service — pass \`tileUrl\` and \`attribution\` for production.
- \`outlineUrl\` fetches a GeoJSON file (e.g. US states) the site hosts.
- The map is a labelled group whose zoom controls and attribution stay keyboard-reachable; the list beneath carries the data for screen readers. Scroll-wheel zoom is off so the page scrolls past it.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/maps',
      relationships: [
        {
          type: 'composes with',
          target: 'presentations-deck',
          why: 'Register it in Deck’s `graphics` to put a map on a slide.',
        },
        {
          type: 'alternative to',
          target: 'reports-tilecartogramsection',
          why: 'The cartogram gives every region equal area.',
        },
      ],
    },
  },
  argTypes: {
    points: { description: '`{ lat, lng, label, value?, detail? }[]`.' },
    label: { control: 'text' },
    sizeBy: { control: 'inline-radio', options: ['value', 'none'] },
    showValues: { control: 'boolean' },
    height: { control: 'number' },
  },
  args: { label: 'Signups by region', points: regions, showValues: true },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Regions: Story = {};

export const Locations: Story = {
  args: {
    label: 'New provider locations',
    sizeBy: 'none',
    showValues: false,
    points: [
      {
        label: 'Austin Occupational Health',
        detail: 'Austin, TX · Mar 2026',
        lat: 30.27,
        lng: -97.74,
      },
      {
        label: 'Columbus WorkCare',
        detail: 'Columbus, OH · Apr 2026',
        lat: 39.96,
        lng: -83.0,
      },
      {
        label: 'Denver Industrial Clinic',
        detail: 'Denver, CO · May 2026',
        lat: 39.74,
        lng: -104.99,
      },
    ],
  },
};
