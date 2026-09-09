import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DockablePanel, type DockablePanelMode } from './DockablePanel';
import { Button } from '../Button';
import { Input } from '../Input';

const meta: Meta<typeof DockablePanel> = {
  id: 'overlays-dockablepanel',
  title: 'Components/Overlays/DockablePanel',
  component: DockablePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

A dialog that owns the viewport while \`mode="full"\` and collapses to a bottom-end strip while \`mode="docked"\` — **without unmounting or resizing its content** (docking clips with \`overflow: hidden\`, so editors keep their state and layout). \`dockSummary\` labels the strip; \`dirty\` + \`discardMessage\` guard \`onClose\` against losing work. Portalled to \`container\` (default \`document.body\`).

### Use it when

- A long form or editor the user may need to set aside to look something up in the page, then resume exactly where they were.
- Unsaved changes must be protected from an accidental close.

### Don't use it when

- A quick task — \`Modal\`.
- The user wants to position the tool freely — \`FloatingWindow\`.
- Several should be open at once side by side; docked strips stack in one corner.

### Example

\`\`\`tsx
const [mode, setMode] = useState<'full' | 'docked'>('full');

<DockablePanel
  title="Encounter note"
  mode={mode}
  onModeChange={setMode}
  dirty={form.isDirty}
  dockSummary={\`\${patient.name} — draft\`}
  onClose={closeEncounter}
>
  <EncounterForm form={form} />
</DockablePanel>
\`\`\`

### Limitations

- In \`full\` mode it is modal: \`aria-modal\`, focus trap, and the background is made \`inert\` (reference-counted for overlapping panels). In \`docked\` mode it is deliberately **not** modal so the page stays usable.
- Mode changes are announced through a live region; the strip's accessible name is \`dockSummary\` — keep it meaningful.
- Layers at \`--mieweb-dockable-panel-z\` (default 45), below \`Modal\`'s 50, so a confirmation Modal can open above it.
- The docked strip is anchored to the bottom *end* corner (logical, so it mirrors in RTL) and goes full-width on small screens.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'overlays-modal',
          why: 'Modal always blocks; DockablePanel can be set aside as a strip without losing state.',
        },
        {
          type: 'alternative to',
          target: 'overlays-floatingwindow',
          why: 'FloatingWindow is dragged and resized; DockablePanel toggles between full and a docked strip.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'Title-bar controls are Buttons.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function ComposerExample() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DockablePanelMode>('full');
  const [subject, setSubject] = useState('');

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">The case behind the panel</h2>
      <p className="max-w-prose text-sm">
        Collapse the composer and this text stays selectable — a docked panel
        drops <code>aria-modal</code> and un-inerts the app. Press Escape with
        something typed to collapse; press it empty to close.
      </p>
      <Button
        onClick={() => {
          setMode('full');
          setOpen(true);
        }}
      >
        Compose letter
      </Button>

      {open && (
        <DockablePanel
          title="Compose letter"
          mode={mode}
          onModeChange={setMode}
          dirty={subject.trim().length > 0}
          dockSummary={
            <>
              <span className="truncate font-semibold">
                {subject || 'Untitled letter'}
              </span>
              {subject.trim() && (
                <span
                  className="bg-primary size-2 shrink-0 rounded-full"
                  aria-label="Unsaved changes"
                />
              )}
            </>
          }
          onClose={() => setOpen(false)}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            <Input
              label="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
            <textarea
              className="border-border bg-background min-h-64 flex-1 rounded-lg border p-3"
              placeholder="Dear…"
            />
          </div>
        </DockablePanel>
      )}
    </div>
  );
}

export const Composer: Story = {
  render: () => <ComposerExample />,
};

function ModalOnlyExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open</Button>
      {open && (
        <DockablePanel title="Full-screen form" onClose={() => setOpen(false)}>
          <div className="flex-1 overflow-y-auto p-4">
            <Input label="Name" />
          </div>
        </DockablePanel>
      )}
    </div>
  );
}

/** Without `onModeChange` there is no dock: the panel is a plain full-screen modal. */
export const ModalOnly: Story = {
  render: () => <ModalOnlyExample />,
};
