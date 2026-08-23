import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTime } from 'luxon';
import { Sparkline, type SparklinePoint } from './Sparkline';

// Deterministic pseudo-random activity so visual baselines stay stable
function thirtyDays(seed = 7): SparklinePoint[] {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: 30 }, (_, i) => {
    const d = DateTime.now().minus({ days: 29 - i });
    const quiet = rand() < 0.3;
    return {
      key: d.toISODate()!,
      label: d.toFormat('MMM d'),
      value: quiet ? 0 : Math.ceil(rand() * 12),
    };
  });
}

const meta: Meta<typeof Sparkline> = {
  title: 'Components/Data Display/Sparkline',
  component: Sparkline,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A compact bar sparkline for activity-over-time strips. Bars scale to the series ' +
          'maximum with a baseline stub for zero values; with `onSelect`, bars become toggle ' +
          'buttons for filtering to one bucket. Data arrives pre-bucketed — the host owns ' +
          'date math — keeping the component pure. For full charting, use DataVis.',
      },
    },
  },
  tags: ['autodocs'],
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
