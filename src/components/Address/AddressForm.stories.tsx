import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { AddressForm, type AddressFormData } from './AddressForm';

const meta: Meta<typeof AddressForm> = {
  title: 'Inputs & Controls/AddressForm',
  component: AddressForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A complete address form with support for Google Places autocomplete. Includes standard US address fields (street, city, state, zip) with optional county and country fields.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AddressForm>;

// Default story with controlled state
function AddressFormExample(
  props: Partial<React.ComponentProps<typeof AddressForm>>
) {
  const [address, setAddress] = useState<Partial<AddressFormData>>({});

  return (
    <div className="space-y-4">
      <AddressForm {...props} value={address} onChange={setAddress} />
      <div className="border-t pt-4">
        <h4 className="mb-2 text-sm font-medium text-gray-500">Form Data:</h4>
        <pre className="rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">
          {JSON.stringify(address, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (args) => <AddressFormExample {...args} />,
  args: {
    required: true,
  },
};

// Pre-filled address
function PrefilledExample() {
  const [address, setAddress] = useState<Partial<AddressFormData>>({
    street1: '123 Healthcare Way',
    street2: 'Suite 500',
    city: 'Indianapolis',
    state: 'IN',
    postalCode: '46220',
    country: 'US',
  });

  return <AddressForm value={address} onChange={setAddress} showCountry />;
}

export const Prefilled: Story = {
  render: () => <PrefilledExample />,
  parameters: {
    docs: {
      description: {
        story: 'Address form with pre-filled values.',
      },
    },
  },
};

// With county field
function WithCountyExample() {
  const [address, setAddress] = useState<Partial<AddressFormData>>({
    street1: '456 Main Street',
    city: 'Carmel',
    state: 'IN',
    postalCode: '46032',
    county: 'Hamilton',
    country: 'US',
  });

  return (
    <AddressForm
      value={address}
      onChange={setAddress}
      showCounty
      showCountry
      required
    />
  );
}

export const WithCounty: Story = {
  render: () => <WithCountyExample />,
  parameters: {
    docs: {
      description: {
        story: 'Address form with county field enabled.',
      },
    },
  },
};

// With validation errors
function WithErrorsExample() {
  const [address, setAddress] = useState<Partial<AddressFormData>>({
    street1: '',
    city: '',
    state: 'XY',
    postalCode: 'invalid',
  });

  const errors = {
    street1: 'Street address is required',
    city: 'City is required',
    state: 'Invalid state code',
    postalCode: 'Invalid ZIP code format',
  };

  return (
    <AddressForm
      value={address}
      onChange={setAddress}
      errors={errors}
      required
    />
  );
}

export const WithErrors: Story = {
  render: () => <WithErrorsExample />,
  parameters: {
    docs: {
      description: {
        story: 'Address form showing validation errors.',
      },
    },
  },
};

// Disabled state
function DisabledWrapper() {
  const [address] = useState<Partial<AddressFormData>>({
    street1: '123 Healthcare Way',
    street2: 'Suite 500',
    city: 'Indianapolis',
    state: 'IN',
    postalCode: '46220',
    country: 'US',
  });

  return (
    <AddressForm value={address} onChange={() => {}} disabled showCountry />
  );
}

export const Disabled: Story = {
  render: () => <DisabledWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Disabled address form.',
      },
    },
  },
};

// Custom labels (i18n)
function CustomLabelsExample() {
  const [address, setAddress] = useState<Partial<AddressFormData>>({});

  return (
    <AddressForm
      value={address}
      onChange={setAddress}
      labels={{
        street1: 'Adresse ligne 1',
        street2: 'Adresse ligne 2',
        city: 'Ville',
        state: 'État',
        postalCode: 'Code postal',
        country: 'Pays',
      }}
      placeholders={{
        street1: 'Rue et numéro',
        street2: 'Appartement, suite (optionnel)',
        city: 'Nom de la ville',
        state: 'XX',
        postalCode: '00000',
        country: 'France',
      }}
      showCountry
    />
  );
}

export const CustomLabels: Story = {
  render: () => <CustomLabelsExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Address form with custom labels for internationalization (French example).',
      },
    },
  },
};

// Mobile viewport
export const Mobile: Story = {
  render: (args) => <AddressFormExample {...args} />,
  args: {
    required: true,
    showCounty: true,
    showCountry: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Address form on mobile viewport with responsive layout.',
      },
    },
  },
};

// Google Places note
function GooglePlacesInfoWrapper() {
  const [address, setAddress] = useState<Partial<AddressFormData>>({});

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-200">
          Google Places Autocomplete
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          To enable Google Places autocomplete, pass the{' '}
          <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
            googlePlaces
          </code>{' '}
          prop:
        </p>
        <pre className="mt-2 overflow-auto rounded bg-blue-100 p-2 text-xs dark:bg-blue-800">
          {`<AddressForm
  value={address}
  onChange={setAddress}
  googlePlaces={{
    enabled: true,
    componentRestrictions: { country: 'us' },
    onPlaceSelect: (place) => console.log(place),
  }}
/>`}
        </pre>
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          Note: Requires Google Maps JavaScript API with Places library loaded
          in your app.
        </p>
      </div>
      <AddressForm value={address} onChange={setAddress} required />
    </div>
  );
}

export const GooglePlacesInfo: Story = {
  render: () => <GooglePlacesInfoWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Information about enabling Google Places autocomplete.',
      },
    },
  },
};
