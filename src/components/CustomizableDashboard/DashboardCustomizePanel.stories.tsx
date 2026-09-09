import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, ClipboardList, Pill, Users, Bell } from 'lucide-react';
import { Button } from '../Button';
import {
  DashboardCustomizePanel,
  type WidgetDefinition,
} from './DashboardCustomizePanel';

const meta: Meta<typeof DashboardCustomizePanel> = {
  id: 'dashboards-dashboardcustomizepanel',
  title: 'Modules/Dashboards/DashboardCustomizePanel',
  component: DashboardCustomizePanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**The "which widgets do I see" side panel.** A \`Sheet\` (\`side="end"\`) listing \`widgets: WidgetDefinition[]\` (\`{ id, title, description?, icon?, category? }\`) grouped under \`category\` headings, each row with a \`Switch\` bound to \`hiddenIds\`; \`onToggleWidget(id, visible)\` reports flips, \`onReset\` (optional) adds a "Reset layout" footer button, \`open\` / \`onOpenChange\` control visibility, \`title\` / \`description\` override the heading copy. A "N of M widgets shown" line summarises state. Fully controlled — it holds no visibility state of its own.

### Use it when

- You render your own dashboard shell (a fixed grid, a different DnD library, server-side prefs) but want the same show/hide UX as \`CustomizableDashboard\`.
- The trigger lives somewhere other than the dashboard toolbar (a settings menu, a page header).

### Don't use it when

- You already use \`CustomizableDashboard\` with \`widgets\` — it renders and wires this panel itself.
- Users must also **reorder** widgets in the panel — rows are not draggable; ordering is the grid's job.
- Widgets have settings beyond visible / hidden — there is no per-row configuration slot; open a \`Modal\` from your own row UI instead.

### Example

\`\`\`tsx
const [open, setOpen] = useState(false);
const [hidden, setHidden] = useLocalStorageState<string[]>('home-dashboard-hidden', []);

<Button variant="outline" onClick={() => setOpen(true)} aria-haspopup="dialog">Customize</Button>
<DashboardCustomizePanel
  open={open}
  onOpenChange={setOpen}
  widgets={WIDGET_CATALOG}
  hiddenIds={hidden}
  onToggleWidget={(id, visible) =>
    setHidden((prev) => (visible ? prev.filter((h) => h !== id) : [...prev, id]))
  }
  onReset={() => setHidden([])}
/>

<div className="grid gap-3 lg:grid-cols-3">
  {WIDGET_CATALOG.filter((w) => !hidden.includes(w.id)).map((w) => <w.render key={w.id} />)}
</div>
\`\`\`

The host filters its own grid by \`hidden\`; the panel is purely a view of that array.

### Limitations

- Accessibility: inherits \`Sheet\` — \`role="dialog"\` + \`aria-modal\`, focus trapped, Escape closes, **focus not returned to the trigger** and body scroll not locked; the Sheet gets \`aria-label={title}\`. Each \`Switch\` is labelled \`"Show {title}"\`; category headings are \`<h3>\`s regardless of page outline; the summary line is static text (not a live region).
- No search / filter — long catalogs scroll inside \`SheetBody\`. No reorder, no per-widget settings, no "select all".
- i18n: hard-coded English \`"Customize dashboard"\`, the default \`description\`, \`"N of M widgets shown"\`, \`"Show …"\`, \`"Reset layout"\`; only \`title\` and \`description\` are props.
- RTL: \`side="end"\` is logical (mirrors); row layout is symmetric flex. Theming: semantic tokens plus \`text-primary-600/400\` on visible icons.
- Uses \`Sheet\`, \`Switch\`, \`Button\` and \`lucide-react\` (\`RotateCcw\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'overlays-sheet',
          why: 'The panel is a Sheet (side="end") and inherits its dialog semantics, focus trap and Escape handling.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-switch',
          why: 'Each widget row toggles visibility with a labelled Switch.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    widgets: {
      description: 'The full widget catalog for the dashboard.',
      control: false,
    },
    hiddenIds: {
      description: 'Ids of widgets currently hidden.',
      control: false,
    },
    title: { description: 'Panel heading.', control: 'text' },
    description: {
      description: 'Supporting copy under the heading.',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const WIDGETS: WidgetDefinition[] = [
  {
    id: 'demographics',
    title: 'Demographics',
    description: 'Patient identity and contact details',
    icon: <Users aria-hidden="true" className="h-4 w-4" />,
    category: 'Chart',
  },
  {
    id: 'vitals',
    title: 'Vitals',
    description: 'Latest recorded vital signs',
    icon: <Activity aria-hidden="true" className="h-4 w-4" />,
    category: 'Chart',
  },
  {
    id: 'medications',
    title: 'Medications',
    description: 'Active medication list',
    icon: <Pill aria-hidden="true" className="h-4 w-4" />,
    category: 'Chart',
  },
  {
    id: 'orders',
    title: 'Open Orders',
    description: 'Pending and scheduled orders',
    icon: <ClipboardList aria-hidden="true" className="h-4 w-4" />,
    category: 'Workflow',
  },
  {
    id: 'reminders',
    title: 'Reminders',
    icon: <Bell aria-hidden="true" className="h-4 w-4" />,
    category: 'Workflow',
  },
];

export const Default: Story = {
  render: (args) => <PanelExample {...args} />,
  args: { widgets: WIDGETS },
};

function PanelExample(
  args: React.ComponentProps<typeof DashboardCustomizePanel>
) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<string[]>(['reminders']);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Customize dashboard</Button>
      <DashboardCustomizePanel
        {...args}
        open={open}
        onOpenChange={setOpen}
        hiddenIds={hidden}
        onToggleWidget={(id, visible) =>
          setHidden((prev) =>
            visible ? prev.filter((h) => h !== id) : [...prev, id]
          )
        }
        onReset={() => setHidden([])}
      />
    </>
  );
}
