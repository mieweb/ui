import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataVis, type DataVisProps } from './DataVis';

// Import DataVis CSS
import 'wcdatavis/dist/wcdatavis.css';
import './datavis-theme.css';

// ============================================================================
// Story Meta
// ============================================================================

const meta: Meta<typeof DataVis> = {
  title: 'Components/DataVis',
  component: DataVis,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A themed React wrapper for [MIE DataVis](https://github.com/mieweb/wcdatavis) (\`@mieweb/wcdatavis\`).

DataVis is an imperative data visualization and grid library. This component wraps it
in a declarative React interface with full integration into the MIE Web UI design system:

- **Multi-brand theming** via CSS variables
- **Dark/light mode** support
- **Variant styles** (default, bordered, card)
- **Size presets** (sm, md, lg)
- **Lifecycle management** (mount, update, destroy)

### Installation

DataVis lives in a **separate entry point** so the heavy \`@mieweb/wcdatavis\`
library is never pulled into your bundle unless you explicitly opt in:

\`\`\`bash
npm install @mieweb/wcdatavis font-awesome
\`\`\`

### Prerequisites

1. Include FontAwesome 4.7 CSS for icons
2. Import the DataVis theme CSS from this package

\`\`\`tsx
import { DataVis } from '@mieweb/ui/datavis';

<DataVis
  source={{ type: 'http', url: '/api/data.csv' }}
  gridOptions={{ title: 'My Data Grid' }}
  variant="bordered"
  height={500}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    source: {
      description: 'Data source configuration',
      control: { type: 'object' },
    },
    gridOptions: {
      description: 'Grid display options (title, columns, toolbar, etc.)',
      control: { type: 'object' },
    },
    viewOptions: {
      description: 'View configuration (sort, group, filter)',
      control: { type: 'object' },
    },
    variant: {
      description: 'Visual variant',
      control: { type: 'select' },
      options: ['default', 'bordered', 'card'],
    },
    size: {
      description: 'Size/density preset',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    brand: {
      description: 'Brand theme',
      control: { type: 'select' },
      options: [
        'default',
        'mieweb',
        'bluehive',
        'waggleline',
        'webchart',
        'enterprise-health',
      ],
    },
    height: {
      description: 'Container height',
      control: { type: 'text' },
    },
    loading: {
      description: 'Loading state',
      control: { type: 'boolean' },
    },
    className: {
      description: 'Additional CSS classes',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<DataVisProps>;

// ============================================================================
// Sample Data
// ============================================================================

/**
 * Simple fruit CSV data served from a static URL.
 * In a real app, this would point to your data endpoint.
 */
const sampleHttpSource: DataVisProps['source'] = {
  type: 'http',
  url: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv',
};

const sampleJsonSource: DataVisProps['source'] = {
  type: 'json',
  data: [
    {
      name: 'Apple',
      category: 'Fruit',
      price: 1.2,
      quantity: 150,
      inStock: true,
    },
    {
      name: 'Banana',
      category: 'Fruit',
      price: 0.5,
      quantity: 200,
      inStock: true,
    },
    {
      name: 'Carrot',
      category: 'Vegetable',
      price: 0.8,
      quantity: 100,
      inStock: true,
    },
    {
      name: 'Durian',
      category: 'Fruit',
      price: 12.0,
      quantity: 5,
      inStock: false,
    },
    {
      name: 'Eggplant',
      category: 'Vegetable',
      price: 2.5,
      quantity: 75,
      inStock: true,
    },
    { name: 'Fig', category: 'Fruit', price: 3.0, quantity: 30, inStock: true },
    {
      name: 'Grape',
      category: 'Fruit',
      price: 2.0,
      quantity: 180,
      inStock: true,
    },
    {
      name: 'Honeydew',
      category: 'Fruit',
      price: 4.5,
      quantity: 20,
      inStock: false,
    },
    {
      name: 'Iceberg Lettuce',
      category: 'Vegetable',
      price: 1.5,
      quantity: 90,
      inStock: true,
    },
    {
      name: 'Jalapeño',
      category: 'Vegetable',
      price: 1.0,
      quantity: 60,
      inStock: true,
    },
  ],
};

// ============================================================================
// Stories
// ============================================================================

/**
 * Default DataVis grid with HTTP data source.
 *
 * > **Note:** This story requires `@mieweb/wcdatavis` to be installed.
 * > If it's not available, you'll see the error state.
 */
export const Default: Story = {
  args: {
    source: sampleHttpSource,
    gridOptions: {
      title: 'Iris Dataset',
    },
    height: 500,
  },
};

/**
 * DataVis with JSON data source and bordered variant.
 */
export const JsonData: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Produce Inventory',
    },
    variant: 'bordered',
    height: 400,
  },
};

/**
 * Card variant with shadow and no border.
 */
export const CardVariant: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Produce Inventory — Card Style',
    },
    variant: 'card',
    height: 400,
  },
};

/**
 * Small size preset for compact displays.
 */
export const SmallSize: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Compact Grid',
    },
    variant: 'bordered',
    size: 'sm',
    height: 350,
  },
};

/**
 * Large size preset for spacious displays.
 */
export const LargeSize: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Spacious Grid',
    },
    variant: 'bordered',
    size: 'lg',
    height: 500,
  },
};

/**
 * Loading state.
 */
export const Loading: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Loading Grid',
    },
    loading: true,
    height: 400,
  },
};

/**
 * Custom loading content.
 */
export const CustomLoading: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Loading Grid',
    },
    loading: true,
    loadingMessage: (
      <div className="text-primary-600 flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
        <span className="text-sm font-medium">Fetching data...</span>
      </div>
    ),
    height: 400,
  },
};

// ============================================================================
// Brand Stories
// ============================================================================

/**
 * BlueHive brand theme.
 */
export const BrandBlueHive: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'BlueHive Themed Grid',
    },
    brand: 'bluehive',
    variant: 'bordered',
    height: 400,
  },
};

/**
 * MIE Web brand theme.
 */
export const BrandMieWeb: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'MIE Web Themed Grid',
    },
    brand: 'mieweb',
    variant: 'bordered',
    height: 400,
  },
};

/**
 * Enterprise Health brand theme.
 */
export const BrandEnterpriseHealth: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Enterprise Health Themed Grid',
    },
    brand: 'enterprise-health',
    variant: 'bordered',
    height: 400,
  },
};

// ============================================================================
// Dark Mode Story
// ============================================================================

/**
 * Dark mode demonstration.
 * Toggle dark mode in your Storybook toolbar to see the theme switch.
 */
export const DarkMode: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Dark Mode Grid',
    },
    variant: 'bordered',
    height: 400,
  },
  decorators: [
    (Story) => (
      <div className="dark rounded-xl bg-neutral-950 p-6" data-theme="dark">
        <Story />
      </div>
    ),
  ],
};

/**
 * Side-by-side light and dark mode comparison.
 */
export const LightDarkComparison: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Theme Comparison',
    },
    variant: 'bordered',
    height: 350,
  },
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-500">
            Light Mode
          </h3>
          <div className="rounded-xl bg-white p-4">
            <Story />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-400">
            Dark Mode
          </h3>
          <div className="dark rounded-xl bg-neutral-950 p-4" data-theme="dark">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
};

// ============================================================================
// Callback Stories
// ============================================================================

/**
 * With event callbacks.
 */
export const WithCallbacks: Story = {
  args: {
    source: sampleJsonSource,
    gridOptions: {
      title: 'Grid with Callbacks',
    },
    variant: 'bordered',
    height: 400,
    onGridReady: (grid) => {
      console.log('DataVis grid ready:', grid);
    },
    onDataLoaded: (data) => {
      console.log('DataVis data loaded:', data);
    },
    onError: (error) => {
      console.error('DataVis error:', error);
    },
  },
};

/**
 * Error state demonstration (invalid source).
 */
export const ErrorState: Story = {
  args: {
    source: {
      type: 'unsupported_source_type',
    },
    gridOptions: {
      title: 'Error State Demo',
    },
    variant: 'bordered',
    height: 300,
  },
};

/**
 * Custom error message.
 */
export const CustomErrorMessage: Story = {
  args: {
    source: {
      type: 'unsupported_source_type',
    },
    gridOptions: {
      title: 'Custom Error',
    },
    errorMessage: (
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl">⚠️</span>
        <span className="text-foreground font-medium">Unable to load data</span>
        <span className="text-muted-foreground text-xs">
          Please check your network connection and try again.
        </span>
      </div>
    ),
    variant: 'bordered',
    height: 300,
  },
};
