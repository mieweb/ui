import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FloatingWindow, MinimizedWindow } from './FloatingWindow';
import { Button } from '../Button';

const meta: Meta<typeof FloatingWindow> = {
  title: 'Components/Overlays/FloatingWindow',
  component: FloatingWindow,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function SampleBody() {
  return (
    <div className="space-y-3 p-6">
      <p className="text-muted-foreground text-sm">
        Drag the edges or corners to resize the window. The body scrolls when
        content overflows.
      </p>
      {Array.from({ length: 12 }).map((_, i) => (
        <p key={i} className="text-sm">
          Line {i + 1} of editable content goes here.
        </p>
      ))}
    </div>
  );
}

function CenteredExample() {
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="h-screen p-4">
      <Button onClick={() => setOpen(true)}>Open note window</Button>
      {minimized && (
        <div className="fixed bottom-4 left-4">
          <MinimizedWindow
            title="Encounter Note"
            onRestore={() => setMinimized(false)}
            onClose={() => {
              setMinimized(false);
              setOpen(false);
            }}
          />
        </div>
      )}
      <FloatingWindow
        open={open}
        minimized={minimized}
        title="Encounter Note"
        onClose={() => setOpen(false)}
        onMinimize={() => setMinimized(true)}
        onPopOut={() => undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save Note</Button>
          </>
        }
      >
        <SampleBody />
      </FloatingWindow>
    </div>
  );
}

export const Centered: Story = {
  render: () => <CenteredExample />,
};

function DraggableExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="h-screen p-4">
      <Button onClick={() => setOpen(true)}>Open letter window</Button>
      <FloatingWindow
        open={open}
        draggable
        title="Letter Editor"
        defaultWidth={900}
        defaultHeight={520}
        onClose={() => setOpen(false)}
        onMinimize={() => undefined}
        onPopOut={() => undefined}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="outline" size="sm">
              Save as Template
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Save Draft
              </Button>
            </div>
          </div>
        }
      >
        <SampleBody />
      </FloatingWindow>
    </div>
  );
}

export const Draggable: Story = {
  render: () => <DraggableExample />,
};
