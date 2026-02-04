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

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
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
  tags: ['autodocs'],
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
