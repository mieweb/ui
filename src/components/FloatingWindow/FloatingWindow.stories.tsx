import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FloatingWindow, MinimizedWindow } from './FloatingWindow';
import { Button } from '../Button';

const meta: Meta<typeof FloatingWindow> = {
  id: 'overlays-floatingwindow',
  title: 'Components/Overlays/FloatingWindow',
  component: FloatingWindow,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

A presentational window shell for pop-out editors (notes, letters, scratch pads): title bar with minimise / pop-out / close, optional \`footer\`, and — when \`draggable\` — free positioning plus edge and corner resizing (\`defaultWidth\`/\`defaultHeight\`, \`minWidth\`/\`minHeight\`). Fully controlled: \`open\`, \`minimized\`, \`onClose\`, \`onMinimize\`, \`onPopOut\` come from your store, so several windows can coexist.

### Use it when

- A long-lived tool the user moves around while reading the page underneath: a document editor beside a chart, a dictation pad.
- Window state must survive route changes or be restored later (the host owns it).

### Don't use it when

- A one-shot task — \`Modal\`.
- The tool should collapse to a strip rather than be dragged — \`DockablePanel\` keeps its content mounted and offers dirty-state protection.
- On touch/small screens: dragging and resizing need a pointer. Render it non-draggable (centred, modal-style) there.

### Example

\`\`\`tsx
const win = useWindowStore('note-editor'); // { open, minimized, ... }

<FloatingWindow
  open={win.open}
  minimized={win.minimized}
  draggable
  title="Progress note"
  onClose={win.close}
  onMinimize={win.toggleMinimized}
  footer={<Button onClick={save}>Save</Button>}
>
  <RichEditor value={note} onChange={setNote} />
</FloatingWindow>
\`\`\`

### Limitations

- \`role="dialog"\`; \`aria-modal\` is set only in the non-draggable (centred) mode. **No focus trap and no Escape handling** — add \`useEscapeKey\` in the host if wanted.
- Drag/resize math is manual (see the module's MAINTAINERS notes); it uses physical coordinates, so RTL mirroring is not applied to the initial position.
- Fixed positioning at the library z-layer; renders inline (no portal).
- \`minimized\` renders nothing at all — the host must keep the editor's state and show its own restore affordance (a chip in the header, for example).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'overlays-modal',
          why: 'Modal is a one-shot blocking task; FloatingWindow is a movable tool the user keeps open.',
        },
        {
          type: 'alternative to',
          target: 'overlays-dockablepanel',
          why: 'DockablePanel collapses to a strip and protects unsaved work; FloatingWindow is freely positioned.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
