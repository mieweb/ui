import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RowActionToolbar, RowIconButton } from './RowActionToolbar';
import { PencilIcon, TrashIcon, CheckIcon, CopyIcon } from '../Icons';

const meta: Meta<typeof RowActionToolbar> = {
  id: 'actions-rowactiontoolbar',
  title: 'Inputs/Actions/RowActionToolbar',
  component: RowActionToolbar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

Per-row actions for lists: a \`role="toolbar"\` of ghost icon buttons (\`RowIconButton\` = \`Button\` + \`Tooltip\` + \`aria-label\`) that **floats over the row's end edge on hover-capable devices and is hidden until the row is hovered or focused**. On touch devices there is no hover, so the toolbar stays in flow at the end of the row and is always visible. Arrow keys, Home and End move between the buttons (WAI-ARIA toolbar pattern via \`toolbarKeyNav\`).

### Use it when

- Every row of a clinical or record list has the same two-to-five actions (edit, resolve, delete…) and showing them permanently would clutter the row.
- Inside a \`DataVisNitroGrid\` cell: pass \`group="grid"\` and render it from \`formatCell\`; the toolbar then reveals when the grid row (\`.wcdv-tr\`) is hovered and stays in flow because the column reserves its space.
- Rows are nested inside another hoverable group (orders under a problem): pass \`group="order"\` and give the inner row \`group/order\` so hovering the outer block does not reveal every nested toolbar.

### Don't use it when

- The actions are labelled buttons in a form or dialog footer — use \`ButtonGroup\`.
- There is only one action and it should always be visible (a link, a \`CopyButton\`).
- The row itself is not interactive and the actions are the primary content; hidden-until-hover fails discoverability there.

### Example

The parent row must be \`relative\` and carry the matching \`group\` class.

\`\`\`tsx
<li className="group relative flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted">
  <span className="flex-1">{allergy.allergen}</span>
  <RowActionToolbar label={\`Actions for \${allergy.allergen}\`}>
    <RowIconButton label="Correct" icon={PencilIcon} onClick={() => onEdit(allergy)} />
    <RowIconButton label="Mark inactive" icon={CheckIcon} onClick={() => onResolve(allergy)} />
    <RowIconButton label="Delete" icon={TrashIcon} onClick={() => onDelete(allergy)} />
  </RowActionToolbar>
</li>
\`\`\`

\`AllergyList\`, \`MedicationList\`, \`ProblemList\`, \`PresentingProblems\` and \`Assessment\` all use it this way.

### Limitations

- Hover reveal depends on the \`pointer-fine\` media variant and the parent's \`group\` class; forgetting \`relative\` on the row makes the overlay escape.
- Buttons stop click propagation so a clickable row does not fire; keyboard activation inside the toolbar does the same.
- The accessible name comes from \`label\` — make it specific ("Actions for penicillin"), and translate button labels in the host.
- Physical \`right-*\` alignment is used for the overlay; RTL layouts currently place it on the right edge rather than the logical end.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'actions-buttongroup',
          why: 'ButtonGroup lays out labelled actions; RowActionToolbar hides icon actions until the row is hovered or focused.',
        },
        {
          type: 'composes with',
          target: 'grids-datavis-nitro',
          why: 'Rendered from formatCell with group="grid" to give NITRO rows hover-revealed actions.',
        },
        {
          type: 'composes with',
          target: 'grids-table',
          why: 'Drop into the last cell of a relative group row for per-row actions.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'RowIconButton is an icon-size ghost Button.',
        },
        {
          type: 'uses',
          target: 'overlays-tooltip',
          why: 'Each RowIconButton shows its label in a Tooltip.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    label: {
      control: 'text',
      description:
        'Accessible name of the toolbar, e.g. "Actions for penicillin".',
    },
    align: {
      control: 'select',
      options: ['center', 'top'],
      description:
        'Overlay alignment on fine-pointer devices: centred on the row (single-line) or pinned to the top corner (multi-line rows).',
    },
    group: {
      control: 'select',
      options: ['row', 'order', 'grid'],
      description:
        'Which hover scope reveals the toolbar: the `group` row, a nested `group/order` row, or a NITRO grid row.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RowActionToolbar>;

const rows = [
  { id: 'a1', name: 'Penicillin', detail: 'Hives · moderate' },
  { id: 'a2', name: 'Peanuts', detail: 'Anaphylaxis · severe' },
  { id: 'a3', name: 'Latex', detail: 'Contact dermatitis · mild' },
];

function DemoList({
  align,
  label,
}: {
  align?: 'center' | 'top';
  label?: string;
}) {
  const [log, setLog] = useState<string[]>([]);
  const act = (what: string, name: string) =>
    setLog((l) => [`${what}: ${name}`, ...l].slice(0, 4));
  return (
    <div className="max-w-md space-y-3">
      <ul className="divide-border divide-y rounded-md border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="group hover:bg-muted relative flex items-start gap-3 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium">{row.name}</div>
              <div className="text-muted-foreground text-sm">{row.detail}</div>
            </div>
            <RowActionToolbar
              align={align}
              label={label ?? `Actions for ${row.name}`}
            >
              <RowIconButton
                label="Correct"
                icon={PencilIcon}
                onClick={() => act('Correct', row.name)}
              />
              <RowIconButton
                label="Copy"
                icon={CopyIcon}
                onClick={() => act('Copy', row.name)}
              />
              <RowIconButton
                label="Mark inactive"
                icon={CheckIcon}
                onClick={() => act('Inactive', row.name)}
              />
              <RowIconButton
                label="Delete"
                icon={TrashIcon}
                onClick={() => act('Delete', row.name)}
              />
            </RowActionToolbar>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        Hover or Tab into a row to reveal its actions; ←/→ move between them.
        {log.length > 0 && ` Last: ${log[0]}`}
      </p>
    </div>
  );
}

/** Hover or focus a row to reveal the toolbar; on touch devices it is always visible. */
export const Default: Story = {
  render: (args) => <DemoList align={args.align} label={args.label} />,
};

/** `align="top"` pins the overlay to the row's top corner for multi-line rows. */
export const TopAligned: Story = {
  args: { align: 'top' },
  render: (args) => <DemoList align={args.align} />,
};

function PinnableRow() {
  const [pinned, setPinned] = useState(false);
  return (
    <div className="group hover:bg-muted relative flex max-w-md items-center gap-3 rounded-md border px-3 py-2">
      <span className="flex-1">Penicillin</span>
      <RowActionToolbar label="Actions for Penicillin">
        <RowIconButton
          label={pinned ? 'Unpin' : 'Pin'}
          icon={CheckIcon}
          active={pinned}
          onClick={() => setPinned((p) => !p)}
        />
        <RowIconButton label="Delete" icon={TrashIcon} onClick={() => {}} />
      </RowActionToolbar>
    </div>
  );
}

/** An `active` RowIconButton renders `aria-pressed` with a tinted background — for pin/favourite style toggles. */
export const WithActiveState: Story = {
  render: () => <PinnableRow />,
};
