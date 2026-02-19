import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { AddContactModal, ContactFormData } from './AddContactModal';
import { Button } from '../Button/Button';

const meta: Meta<typeof AddContactModal> = {
  title: 'Feedback & Overlays/AddContactModal',
  component: AddContactModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A modal for adding or editing provider/employer contacts with fields for name, sex, position, degree, email, address, and custom fields.',
      },
      story: {
        inline: true,
        iframeHeight: 700,
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
    contact: {
      control: 'object',
      description: 'Existing contact data for editing',
    },
    onOpenChange: {
      action: 'onOpenChange',
    },
    onSave: {
      action: 'onSave',
    },
  },
  args: {
    open: true,
    title: 'Add Contact',
    showAddress: true,
    showCustomFields: true,
    showPhone: true,
    isSaving: false,
  },
};

export default meta;
type Story = StoryObj<typeof AddContactModal>;

// Interactive wrapper that syncs with args.open
function InteractiveWrapper({
  open: argOpen,
  onOpenChange,
  onSave,
  ...props
}: React.ComponentProps<typeof AddContactModal>) {
  const [open, setOpen] = useState(argOpen);
  const [savedContact, setSavedContact] = useState<ContactFormData | null>(
    null
  );

  // Sync with args when they change
  useEffect(() => {
    setOpen(argOpen);
  }, [argOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleSave = (contact: ContactFormData) => {
    console.log('Saved contact:', contact);
    setSavedContact(contact);
    setOpen(false);
    onSave?.(contact);
  };

  return (
    <div className="relative min-h-[700px] w-full">
      {!open && (
        <div className="space-y-4 p-4">
          <Button onClick={() => setOpen(true)}>Open Modal</Button>
          {savedContact && (
            <div className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <h4 className="mb-2 font-medium">Saved Contact:</h4>
              <pre className="overflow-auto text-sm">
                {JSON.stringify(savedContact, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      <AddContactModal
        {...props}
        open={open}
        onOpenChange={handleOpenChange}
        onSave={handleSave}
      />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
};

export const EditMode: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    title: 'Edit Contact',
    contact: {
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
    },
  },
};

export const MinimalFields: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    showAddress: false,
    showCustomFields: false,
    showPhone: false,
  },
};

export const WithPhoneOnly: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    showAddress: false,
    showCustomFields: false,
    showPhone: true,
  },
};

export const SavingState: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    isSaving: true,
  },
};

export const WithValidationErrors: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    contact: {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Click Save to see validation errors',
      },
    },
  },
};

export const ProviderContact: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    title: 'Provider Contact',
  },
};

export const Mobile: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
