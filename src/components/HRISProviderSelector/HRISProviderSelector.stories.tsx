import type { Meta, StoryObj } from '@storybook/react';
import {
  HRISProviderSelector,
  type HRISProvider,
} from './HRISProviderSelector';

// HRIS provider logos - stored in .storybook/public/hris-logos/
// Some icons sourced from Simple Icons (ADP, Gusto, QuickBooks, Sage, Square)
// Others are branded SVG placeholders with company initials
const sampleProviders: HRISProvider[] = [
  {
    id: 'adp',
    displayName: 'ADP',
    logoUrl: '/hris-logos/adp.svg',
  },
  {
    id: 'bamboo',
    displayName: 'BambooHR',
    logoUrl: '/hris-logos/bamboohr.svg',
  },
  {
    id: 'gusto',
    displayName: 'Gusto',
    logoUrl: '/hris-logos/gusto.svg',
  },
  {
    id: 'justworks',
    displayName: 'Justworks',
    logoUrl: '/hris-logos/justworks.svg',
  },
  {
    id: 'paychex',
    displayName: 'Paychex',
    logoUrl: '/hris-logos/paychex.svg',
  },
  {
    id: 'paycom',
    displayName: 'Paycom',
    logoUrl: '/hris-logos/paycom.svg',
  },
  {
    id: 'paylocity',
    displayName: 'Paylocity',
    logoUrl: '/hris-logos/paylocity.svg',
  },
  {
    id: 'quickbooks',
    displayName: 'QuickBooks',
    logoUrl: '/hris-logos/quickbooks.svg',
  },
  {
    id: 'rippling',
    displayName: 'Rippling',
    logoUrl: '/hris-logos/rippling.svg',
  },
  {
    id: 'sage',
    displayName: 'Sage',
    logoUrl: '/hris-logos/sage.svg',
  },
  {
    id: 'square',
    displayName: 'Square Payroll',
    logoUrl: '/hris-logos/square.svg',
  },
  {
    id: 'trinet',
    displayName: 'TriNet',
    logoUrl: '/hris-logos/trinet.svg',
  },
  {
    id: 'ukg',
    displayName: 'UKG',
    logoUrl: '/hris-logos/ukg.svg',
  },
  {
    id: 'workday',
    displayName: 'Workday',
    logoUrl: '/hris-logos/workday.svg',
  },
  {
    id: 'zenefits',
    displayName: 'Zenefits',
    logoUrl: '/hris-logos/zenefits.svg',
  },
];

const connectedProvider: HRISProvider = {
  id: 'bamboo',
  displayName: 'BambooHR',
  logoUrl: '/hris-logos/bamboohr.svg',
  connected: true,
  lastSync: new Date().toISOString(),
};

const meta: Meta<typeof HRISProviderSelector> = {
  title: 'Inputs & Controls/HRISProviderSelector',
  component: HRISProviderSelector,
  tags: ['autodocs'],
  args: {
    providers: sampleProviders,
    loading: false,
    showCSVOption: true,
    searchQuery: '',
  },
  argTypes: {
    providers: {
      description: 'Array of available HRIS providers to display',
      control: 'object',
    },
    currentProvider: {
      description:
        'Currently connected provider (shows connection status view when set)',
      control: 'object',
    },
    loading: {
      description: 'Shows loading skeleton placeholders',
      control: 'boolean',
    },
    showCSVOption: {
      description: 'Whether to show the CSV import option in the grid',
      control: 'boolean',
    },
    searchQuery: {
      description: 'Current search query for filtering providers',
      control: 'text',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
    labels: {
      description: 'Custom labels for internationalization',
      control: 'object',
    },
    onProviderSelect: {
      action: 'provider selected',
    },
    onCSVImport: {
      action: 'CSV import clicked',
    },
    onDisconnect: {
      action: 'disconnect clicked',
    },
    onRefreshSync: {
      action: 'refresh sync clicked',
    },
    onSearchChange: {
      action: 'search changed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HRISProviderSelector>;

export const Default: Story = {};

export const Connected: Story = {
  args: {
    currentProvider: connectedProvider,
  },
};

export const ConnectedPendingSync: Story = {
  args: {
    currentProvider: {
      id: 'gusto',
      displayName: 'Gusto',
      logoUrl: '/hris-logos/gusto.svg',
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
    showCSVOption: false,
  },
};

export const FilteredSearch: Story = {
  args: {
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
