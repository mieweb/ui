import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { AddressForm, type AddressFormData } from './AddressForm';

const meta: Meta<typeof AddressForm> = {
  id: 'text-inputs-addressform',
  title: 'Inputs/Text inputs/AddressForm',
  component: AddressForm,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A fixed-layout US postal address editor built from \`Input\`s: address line 1 and 2, then a City / State / ZIP row, then optional County (\`showCounty\`, default off) and Country (\`showCountry\`, default on, prefilled from \`defaultCountry\` \`'US'\`). Fully controlled through \`value: Partial<AddressFormData>\` / \`onChange\` (\`AddressFormData\` = \`AddressData\` + \`county?\`, \`lat?\`, \`lng?\`). \`errors\` maps field → message, \`required\` and \`disabled\` fan out to the fields, \`labels\` / \`placeholders\` override the English defaults, \`id\` prefixes the field ids, and \`googlePlaces={{ enabled, componentRestrictions, types, onPlaceSelect }}\` attaches Google Places Autocomplete to line 1 and fills the other fields (plus \`lat\`/\`lng\`) from the chosen place. Exported from the \`Address\` folder with \`AddressFormProps\` and \`AddressFormData\`.

### Use it when

- A form needs a complete mailing or service address with the standard field order and \`autocomplete\` tokens (\`address-line1\`, \`address-level2\`, \`postal-code\`, …).
- You have the Google Maps JS API loaded and want one-tap address fill with coordinates.

### Don't use it when

- Displaying a stored address — \`Address\` / \`AddressCard\`.
- Only one part is needed (a ZIP filter, a city search) — a single \`Input\` or \`Autocomplete\`.
- The layout, field set or validation must differ (non-US formats, a state picker, provinces) — compose your own from \`Input\` and \`Select\`; the fields here are fixed and the state box is a two-character upper-cased text field.

### Example

\`\`\`tsx
const [address, setAddress] = React.useState<Partial<AddressFormData>>({});
const [errors, setErrors] = React.useState<AddressFormProps['errors']>({});

<AddressForm
  value={address}
  onChange={(next) => { setAddress(next); setErrors({}); }}
  errors={errors}
  required
  showCounty
  googlePlaces={{ enabled: hasMapsApi, componentRestrictions: { country: 'us' } }}
/>
\`\`\`

The host owns the object and the validation; \`onChange\` receives the whole merged record on every keystroke.

### Limitations

- Each field is an \`Input\`, so it inherits \`<label htmlFor>\`, \`aria-invalid\` and a \`<p role="alert">\` error via \`errors[field]\`. The fields are not grouped in a \`<fieldset>\`/\`<legend>\`; add one if the form has other sections.
- Country is always rendered \`required\` regardless of the \`required\` prop, and the displayed \`defaultCountry\` is not written into \`value\` until the user edits it. State is forced upper-case with \`maxLength={2}\`.
- Google Places: expects \`window.google.maps.places.Autocomplete\` (the legacy widget) to be loaded by the host; otherwise it \`console.warn\`s and does nothing. The listener is bound once per \`enabled\` change and merges the place into the \`value\` captured at that time, so edits made between mount and selection can be lost. Two hidden \`<input name="lat|lng">\` are emitted when coordinates exist.
- Default labels/placeholders are English (\`"Address Line 1"\`, \`"ZIP Code"\`, \`"Apt, suite, building (optional)"\`, …) and US-centric; both are overridable but the field order is not.
- Responsive 12-column grid (\`col-span-*\` / \`md:col-span-*\`) with no physical direction classes — RTL-safe. Theming is \`Input\`'s. No bundled dependency on Google; the API script is the host's responsibility.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'text-inputs-address',
          why: 'AddressForm collects the AddressData that Address displays; use them on the edit and read views of the same record.',
        },
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'Every field is an Input, so labels, errors and theming follow it.',
        },
      ],
    },
  },
  argTypes: {
    showCountry: {
      control: 'boolean',
      description: 'Country field (always required when shown).',
    },
    showCounty: { control: 'boolean' },
    required: {
      control: 'boolean',
      description:
        'Applies to line 1, city, state, ZIP and county; line 2 is never required.',
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
