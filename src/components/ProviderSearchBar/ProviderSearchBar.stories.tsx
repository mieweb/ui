import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ProviderSearchBar,
  HeroSearchBar,
  SearchResultsMessage,
  type SearchResults,
  type GeolocationStatus,
  type PostalCodeInfo,
} from './ProviderSearchBar';

const mockPostalCode: PostalCodeInfo = {
  zipcode: '46220',
  city: 'Indianapolis',
  state: 'IN',
  latitude: 39.8397,
  longitude: -86.1255,
};

const meta: Meta<typeof ProviderSearchBar> = {
  title: 'Search/ProviderSearchBar',
  component: ProviderSearchBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    geoStatus: {
      control: 'select',
      options: ['idle', 'loading', 'success', 'error'],
      description: 'Current geolocation status',
    },
    variant: { table: { disable: true } },
    size: { table: { disable: true } },
    results: { table: { disable: true } },
    onSearch: { action: 'searched' },
    onGeolocate: { action: 'geolocated' },
    onResultsClick: { action: 'results-clicked' },
    onValueChange: { action: 'value-changed' },
    loading: { control: 'boolean' },
    showResults: { control: 'boolean' },
  },
  args: {
    providerCount: 17500,
    geoStatus: 'idle',
    showResults: true,
    results: { count: 42, postalCode: mockPostalCode, distance: 25 },
  },
};

export default meta;
type Story = StoryObj<typeof ProviderSearchBar>;

// Default search bar
export const Default: Story = {};

// All variants comparison
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      {(['default', 'hero'] as const).map((variant) => (
        <div key={variant} className="space-y-1">
          <div className="text-sm font-medium text-gray-500">{variant}</div>
          <ProviderSearchBar
            variant={variant}
            onSearch={() => {}}
            providerCount={17500}
          />
        </div>
      ))}
    </div>
  ),
};

// With geolocation button
function WithGeolocationWrapper() {
  const [status, setStatus] = React.useState<GeolocationStatus>('idle');

  const handleGeolocate = () => {
    setStatus('loading');
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <ProviderSearchBar
      onSearch={(zip) => console.log('Search:', zip)}
      onGeolocate={handleGeolocate}
      geoStatus={status}
      providerCount={17500}
    />
  );
}

export const WithGeolocation: Story = {
  render: () => <WithGeolocationWrapper />,
};

// With search results
export const WithResults: Story = {
  render: () => {
    const results: SearchResults = {
      count: 42,
      postalCode: mockPostalCode,
      distance: 25,
    };

    return (
      <ProviderSearchBar
        onSearch={() => {}}
        results={results}
        showResults
        onResultsClick={() => console.log('Results clicked')}
        providerCount={17500}
      />
    );
  },
};

// Hero search bar sub-component
export const HeroSearchBarDemo: StoryObj<typeof HeroSearchBar> = {
  render: () => (
    <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8">
      <h2 className="mb-4 text-center text-2xl font-bold text-white">
        Find Healthcare Providers Near You
      </h2>
      <HeroSearchBar
        onSearch={(zip) => console.log('Search:', zip)}
        providerCount={17500}
        title="Search 17,500+ providers"
        subtitle="Enter your ZIP code to find the nearest locations"
      />
    </div>
  ),
};

// Search results message sub-component
export const SearchResultsMessageDemo: StoryObj<typeof SearchResultsMessage> = {
  render: () => (
    <div className="space-y-4">
      <SearchResultsMessage
        results={{ count: 42, postalCode: mockPostalCode, distance: 25 }}
        onResultsClick={() => console.log('Clicked')}
      />
      <SearchResultsMessage
        results={{
          count: 0,
          postalCode: { ...mockPostalCode, zipcode: '99999' },
          distance: 25,
        }}
        onResultsClick={() => console.log('Clicked')}
      />
      <SearchResultsMessage loading />
    </div>
  ),
};
