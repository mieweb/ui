import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTime } from 'luxon';
import { FreshnessBadge, FreshnessDot } from './FreshnessBadge';

const daysAgo = (n: number) => DateTime.now().minus({ days: n }).toISODate()!;

const meta: Meta<typeof FreshnessBadge> = {
  title: 'Components/Data Display/FreshnessBadge',
  component: FreshnessBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A recency chip that ages from success through warning to destructive — "Reviewed ' +
          '12d ago". Thresholds are configurable per use (default 90/180 days), so the same ' +
          'component covers source-registry review ages, sync statuses, and data-quality ' +
          'freshness. `FreshnessDot` is the compact variant for table cells; `freshnessLevel` ' +
          'and `daysSince` are exported for host logic.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    date: { description: 'The date being aged.', control: 'date' },
    thresholds: {
      description: 'Day cutoffs for fresh/aging (default 90/180).',
      control: false,
    },
    label: { description: 'Verb before the age.', control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { date: daysAgo(12) },
};

export const Levels: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <FreshnessBadge date={daysAgo(0)} />
      <FreshnessBadge date={daysAgo(120)} />
      <FreshnessBadge date={daysAgo(400)} />
    </div>
  ),
};

export const SyncStatus: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <FreshnessBadge
        date={daysAgo(0)}
        label="Synced"
        thresholds={{ fresh: 1, aging: 7 }}
      />
      <FreshnessBadge
        date={daysAgo(3)}
        label="Synced"
        thresholds={{ fresh: 1, aging: 7 }}
      />
      <FreshnessBadge
        date={daysAgo(30)}
        label="Synced"
        thresholds={{ fresh: 1, aging: 7 }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Tighter thresholds turn the same chip into a sync-status indicator.',
      },
    },
  },
};

export const Dots: Story = {
  render: () => (
    <table className="border-border w-72 border-collapse border text-sm">
      <tbody>
        {[
          { source: 'BLS SOII 2025', d: 20 },
          { source: 'State plan table', d: 150 },
          { source: 'Legacy import', d: 500 },
        ].map((row) => (
          <tr key={row.source}>
            <td className="border-border text-foreground border px-3 py-2">
              {row.source}
            </td>
            <td className="border-border border px-3 py-2 text-center">
              <FreshnessDot date={daysAgo(row.d)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The dot variant carries the same signal in table cells.',
      },
    },
  },
};
