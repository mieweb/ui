import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { HRISProviderSelector, type HRISProvider } from './HRISProviderSelector';

const meta: Meta<typeof HRISProviderSelector> = {
  title: 'Components/HRISProviderSelector',
  component: HRISProviderSelector,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HRISProviderSelector>;

const sampleProviders: HRISProvider[] = [
  { id: 'adp', displayName: 'ADP', logoUrl: 'https://finchdata.io/integrations/adp.svg' },
  { id: 'bamboo', displayName: 'BambooHR', logoUrl: 'https://finchdata.io/integrations/bamboohr.svg' },
  { id: 'gusto', displayName: 'Gusto', logoUrl: 'https://finchdata.io/integrations/gusto.svg' },
  { id: 'justworks', displayName: 'Justworks', logoUrl: 'https://finchdata.io/integrations/justworks.svg' },
  { id: 'paychex', displayName: 'Paychex', logoUrl: 'https://finchdata.io/integrations/paychex.svg' },
  { id: 'paycom', displayName: 'Paycom', logoUrl: 'https://finchdata.io/integrations/paycom.svg' },
  { id: 'paylocity', displayName: 'Paylocity', logoUrl: 'https://finchdata.io/integrations/paylocity.svg' },
  { id: 'quickbooks', displayName: 'QuickBooks', logoUrl: 'https://finchdata.io/integrations/quickbooks.svg' },
  { id: 'rippling', displayName: 'Rippling', logoUrl: 'https://finchdata.io/integrations/rippling.svg' },
  { id: 'sage', displayName: 'Sage', logoUrl: 'https://finchdata.io/integrations/sage.svg' },
  { id: 'square', displayName: 'Square Payroll', logoUrl: 'https://finchdata.io/integrations/square.svg' },
  { id: 'trinet', displayName: 'TriNet', logoUrl: 'https://finchdata.io/integrations/trinet.svg' },
  { id: 'ukg', displayName: 'UKG', logoUrl: 'https://finchdata.io/integrations/ukg.svg' },
  { id: 'workday', displayName: 'Workday', logoUrl: 'https://finchdata.io/integrations/workday.svg' },
  { id: 'zenefits', displayName: 'Zenefits', logoUrl: 'https://finchdata.io/integrations/zenefits.svg' },
];

function DefaultWrapper() {
  const [search, setSearch] = useState('');

  return (
    <HRISProviderSelector
      providers={sampleProviders}
      searchQuery={search}
      onSearchChange={setSearch}
      onProviderSelect={(p) => window.alert(`Selected: ${p.displayName}`)}
      onCSVImport={() => window.alert('CSV Import clicked')}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultWrapper />,
};

export const Connected: Story = {
  args: {
    providers: sampleProviders,
    currentProvider: {
      id: 'bamboo',
      displayName: 'BambooHR',
      logoUrl: 'https://finchdata.io/integrations/bamboohr.svg',
      connected: true,
      lastSync: new Date().toISOString(),
    },
  },
};

export const ConnectedPendingSync: Story = {
  args: {
    providers: sampleProviders,
    currentProvider: {
      id: 'gusto',
      displayName: 'Gusto',
      logoUrl: 'https://finchdata.io/integrations/gusto.svg',
      connected: true,
      lastSync: undefined,
    },
  },
};

export const Loading: Story = {
  args: {
    providers: [],
    loading: true,
  },
};

export const NoResults: Story = {
  args: {
    providers: [],
    searchQuery: 'nonexistent',
    loading: false,
  },
};

export const WithoutCSVOption: Story = {
  args: {
    providers: sampleProviders,
    showCSVOption: false,
  },
};

export const FilteredSearch: Story = {
  args: {
    providers: sampleProviders,
    searchQuery: 'pay',
  },
};

export const Mobile: Story = {
  args: {
    providers: sampleProviders.slice(0, 6),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const CustomLabels: Story = {
  args: {
    providers: sampleProviders,
    labels: {
      search: 'Find your HR system...',
      importCSV: 'Upload Spreadsheet',
      lastSync: 'Last Updated',
      disconnect: 'Remove Connection',
      refreshSync: 'Sync Now',
      noProviders: 'No matching providers',
      syncPending: 'Waiting for initial data sync...',
      supportEmail: 'help@company.com',
    },
  },
};
