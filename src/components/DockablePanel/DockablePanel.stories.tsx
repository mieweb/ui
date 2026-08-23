import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DockablePanel, type DockablePanelMode } from './DockablePanel';
import { Button } from '../Button';
import { Input } from '../Input';

const meta: Meta<typeof DockablePanel> = {
  title: 'Components/Overlays/DockablePanel',
  component: DockablePanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
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
                  className="size-2 shrink-0 rounded-full bg-primary"
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
              className="min-h-64 flex-1 rounded-lg border border-border bg-background p-3"
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
