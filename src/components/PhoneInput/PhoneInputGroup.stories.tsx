import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { PhoneInputGroup, type PhoneEntry } from './PhoneInput';

const meta: Meta<typeof PhoneInputGroup> = {
  title: 'Components/PhoneInputGroup',
  component: PhoneInputGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A group of phone inputs with type selection and add/remove functionality. Supports multiple phone entries with different types (cell, landline, home, work, fax).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PhoneInputGroup>;

// Default story with controlled state
function PhoneInputGroupExample(
  props: Partial<React.ComponentProps<typeof PhoneInputGroup>>
) {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
  ]);

  return <PhoneInputGroup {...props} value={phones} onChange={setPhones} />;
}

export const Default: Story = {
  render: (args) => <PhoneInputGroupExample {...args} />,
  args: {
    label: 'Phone Number',
    required: true,
  },
};

// Pre-filled with multiple phones
function PrefilledExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '(555) 123-4567', type: 'cell' },
    { number: '(555) 987-6543', type: 'work' },
    { number: '(555) 111-2222', type: 'fax' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      label="Phone Numbers"
    />
  );
}

export const Prefilled: Story = {
  render: () => <PrefilledExample />,
  parameters: {
    docs: {
      description: {
        story: 'Phone input group with multiple pre-filled entries.',
      },
    },
  },
};

// With validation
function WithValidationExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      label="Phone Number"
      validateOnBlur
      required
    />
  );
}

export const WithValidation: Story = {
  render: () => <WithValidationExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Phone inputs with validation on blur. Tab out of an incomplete field to see validation.',
      },
    },
  },
};

// Disabled state
function DisabledWrapper() {
  const [phones] = useState<PhoneEntry[]>([
    { number: '(555) 123-4567', type: 'cell' },
    { number: '(555) 987-6543', type: 'work' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={() => {}}
      disabled
      label="Phone Numbers"
    />
  );
}

export const Disabled: Story = {
  render: () => <DisabledWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Disabled phone input group.',
      },
    },
  },
};

// With custom min/max entries
function MinMaxExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
    { number: '', type: 'work' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      minEntries={2}
      maxEntries={3}
      label="Phone Numbers"
    />
  );
}

export const MinMaxEntries: Story = {
  render: () => <MinMaxExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Minimum 2 entries, maximum 3 entries. Cannot remove below 2 or add above 3.',
      },
    },
  },
};

// Custom type labels (i18n)
function CustomLabelsExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      label="Numéro de téléphone"
      typeLabels={{
        cell: 'Portable',
        landline: 'Fixe',
        home: 'Domicile',
        work: 'Travail',
        fax: 'Fax',
      }}
    />
  );
}

export const CustomTypeLabels: Story = {
  render: () => <CustomLabelsExample />,
  parameters: {
    docs: {
      description: {
        story: 'Phone type labels can be customized for internationalization.',
      },
    },
  },
};

// Mobile viewport
export const Mobile: Story = {
  render: (args) => <PhoneInputGroupExample {...args} />,
  args: {
    label: 'Phone Number',
    required: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Phone input group on mobile viewport.',
      },
    },
  },
};
