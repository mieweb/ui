import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from './Modal';
import { Button } from '../Button';
import { Input } from '../Input';
// Story-only import. Stories are not tsup entries, so this never reaches dist
// and `motion` stays an optional peer dependency for consumers.
import { MotionProvider } from '../../motion/MotionProvider';

const meta: Meta<typeof Modal> = {
  id: 'overlays-modal',
  title: 'Components/Overlays/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

The standard blocking dialog. Controlled by \`open\` / \`onOpenChange\`; centred over a dimmed backdrop on desktop and full-screen on small viewports; eight \`size\`s up to \`full\`. Build the content from the slots — \`ModalHeader\`, \`ModalTitle\` (an \`h2\` that becomes the dialog's label), \`ModalClose\`, \`ModalBody\` (scrolls), \`ModalFooter\` — so every dialog in the product has the same anatomy. \`closeOnOverlayClick\` and \`closeOnEscape\` default to \`true\`.

### Use it when

- A focused task interrupts the page and should be completed or cancelled before returning: edit a record, pick from a list, view details.
- The content is short enough to fit without the dialog itself scrolling much; put long content in \`ModalBody\`.

### Don't use it when

- The user must make a yes/no decision — \`AlertDialog\` fixes the buttons and disables casual dismissal.
- The task is secondary and the page should stay visible/usable beside it — \`Sheet\` (edge panel) or \`DockablePanel\` (can be docked while working).
- It is a long-lived tool the user drags around (a notes editor) — \`FloatingWindow\`.
- You are showing a hint — \`Tooltip\` / \`GlossaryTooltip\` / \`SourceTip\`.

### Example

\`\`\`tsx
<Modal open={open} onOpenChange={setOpen} size="lg">
  <ModalHeader>
    <ModalTitle>Edit contact</ModalTitle>
    <ModalClose />
  </ModalHeader>
  <ModalBody>
    <ContactForm id="contact-form" contact={contact} onSubmit={save} />
  </ModalBody>
  <ModalFooter>
    <ButtonGroup split>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button type="submit" form="contact-form">Save</Button>
    </ButtonGroup>
  </ModalFooter>
</Modal>
\`\`\`

The host owns \`open\`; keep form state in the form so closing discards it predictably.

### Limitations

- \`role="dialog"\` + \`aria-modal\`, labelled by \`ModalTitle\` (or pass \`aria-label\`). Focus is trapped and moved to the first focusable element on open; **focus is not returned to the trigger on close** — handle that in \`onOpenChange\` when it matters.
- Body scroll is locked while open (reference-counted, so nested modals are safe). Background content is not made \`inert\`.
- Fixed \`z-50\` layer, not portalled: render it outside any ancestor with \`transform\`/\`overflow\` or it will clip.
- Full-screen on mobile means the footer sits at the bottom of the viewport; test with the keyboard open.

### Motion

Transitions are CSS by default. An app that opts into [\`@mieweb/ui/motion\`](?path=/docs/foundations-motion--docs) gets spring transitions and a real **exit** animation — which the CSS path cannot do, because the dialog unmounts on close and leaves nothing to transition. See the **Motion** story below; nothing changes at the call site either way.

The one consequence the demo can't show: motion writes a \`transform\` on the dialog surface, so a \`position: fixed\` descendant is contained by it rather than the viewport.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'feedback-alertdialog',
          why: 'AlertDialog for a decision the user cannot skip; Modal for content and forms.',
        },
        {
          type: 'alternative to',
          target: 'overlays-sheet',
          why: 'Sheet slides from an edge and keeps the page in view; Modal centres and blocks it.',
        },
        {
          type: 'alternative to',
          target: 'overlays-floatingwindow',
          why: 'FloatingWindow is a draggable, resizable, long-lived tool window; Modal is a one-shot task.',
        },
        {
          type: 'alternative to',
          target: 'overlays-dockablepanel',
          why: 'DockablePanel can shrink to a strip so the user keeps working; Modal always blocks.',
        },
        {
          type: 'alternative to',
          target: 'data-display-timeline',
          why: "Modal is the general dialog with slots, focus trap and scroll lock; Timeline's OrderConfirmation is a fixed one-button success overlay without focus management.",
        },
        {
          type: 'composes with',
          target: 'foundations-motion',
          why: 'MotionProvider upgrades Modal to spring transitions and gives it a real exit animation, which the CSS path cannot do because the dialog unmounts on close.',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        className="flex min-h-[600px] items-center justify-center p-8"
        style={{ transform: 'translateZ(0)' }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full'],
    },
    closeOnOverlayClick: {
      control: 'boolean',
    },
    closeOnEscape: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function ModalDemo({
  size = 'md',
  ...props
}: Partial<React.ComponentProps<typeof Modal>>) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal open={open} onOpenChange={setOpen} size={size} {...props}>
        <ModalHeader>
          <ModalTitle>Modal Title</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <p className="text-muted-foreground">
            This is the modal content. You can put any content here including
            forms, text, images, or other components.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const Small: Story = {
  render: () => <ModalDemo size="sm" />,
};

export const Large: Story = {
  render: () => <ModalDemo size="lg" />,
};

export const ExtraLarge: Story = {
  render: () => <ModalDemo size="xl" />,
};

function ConfirmationModalDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Item
      </Button>
      <Modal open={open} onOpenChange={setOpen} size="sm">
        <ModalHeader>
          <ModalTitle>Confirm Delete</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <p className="text-muted-foreground">
            Are you sure you want to delete this item? This action cannot be
            undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export const ConfirmationDialog: Story = {
  render: () => <ConfirmationModalDemo />,
};

function FormModalDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add New User</Button>
      <Modal open={open} onOpenChange={setOpen} size="md">
        <ModalHeader>
          <ModalTitle>Add New User</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <form className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" />
            <Input label="Email" type="email" placeholder="john@example.com" />
            <Input label="Role" placeholder="Developer" />
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Add User</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export const FormModal: Story = {
  render: () => <FormModalDemo />,
};

function ScrollableModalDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Long Modal</Button>
      <Modal open={open} onOpenChange={setOpen} size="md">
        <ModalHeader>
          <ModalTitle>Terms of Service</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody className="max-h-[60vh] overflow-y-auto">
          <div className="text-muted-foreground space-y-4 text-sm">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Decline
          </Button>
          <Button onClick={() => setOpen(false)}>Accept</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export const ScrollableContent: Story = {
  render: () => <ScrollableModalDemo />,
};

function NoCloseOnOverlayDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        closeOnOverlayClick={false}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Important Notice</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-muted-foreground">
            This modal can only be closed by clicking the button below. Clicking
            outside will not close it.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setOpen(false)}>I Understand</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export const NoCloseOnOverlay: Story = {
  render: () => <NoCloseOnOverlayDemo />,
};

// ============================================================================
// Motion
// ============================================================================

/**
 * A/B harness for the motion opt-in.
 *
 * A side-by-side comparison is not possible here: `Modal` is `position: fixed`,
 * so two instances would sit on top of each other. One subject with a visible
 * switch is the arrangement that actually reads. Flipping the switch remounts
 * the dialog surface (`Animated` swaps element types), so compare by closing
 * with the switch set each way rather than flipping it mid-open.
 */
function MotionDemo() {
  const [motionEnabled, setMotionEnabled] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  return (
    <MotionProvider disabled={!motionEnabled}>
      <div className="flex items-center gap-3">
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMotionEnabled((enabled) => !enabled)}
          aria-pressed={motionEnabled}
        >
          Motion: {motionEnabled ? 'on' : 'off'}
        </Button>
      </div>
      <Modal open={open} onOpenChange={setOpen} size="md">
        <ModalHeader>
          <ModalTitle>Discard Draft</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <p className="text-muted-foreground">
            Close this with the switch set each way. Watch the close, not the
            open — the exit is the part the CSS path cannot do.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Discard</Button>
        </ModalFooter>
      </Modal>
    </MotionProvider>
  );
}

export const Motion: Story = {
  render: () => <MotionDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Modal under `@mieweb/ui/motion`. With motion on the dialog springs in and animates out; with it off it fades in and then disappears on the frame it closes, because the component unmounts and CSS has nothing left to transition. The provider is normally mounted once at the app root — it is local here so the comparison can be toggled. Call sites are unchanged either way.',
      },
    },
  },
};
