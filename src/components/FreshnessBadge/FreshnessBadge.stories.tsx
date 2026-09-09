import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTime } from 'luxon';
import { FreshnessBadge, FreshnessDot } from './FreshnessBadge';

const daysAgo = (n: number) => DateTime.now().minus({ days: n }).toISODate()!;

const meta: Meta<typeof FreshnessBadge> = {
  id: 'data-display-freshnessbadge',
  title: 'Components/Data display/FreshnessBadge',
  component: FreshnessBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **recency chip whose colour is computed, not chosen**: give it a \`date\` (ISO string or \`Date\`) and it renders "Reviewed 12d ago" bucketed into \`fresh\` → \`aging\` → \`stale\` (success → warning → destructive) by \`thresholds: { fresh, aging }\` in days (default 90 / 180). Unparseable dates render \`unknown\` (muted, "date unknown") rather than pretending. \`label\` swaps the verb ("Synced", "Updated"). \`FreshnessDot\` is the 8px \`role="img"\` variant for table cells and tooltip rows; \`freshnessLevel(date, thresholds)\` and \`daysSince(date)\` are exported so the host can sort or filter by the same buckets.

### Use it when

- Staleness is the signal: last review of a source, last sync of an integration, last update of a data-quality metric — anywhere the reader should notice that a date is getting old.
- Many rows need the same ageing rule; set \`thresholds\` once per use and every chip agrees.

### Don't use it when

- The state is a **category** the host already knows ("Active", "Draft") — \`Badge\` with a \`variant\`.
- The number is a **count** the user clicks — \`CountBadge\`.
- You need the full date, a timezone, or "in 3 days" (future) — this renders only \`today\` / \`yesterday\` / \`Nd ago\` and clamps future dates to 0 days; render the date with \`Text\` or your date formatter.

### Example

\`\`\`tsx
const SYNC_THRESHOLDS = { fresh: 1, aging: 7 };

<td><FreshnessBadge date={source.lastSyncedAt} label="Synced" thresholds={SYNC_THRESHOLDS} /></td>

// Sort stale rows first using the same buckets
const order = { stale: 0, unknown: 1, aging: 2, fresh: 3 };
rows.sort((a, b) => order[freshnessLevel(a.reviewedAt)] - order[freshnessLevel(b.reviewedAt)]);

// Tight cell
<FreshnessDot date={row.reviewedAt} />
\`\`\`

Stateless: the host supplies the date; the component recomputes on every render (there is no timer, so a page left open will not tick over at midnight).

### Limitations

- Accessibility: \`FreshnessBadge\` is a \`<span>\` with visible text and an \`aria-hidden\` icon — colour is redundant to the words. \`FreshnessDot\` is \`role="img"\` with \`aria-label\` and \`title\` "Fresh — Reviewed 12d ago".
- i18n: the age text (\`today\`, \`yesterday\`, \`Nd ago\`, \`date unknown\`) and the level names in the dot's label (Fresh / Aging / Stale / Unknown) are **hard-coded English**; only the verb \`label\` is a prop. Days are whole days via Luxon in the browser's zone.
- Theming: uses the semantic \`success\` / \`warning\` / \`destructive\` / \`muted\` tokens, so brands recolour it. Fixed 11px text; not sized.
- RTL: symmetric \`gap-1\` layout; no physical offsets.
- Depends on \`luxon\` and \`lucide-react\` icons.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'data-display-badge',
          why: 'FreshnessBadge computes its colour from a date and thresholds; Badge takes a variant you choose.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
  // Storybook's date control emits a numeric timestamp; normalize it back
  // to a Date so the component's string | Date contract holds.
  render: (args) => {
    const raw = args.date as string | number | Date;
    return (
      <FreshnessBadge
        {...args}
        date={typeof raw === 'number' ? new Date(raw) : raw}
      />
    );
  },
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
