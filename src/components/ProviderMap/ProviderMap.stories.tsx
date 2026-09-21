import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProviderMap } from './ProviderMap';

const meta: Meta<typeof ProviderMap> = {
  id: 'providers-providermap',
  title: 'BlueHive/Provider discovery/ProviderMap',
  component: ProviderMap,
  tags: ['autodocs', 'scope:product-specific', 'maturity:beta'],
  parameters: {
    layout: 'padded',
    catalog: { entry: '@mieweb/ui', peers: ['mapbox-gl (optional)'], relationships: [{"type": "alternative to", "target": "providers-nearbyprovidercard", "why": "Use the map for directions; use the card to compare clinics in a list."}] },
    docs: { description: { component: `### What it's for

A clinic location map with optional directions and Mapbox navigation controls.

### Use it when

Someone needs to locate a selected clinic before visiting.

### Don't use it when

Use NearbyProviderCard to compare clinics in a list. Always provide the address outside the map as well.

### Example

The page supplies coordinates and a directionsUrl. Add a public, origin-restricted mapboxToken for interactive controls; omit it to show the OpenStreetMap fallback.

### Limitations

Mapbox and OpenStreetMap require network access. Set your own public token in the Interactive story controls; no token is stored in this catalog. Loading and provider errors have fallback states. Zoom/fullscreen controls belong to Mapbox; geolocation requires browser permission. The address is exposed in the fallback frame title.` } },
  },
  args: {
    coordinates: { latitude: 41.0793, longitude: -85.1394 },
    providerName: 'Midwest Occupational Health', address: '101 Main Street, Fort Wayne, IN',
    directionsUrl: 'https://www.openstreetmap.org/directions?to=41.0793%2C-85.1394',
    height: 'h-80',
  },
  argTypes: { mapboxToken: { control: 'text', description: 'Public origin-restricted Mapbox token; omit for OpenStreetMap.' } },
};
export default meta;
type Story = StoryObj<typeof ProviderMap>;
export const Default: Story = {};
export const Interactive: Story = { args: { mapboxToken: 'pk.replace-with-your-public-token' } };
export const Unavailable: Story = { args: { mapboxToken: 'invalid-storybook-token' } };
export const Dark: Story = { decorators: [(Story) => <div className="dark rounded-xl bg-background p-4"><Story /></div>] };
