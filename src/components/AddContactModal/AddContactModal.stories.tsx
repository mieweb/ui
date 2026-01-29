import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AddContactModal, ContactFormData } from './AddContactModal';
import { Button } from '../Button/Button';

const meta: Meta<typeof AddContactModal> = {
  title: 'Components/AddContactModal',
  component: AddContactModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A modal for adding or editing provider/employer contacts with fields for name, sex, position, degree, email, address, and custom fields.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
    showAddress: {
      control: 'boolean',
      description: 'Whether to show address fields',
    },
    showCustomFields: {
      control: 'boolean',
      description: 'Whether to show custom fields section',
    },
    showPhone: {
      control: 'boolean',
      description: 'Whether to show phone field',
    },
    isSaving: {
      control: 'boolean',
      description: 'Whether save is in progress',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AddContactModal>;

// Interactive wrapper for stories
function AddContactModalWrapper(props: Partial<React.ComponentProps<typeof AddContactModal>>) {
  const [open, setOpen] = useState(false);
  const [savedContact, setSavedContact] = useState<ContactFormData | null>(null);

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Add Contact</Button>
      
      <AddContactModal
        open={open}
        onOpenChange={setOpen}
        onSave={(contact) => {
          console.log('Saved contact:', contact);
          setSavedContact(contact);
          setOpen(false);
        }}
        {...props}
      />

      {savedContact && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Saved Contact:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(savedContact, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Wrapper for EditMode story
function EditModeWrapper() {
  const [open, setOpen] = useState(true);

  return (
    <AddContactModal
      open={open}
      onOpenChange={setOpen}
      onSave={(contact) => {
        console.log('Updated contact:', contact);
        setOpen(false);
      }}
      contact={{
        id: '123',
        firstName: 'Jane',
        lastName: 'Smith',
        sex: 'F',
        positionTitle: 'Office Manager',
        degree: 'MBA',
        email: 'jane.smith@example.com',
        phone: '(555) 123-4567',
        address: {
          street1: '123 Main St',
          street2: 'Suite 100',
          city: 'Fort Wayne',
          state: 'IN',
          postalCode: '46802',
        },
        customFields: [
          { name: 'Extension', value: '1234' },
          { name: 'Department', value: 'Administration' },
        ],
      }}
    />
  );
}

// Wrapper for SavingState story
function SavingStateWrapper() {
  const [open, setOpen] = useState(true);

  return (
    <AddContactModal
      open={open}
      onOpenChange={setOpen}
      onSave={() => {}}
      isSaving={true}
    />
  );
}

// Wrapper for WithValidationErrors story
function WithValidationErrorsWrapper() {
  const [open, setOpen] = useState(true);

  return (
    <AddContactModal
      open={open}
      onOpenChange={setOpen}
      onSave={(contact) => {
        console.log('Saved contact:', contact);
        setOpen(false);
      }}
      contact={{
        firstName: '',
        lastName: '',
        email: 'invalid-email',
      }}
    />
  );
}

export const Default: Story = {
  render: (args) => <AddContactModalWrapper {...args} />,
  args: {
    title: 'Add Contact',
    showAddress: true,
    showCustomFields: true,
    showPhone: true,
  },
};

export const EditMode: Story = {
  render: () => <EditModeWrapper />,
};

export const MinimalFields: Story = {
  render: (args) => <AddContactModalWrapper {...args} />,
  args: {
    title: 'Add Contact',
    showAddress: false,
    showCustomFields: false,
    showPhone: false,
  },
};

export const WithPhoneOnly: Story = {
  render: (args) => <AddContactModalWrapper {...args} />,
  args: {
    title: 'Add Contact',
    showAddress: false,
    showCustomFields: false,
    showPhone: true,
  },
};

export const SavingState: Story = {
  render: () => <SavingStateWrapper />,
};

export const WithValidationErrors: Story = {
  render: () => <WithValidationErrorsWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Try clicking Save to see validation errors',
      },
    },
  },
};

export const ProviderContact: Story = {
  render: (args) => <AddContactModalWrapper {...args} />,
  args: {
    title: 'Provider Contact',
    showAddress: true,
    showCustomFields: true,
    showPhone: true,
  },
};

export const Mobile: Story = {
  render: (args) => <AddContactModalWrapper {...args} />,
  args: {
    title: 'Add Contact',
    showAddress: true,
    showCustomFields: true,
    showPhone: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
