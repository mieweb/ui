import type { Meta, StoryObj } from '@storybook/react-vite';
import { SourceTip } from './SourceTip';

const meta: Meta<typeof SourceTip> = {
  title: 'Components/Overlays & Popups/SourceTip',
  component: SourceTip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A hover card answering "what backs this claim?" — an eyebrow + heading, optional ' +
          'free-text provenance, and one-line source links. Use it where a numbered footnote ' +
          'would be overkill: stat tiles, table cells, inline facts. Trigger and card are ' +
          'phrasing content, so it is valid inside prose and table cells; the card portals ' +
          'to body and stays inside the viewport. On touch, a tap pins the card.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    heading: {
      description: "The claim the card explains — the card's heading.",
      control: 'text',
    },
    note: {
      description: 'Free-text provenance for facts no public URL can verify.',
      control: 'text',
    },
    sources: {
      description: 'Linked (or unlinked) one-line sources.',
      control: false,
    },
    eyebrow: {
      description: 'Eyebrow above the heading (default "Source").',
      control: 'text',
    },
    underline: {
      description: 'Dashed underline marking the trigger as a hoverable claim.',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'OSHA recordable incident rate',
    sources: [
      {
        label: 'BLS Survey of Occupational Injuries and Illnesses, 2023',
        url: 'https://www.bls.gov/iif/',
        sub: 'BLS',
      },
    ],
    underline: true,
    children: '2.4 per 100 FTE',
  },
  render: (args) => (
    <p className="text-foreground max-w-md text-sm leading-relaxed">
      Private-industry employers reported a recordable incident rate of{' '}
      <SourceTip {...args} /> last year, continuing a decade-long decline.
    </p>
  ),
};

export const MultipleSources: Story = {
  args: {
    heading: 'Annual cost of workplace injuries',
    note: 'Combines direct workers-compensation costs with indirect productivity losses.',
    sources: [
      {
        label: 'NSC Work Injury Costs, 2023',
        url: 'https://injuryfacts.nsc.org/work/costs/work-injury-costs/',
        sub: 'NSC',
      },
      {
        label: 'Liberty Mutual Workplace Safety Index',
        url: 'https://business.libertymutual.com/insights/2023-workplace-safety-index/',
        sub: '2023',
      },
      { label: 'Internal claims analysis', sub: 'FY24' },
    ],
    underline: true,
    children: '$167 billion',
  },
  render: (args) => (
    <p className="text-foreground max-w-md text-sm leading-relaxed">
      Workplace injuries cost U.S. employers <SourceTip {...args} /> a year.
    </p>
  ),
};

export const NoteOnly: Story = {
  args: {
    heading: 'Deployment footprint',
    note: 'Clients-in-Countries report, pulled 2026-07. No public source; verified internally.',
    eyebrow: 'Provenance',
    underline: true,
    children: '46 countries',
  },
  render: (args) => (
    <p className="text-foreground max-w-md text-sm leading-relaxed">
      The platform is deployed across <SourceTip {...args} /> today.
    </p>
  ),
};

export const InTableCell: Story = {
  render: () => (
    <table className="border-border w-96 border-collapse border text-sm">
      <thead>
        <tr className="bg-muted">
          <th className="border-border text-foreground border px-3 py-2 text-start">
            Metric
          </th>
          <th className="border-border text-foreground border px-3 py-2 text-start">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border-border text-foreground border px-3 py-2">
            TRIR
          </td>
          <td className="border-border text-foreground border px-3 py-2">
            <SourceTip
              heading="Total recordable incident rate"
              sources={[
                {
                  label: 'BLS SOII 2023, Table 1',
                  url: 'https://www.bls.gov/iif/',
                  sub: 'BLS',
                },
              ]}
            >
              2.4
            </SourceTip>
          </td>
        </tr>
        <tr>
          <td className="border-border text-foreground border px-3 py-2">
            DART
          </td>
          <td className="border-border text-foreground border px-3 py-2">
            <SourceTip
              heading="Days away, restricted, or transferred"
              sources={[
                {
                  label: 'BLS SOII 2023, Table 2',
                  url: 'https://www.bls.gov/iif/',
                  sub: 'BLS',
                },
              ]}
            >
              1.5
            </SourceTip>
          </td>
        </tr>
      </tbody>
    </table>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Table cells omit `underline` — the cell treatment signals hoverability instead.',
      },
    },
  },
};
