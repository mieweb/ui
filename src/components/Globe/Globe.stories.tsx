import type { Meta, StoryObj } from '@storybook/react-vite';
import { Globe, type GlobePoint } from './Globe';
import type { ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/global/',
      note: 'The "global reach" section — hubs, deployment cities and the animated backbone.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Ported from components/sections/GlobeViz.tsx (core globe, arcs, points, callout). The touch tour and off-screen locators stay page-level.',
  },
};

const points: GlobePoint[] = [
  {
    id: 'fwa',
    lat: 41.08,
    lng: -85.14,
    name: 'Fort Wayne',
    sub: 'Global HQ',
    hub: true,
    timeZone: 'America/Indiana/Indianapolis',
    flag: '🇺🇸',
  },
  {
    id: 'lon',
    lat: 51.51,
    lng: -0.13,
    name: 'London',
    sub: 'EMEA hub',
    hub: true,
    timeZone: 'Europe/London',
    flag: '🇬🇧',
  },
  {
    id: 'sin',
    lat: 1.35,
    lng: 103.82,
    name: 'Singapore',
    sub: 'APAC hub',
    hub: true,
    timeZone: 'Asia/Singapore',
    flag: '🇸🇬',
  },
  {
    id: 'sao',
    lat: -23.55,
    lng: -46.63,
    name: 'São Paulo',
    sub: 'Distribution',
    timeZone: 'America/Sao_Paulo',
    flag: '🇧🇷',
  },
  {
    id: 'mex',
    lat: 19.43,
    lng: -99.13,
    name: 'Mexico City',
    sub: 'Manufacturing',
    timeZone: 'America/Mexico_City',
    flag: '🇲🇽',
  },
  {
    id: 'tor',
    lat: 43.65,
    lng: -79.38,
    name: 'Toronto',
    sub: 'Distribution',
    timeZone: 'America/Toronto',
    flag: '🇨🇦',
  },
  {
    id: 'fra',
    lat: 50.11,
    lng: 8.68,
    name: 'Frankfurt',
    sub: 'Manufacturing',
    timeZone: 'Europe/Berlin',
    flag: '🇩🇪',
  },
  {
    id: 'jnb',
    lat: -26.2,
    lng: 28.05,
    name: 'Johannesburg',
    sub: 'Mining',
    timeZone: 'Africa/Johannesburg',
    flag: '🇿🇦',
  },
  {
    id: 'dxb',
    lat: 25.2,
    lng: 55.27,
    name: 'Dubai',
    sub: 'Energy',
    timeZone: 'Asia/Dubai',
    flag: '🇦🇪',
  },
  {
    id: 'bom',
    lat: 19.08,
    lng: 72.88,
    name: 'Mumbai',
    sub: 'Pharma',
    timeZone: 'Asia/Kolkata',
    flag: '🇮🇳',
  },
  {
    id: 'tyo',
    lat: 35.68,
    lng: 139.69,
    name: 'Tokyo',
    sub: 'Manufacturing',
    timeZone: 'Asia/Tokyo',
    flag: '🇯🇵',
  },
  {
    id: 'syd',
    lat: -33.87,
    lng: 151.21,
    name: 'Sydney',
    sub: 'Mining',
    timeZone: 'Australia/Sydney',
    flag: '🇦🇺',
  },
  {
    id: 'per',
    lat: -31.95,
    lng: 115.86,
    name: 'Perth',
    sub: 'Mining',
    timeZone: 'Australia/Perth',
    flag: '🇦🇺',
  },
];

const meta: Meta<typeof Globe> = {
  title: 'Components/Images & Media/Globe',
  component: Globe,
  parameters: {
    layout: 'fullscreen',
    meta: componentMeta,
    docs: {
      description: {
        component:
          'A branded WebGL globe on `react-globe.gl`: dotted-hex continents, hub and city dots with hover ' +
          'tooltips, animated hub-and-spoke arcs (auto-built from `points`, or pass `arcs`), slow ' +
          'auto-rotation that pauses while dragging and is off under `prefers-reduced-motion`, and a pill ' +
          'callout for the selected point with an optional live local clock (`timeZone`). Transparent ' +
          'background. **Separate entry:** `import { Globe } from "@mieweb/ui/globe"` with the optional ' +
          'peers `react-globe.gl` and `three` installed; render behind `ssr: false`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    points: { control: false },
    arcs: { control: false },
    theme: { control: false },
    onSelect: { control: false },
    onPointHover: { control: false },
    hexResolution: { control: { type: 'range', min: 2, max: 4, step: 1 } },
    autoRotateSpeed: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[600px] bg-[radial-gradient(120%_100%_at_50%_0%,var(--mieweb-primary-950),#05070c_70%)] p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Click a dot to open the callout; hubs ring each other, cities spoke to their nearest hub. */
export const Default: Story = {
  args: { points },
};

/** Warm brand theme on a light surface. */
export const Themed: Story = {
  args: {
    points,
    theme: {
      surface: '#2c1528',
      emissive: '#391c35',
      atmosphere: '#c9a874',
      land: 'rgba(231,200,146,0.55)',
      hub: '#ffe7b0',
      city: 'rgba(231,200,146,0.8)',
      backbone: ['rgba(231,200,146,0.1)', 'rgba(255,231,176,0.95)'],
      spoke: ['rgba(231,200,146,0)', 'rgba(231,200,146,0.55)'],
    },
    selectedId: 'sao',
  },
  decorators: [
    (Story) => (
      <div className="min-h-[600px] bg-[radial-gradient(120%_100%_at_50%_0%,#f3e2c1,#e0b98a_70%)] p-6">
        <Story />
      </div>
    ),
  ],
};

/** No continents fetch, no arcs, no rotation — just dots. */
export const Minimal: Story = {
  args: {
    points: points.map((p) => ({ ...p, hub: false })),
    geoUrl: null,
    autoRotateSpeed: 0,
    callout: false,
  },
};
