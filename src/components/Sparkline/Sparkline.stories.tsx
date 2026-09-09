import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTime } from 'luxon';
import { Sparkline, type SparklinePoint } from './Sparkline';

// Deterministic pseudo-random activity so visual baselines stay stable —
// values AND dates are fixed (anchored, not DateTime.now()) so labels and
// keys never drift between snapshot runs.
const ANCHOR = DateTime.fromISO('2026-08-22');

function thirtyDays(seed = 7): SparklinePoint[] {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: 30 }, (_, i) => {
    const d = ANCHOR.minus({ days: 29 - i });
    const quiet = rand() < 0.3;
    return {
      key: d.toISODate()!,
      label: d.toFormat('MMM d'),
      value: quiet ? 0 : Math.ceil(rand() * 12),
    };
  });
}

const meta: Meta<typeof Sparkline> = {
  id: 'grids-sparkline',
  title: 'Components/Grids/Sparkline',
  component: Sparkline,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A compact bar strip for activity over time — timelines, table rows, dashboard headers. Bars scale to the series maximum with a baseline stub for zero values. With \`onSelect\`, bars become toggle buttons for filtering the surrounding view to one bucket (\`selectedKey\` is controlled by the host).

### Use it when

- You need a glanceable trend next to a label or inside a row, with no axes, legend or tooltip chrome.
- The data is already bucketed (per day/week/month) by the host — the component does no date math, so it stays pure and dependency-free.

### Don't use it when

- Users must read exact values, compare series or change axes — use \`DataVisNitroGraph\`.
- The bucket count is large (hundreds); bars become sub-pixel. Aggregate first.
- You need a progress or load indicator — that is \`Progress\`, not a sparkline.

### Example

\`\`\`tsx
const [bucket, setBucket] = useState<string | null>(null);

<Sparkline
  ariaLabel="Orders per week"
  data={weeks.map((w) => ({ key: w.iso, label: w.label, value: w.count }))}
  selectedKey={bucket}
  onSelect={setBucket}
  formatValue={(p) => \`\${p.value} orders\`}
/>
<OrderList filterWeek={bucket} />
\`\`\`

### Limitations

- Exposes \`role="status"\` with \`aria-label\`; individual bar values are surfaced through titles, not a data table. Provide a textual summary for screen-reader users when the numbers matter.
- No axes, thresholds or negative values; heights are relative to the maximum in the series.
- Uses neutral tokens (\`bg-muted\`) so it inherits brand and dark mode; a highlighted bar uses the primary token.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'grids-datavis-nitro-graph',
          why: 'Graph for interactive charts with axes and peers; Sparkline for a dependency-free inline trend.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    data: {
      description: 'Pre-bucketed points in display order.',
      control: false,
    },
    selectedKey: { description: 'Highlighted point key.', control: false },
    onSelect: { description: 'Makes bars clickable toggles.', control: false },
    label: { description: 'Track label before the bars.', control: 'text' },
    height: { description: 'Bar track height in px.', control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: thirtyDays(), label: 'All activity' },
};

export const Selectable: Story = {
  render: (args) => <SelectableExample {...args} />,
  args: { data: thirtyDays(11), label: 'Calls' },
  parameters: {
    docs: {
      description: {
        story: 'Click a bar to filter to that day; click again to clear.',
      },
    },
  },
};

function SelectableExample(args: React.ComponentProps<typeof Sparkline>) {
  const [day, setDay] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Sparkline {...args} selectedKey={day} onSelect={setDay} />
      <p className="text-muted-foreground text-xs">
        {day ? `Filtered to ${day}` : 'Showing all days'}
      </p>
    </div>
  );
}

export const MultipleTracks: Story = {
  render: () => (
    <div className="border-border bg-card flex w-[36rem] flex-col gap-3 rounded-lg border p-4">
      <Sparkline data={thirtyDays(3)} label="Calls" height={24} />
      <Sparkline data={thirtyDays(19)} label="Emails" height={24} />
      <Sparkline data={thirtyDays(42)} label="Meetings" height={24} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stacked read-only tracks make a compact activity overview.',
      },
    },
  },
};
