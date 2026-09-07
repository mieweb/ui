import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { FilterSummaryBar } from './FilterSummaryBar';

const meta: Meta<typeof FilterSummaryBar> = {
  id: 'data-display-filtersummarybar',
  title: 'Components/Data display/FilterSummaryBar',
  component: FilterSummaryBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **one-line answer to "why am I only seeing these rows?"** above a filtered grid or list: "1,204 of 8,911 records — 3 filters active · Clear all". It is pure presentation over four numbers the host already has — \`filteredCount\`, \`totalCount\` (optional; omit when unknown), \`activeFilterCount\`, \`hasSearchText\` — plus \`onClearAll\` for the reset button (omit it to hide the button). The bar renders \`null\` while nothing is narrowing the view unless \`showWhenIdle\`, in which case it shows only \`allVisibleLabel\`. Every visible string is a prop (\`recordLabel\` / \`recordsLabel\`, \`filterLabel\` / \`filtersLabel\`, \`activeLabel\`, \`searchActiveLabel\`, \`allVisibleLabel\`, \`clearLabel\`, \`ofLabel\`, \`plusSearchLabel\`).

### Use it when

- A \`DataVisNITRO\` grid, \`Table\` or card list has filters and/or a search box whose state lives in the host, and users lose track of what is hiding rows.
- You need a single, obvious "Clear all" that resets filters *and* search together.

### Don't use it when

- You want to show **which** filters are active as removable chips — this bar shows counts only; render your own chip row (or the grid's own filter UI) and keep this for the totals.
- There are no filters — an empty-state or a plain record count in the \`PageHeader\` is enough.
- The count belongs to a navigation shortcut ("Tasks 3") — \`CountBadge\`.

### Example

\`\`\`tsx
const [filters, setFilters] = useState<Filter[]>([]);
const [query, setQuery] = useState('');
const rows = useMemo(() => applyFilters(allRows, filters, query), [allRows, filters, query]);

<FilterSummaryBar
  filteredCount={rows.length}
  totalCount={allRows.length}
  activeFilterCount={filters.length}
  hasSearchText={query.trim().length > 0}
  onClearAll={() => { setFilters([]); setQuery(''); }}
  className="mb-3"
/>
<DataVisNITRO source={source} … />
\`\`\`

No internal state: the host owns filters, search and the reset.

### Limitations

- Accessibility: the summary is a \`role="status" aria-live="polite" aria-atomic\` span, so each change in counts is announced once — keep it out of loops that update on every keystroke if that is too chatty (debounce \`filteredCount\`). The filter icon is \`aria-hidden\`; the clear control is a real \`<button>\` with a visible label and focus ring.
- Numbers use \`toLocaleString()\` in the browser locale; the sentence order ("N of M records — 3 filters active + search") is fixed English grammar even when every word is translated. No pluralisation beyond the 1 / many switch.
- \`totalCount\` must be a finite number to render the "of M" part; \`0\` is shown as a real total.
- RTL: uses logical \`ms-auto\` for the button; text order follows the DOM.
- Theming: active state uses \`primary-300/500/700/800\` and \`primary-500/10\`; idle uses \`border-border bg-muted/60\`. Depends on \`lucide-react\` icons.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'grids-datavis-nitro',
          why: 'Sits above a NITRO grid to summarise how many rows the host-side filters and search leave visible, with one Clear all.',
        },
        {
          type: 'composes with',
          target: 'grids-table',
          why: 'Summarises host-side filtering of a static Table (filtered of total, N filters active) with a Clear all.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
