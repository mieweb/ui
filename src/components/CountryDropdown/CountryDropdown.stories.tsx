import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountryDropdown } from './CountryDropdown';
import type { CountryData } from '../CountryCodeDropdown';

const meta: Meta<typeof CountryDropdown> = {
  id: 'choice-inputs-countrydropdown',
  title: 'Inputs/Choice inputs/CountryDropdown',
  component: CountryDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **country picker with the list built in**: the trigger shows the flag and country name; clicking it opens a portaled, searchable \`role="listbox"\` of every region \`google-libphonenumber\` knows, with names localized by \`Intl.DisplayNames\`. It is \`CountryCodeDropdown\` with \`showDialCode\` off — same props (\`CountryDropdownProps\` is an alias of \`CountryCodeDropdownProps\`): \`value\` (ISO alpha-2, \`"GB"\`), \`onChange(country: CountryData)\`, \`disabled\`, \`placement\`, \`searchPlaceholder\`, \`id\`, \`aria-label\` (default \`"Select country"\`), \`className\`.

### Use it when

- A form needs a **country** — billing/shipping address, nationality, country of residence — and you don't want to maintain a country list yourself.

### Don't use it when

- It accompanies a phone number — \`CountryCodeDropdown\` (shows dial codes, searches by code, ships \`validatePhoneNumber\` / \`formatE164\`).
- You need a curated subset, custom labels, or a non-country list — \`Select\` with your own \`options\` (this component always lists every region and has no \`options\` prop).
- The address is US-only — \`AddressForm\` already handles state/ZIP without a country picker.

### Example

\`\`\`tsx
const [country, setCountry] = useState<CountryData | undefined>();

<div className="flex flex-col gap-1.5">
  <Label htmlFor="billing-country">Country</Label>
  <CountryDropdown
    id="billing-country"
    value={country?.code}
    onChange={setCountry}
    aria-label="Billing country"
  />
</div>
// persist country?.code ("GB"), display country?.name
\`\`\`

\`value\` is the ISO code; the component gives you back the whole \`CountryData\` so you can store the code and show the name.

### Limitations

- Accessibility: identical to \`CountryCodeDropdown\` — \`<button aria-haspopup="listbox" aria-expanded aria-controls aria-label>\` trigger, \`role="listbox"\` panel with \`<button role="option" aria-selected>\` rows, search box focused on open, ArrowUp/Down between options once inside the panel, Escape / outside click close. Focus is not returned to the trigger on close; the flag is \`aria-hidden\`. Pass \`id\` to bind a visible \`Label\`.
- Uncontrolled default and the fallback for an unknown \`value\` are \`"US"\` — there is no empty / placeholder state, so "no country chosen yet" must be modelled outside the component.
- Not a form control: no \`name\`, \`error\` or \`required\`; nothing submits.
- i18n: country names follow \`navigator.languages\` via \`Intl.DisplayNames\` (ISO code fallback) and sort with \`localeCompare\`; \`searchPlaceholder\` defaults to \`"Search countries…"\` and is overridable, while the search \`aria-label\` \`"Search countries"\` and \`"No countries found"\` are hard-coded English. Search matches name and ISO code (not dial code in this mode).
- RTL: logical \`placement\`, but option text is \`text-left\` and the panel width is fixed (\`w-72\`). Theming: trigger on semantic tokens, panel on hard-coded \`neutral-*\` / \`white\` with \`dark:\` variants.
- Dependency: \`google-libphonenumber\` (list built lazily on first open); emoji flags render as letter pairs on Windows.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-countrycodedropdown',
          why: 'CountryDropdown shows only the country for address or nationality; CountryCodeDropdown shows dial codes for a phone field.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-countrycodedropdown',
          why: 'Thin wrapper over the shared CountryDropdownBase with showDialCode={false}; props and data come from CountryCodeDropdown.',
        },
        {
          type: 'alternative to',
          target: 'composite-forms-languageselector',
          why: 'CountryDropdown picks a country for an address or nationality; LanguageSelector picks a language/locale code.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const PreselectedCountry: Story = {
  args: {
    value: 'GB',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [country, setCountry] = useState<CountryData>({
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
    });

    return (
      <div className="space-y-4">
        <CountryDropdown value={country.code} onChange={setCountry} />
        <div className="text-muted-foreground space-y-1 text-sm">
          <p>Country: {country.name}</p>
          <p>Code: {country.code}</p>
        </div>
      </div>
    );
  },
};

export const InAForm: Story = {
  render: function InAFormExample() {
    const [country, setCountry] = useState<CountryData>();

    return (
      <div style={{ width: '360px' }}>
        <label
          htmlFor="country-select"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          Country
        </label>
        <CountryDropdown
          id="country-select"
          value={country?.code}
          onChange={setCountry}
        />
      </div>
    );
  },
};
