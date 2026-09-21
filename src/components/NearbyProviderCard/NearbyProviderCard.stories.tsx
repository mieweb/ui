import type { Meta, StoryObj } from '@storybook/react-vite';
import { NearbyProviderCard } from './NearbyProviderCard';

const meta: Meta<typeof NearbyProviderCard> = {
  id: 'providers-nearbyprovidercard',
  title: 'BlueHive/Provider discovery/NearbyProviderCard',
  component: NearbyProviderCard,
  tags: ['autodocs', 'scope:product-specific', 'maturity:beta'],
  parameters: {
    layout: 'padded',
    catalog: { entry: '@mieweb/ui', relationships: [] },
    docs: { description: { component: `### What it's for

A nearby clinic summary with location, distance, phone and a provider-profile link.

### Use it when

An employer is comparing clinics near an employee.

### Don't use it when

Use ProviderMap for a geographic view or Card for unrelated content.

### Example

Fetch authorized search results in the page and render one card per provider; pass LinkComponent to integrate a router.

### Limitations

Distance is supplied in miles. Profile links use BlueHive's provider route. The caller owns localization, geolocation and ordering. Logos fall back to initials when missing or broken.` } },
  },
  args: {
    provider: {
      id: 'clinic-1', name: 'Midwest Occupational Health', slug: 'midwest-occ-health', distance: 2.4,
      address: { street1: '101 Main Street', city: 'Fort Wayne', state: 'IN', postalCode: '46802' },
      phoneNumber: '2605550100',
    },
  },
};
export default meta;
type Story = StoryObj<typeof NearbyProviderCard>;
export const Default: Story = {};
export const BrokenLogo: Story = { args: { provider: { ...meta.args!.provider!, logoUrl: '/missing-clinic-logo.svg' } } };
export const Dark: Story = { decorators: [(Story) => <div className="dark rounded-xl bg-background p-4"><Story /></div>] };
export const Narrow: Story = { decorators: [(Story) => <div className="max-w-sm"><Story /></div>] };
