import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { FilterSummaryBar } from './FilterSummaryBar';

const meta: Meta<typeof FilterSummaryBar> = {
  title: 'Components/Data Display/FilterSummaryBar',
  component: FilterSummaryBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The bar that anchors a filtered grid: "1,204 of 8,911 records — 3 filters active ' +
          '· Clear all". Hidden while idle unless `showWhenIdle`; tinted with the primary ' +
          'accent whenever filters or search narrow the view. All visible strings are ' +
          'overridable for i18n.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    filteredCount: {
      description: 'Rows visible after filtering.',
      control: 'number',
    },
    totalCount: {
      description: 'Total records before filtering.',
      control: 'number',
    },
    activeFilterCount: {
      description: 'Active filter conditions.',
      control: 'number',
    },
    hasSearchText: {
      description: 'Whether a search query is active.',
      control: 'boolean',
    },
    showWhenIdle: {
      description: 'Show even with nothing active.',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filteredCount: 1204,
    totalCount: 8911,
    activeFilterCount: 3,
    onClearAll: () => {},
  },
};

export const FiltersPlusSearch: Story = {
  args: {
    filteredCount: 42,
    totalCount: 8911,
    activeFilterCount: 2,
    hasSearchText: true,
    onClearAll: () => {},
  },
};

export const SearchOnly: Story = {
  args: {
    filteredCount: 310,
    totalCount: 8911,
    activeFilterCount: 0,
    hasSearchText: true,
    onClearAll: () => {},
  },
};

export const Idle: Story = {
  args: {
    filteredCount: 8911,
    totalCount: 8911,
    activeFilterCount: 0,
    showWhenIdle: true,
    onClearAll: () => {},
  },
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};

function InteractiveExample() {
  const [filters, setFilters] = useState(3);
  const filtered = Math.max(120, 8911 - filters * 2600);
  return (
    <div className="flex flex-col gap-3">
      <FilterSummaryBar
        filteredCount={filters > 0 ? filtered : 8911}
        totalCount={8911}
        activeFilterCount={filters}
        showWhenIdle
        onClearAll={() => setFilters(0)}
      />
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setFilters((f) => f + 1)}
      >
        Add a filter
      </Button>
    </div>
  );
}
