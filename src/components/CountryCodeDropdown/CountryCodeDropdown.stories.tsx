import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CountryCodeDropdown,
  validatePhoneNumber,
  type CountryData,
} from './CountryCodeDropdown';
import { Input } from '../Input';

const meta: Meta<typeof CountryCodeDropdown> = {
  id: 'choice-inputs-countrycodedropdown',
  title: 'Inputs/Choice inputs/CountryCodeDropdown',
  component: CountryCodeDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **dial-code picker to sit beside a phone number field**. The trigger shows the flag and dial code (🇺🇸 +1); clicking it opens a portaled, searchable \`role="listbox"\` of every region \`google-libphonenumber\` knows, with flag, localized name and dial code. \`value\` is the ISO alpha-2 code (\`"US"\`), \`onChange\` receives the full \`CountryData\` (\`{ code, name, dialCode, flag }\`). Also exports the helpers \`validatePhoneNumber(number, code)\` and \`formatE164(number, code)\` for the adjacent input. Props: \`disabled\`, \`placement\` \`bottom-start\` | \`bottom-end\`, \`searchPlaceholder\`, \`id\` (for \`<label htmlFor>\`), \`aria-label\`, \`className\`.

### Use it when

- Collecting an **international** phone number: pair it with an \`Input\` for the national number and validate with \`validatePhoneNumber\`, store with \`formatE164\`.

### Don't use it when

- The number is always US/Canada — \`PhoneInput\` (10-digit formatting and validation, no country picker).
- You need the country itself (address, nationality), not a dial code — \`CountryDropdown\` (same list, no codes).
- The list is anything other than countries — \`Select\`.

### Example

\`\`\`tsx
const [country, setCountry] = useState<CountryData>({ code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' });
const [national, setNational] = useState('');
const invalid = national !== '' && !validatePhoneNumber(national, country.code);

<div className="flex gap-2">
  <CountryCodeDropdown id="phone-country" value={country.code} onChange={setCountry} />
  <Input
    label="Phone"
    hideLabel
    type="tel"
    value={national}
    onChange={(e) => setNational(e.target.value)}
    error={invalid ? \`Not a valid number for \${country.name}\` : undefined}
  />
</div>
// persist: formatE164(national, country.code) → "+15551234567"
\`\`\`

### Limitations

- Accessibility: trigger \`<button aria-haspopup="listbox" aria-expanded aria-controls aria-label>\` (default \`"Select country code"\`); panel \`role="listbox"\` with \`<button role="option" aria-selected>\` rows; the search box is focused on open. ArrowUp/Down move focus between options (wrapping) once focus is inside the panel; Escape and outside click close and clear the search. Focus is not returned to the trigger on close. The flag emoji is \`aria-hidden\`, so the trigger's name comes from \`aria-label\`, not the visible dial code.
- Uncontrolled default and the fallback for an unknown \`value\` are both \`"US"\`. Not a form control: no \`name\`, nothing submits — post \`country.code\` / \`formatE164(...)\` yourself. No \`error\` prop.
- i18n: country **names** are localized through \`Intl.DisplayNames\` using \`navigator.languages\` (falls back to the ISO code); the strings \`"Search countries…"\` (\`searchPlaceholder\`, overridable), \`"Search countries"\` (search \`aria-label\`) and \`"No countries found"\` are hard-coded English. Search matches name, dial code and ISO code, case-insensitive.
- RTL: panel placement is logical (\`bottom-start\` / \`bottom-end\` via \`useAnchoredPosition\`) but option text is \`text-left\`. Panel width is fixed at \`w-72\`.
- Theming: trigger uses \`border-input bg-background text-foreground\`; the panel and options use hard-coded \`neutral-*\` / \`white\` with \`dark:\` variants rather than semantic tokens.
- Dependency: \`google-libphonenumber\` (large; the country list is built lazily on first open). Emoji flags depend on the platform font — Windows renders them as letter pairs.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-countrydropdown',
          why: 'CountryCodeDropdown shows dial codes for a phone field; CountryDropdown shows only the country for address or nationality.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-phoneinput',
          why: 'PhoneInput handles US/Canada 10-digit numbers alone; CountryCodeDropdown + an Input covers international numbers with libphonenumber validation.',
        },
        {
          type: 'composes with',
          target: 'text-inputs-input',
          why: 'Sits beside an Input holding the national number; validatePhoneNumber / formatE164 check and store it against the chosen country.',
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

export const WithPhoneInput: Story = {
  render: function WithPhoneInputExample() {
    const [country, setCountry] = useState<CountryData>({
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
    });
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const handleBlur = () => {
      if (phone && !validatePhoneNumber(phone, country.code)) {
        setError(`Invalid phone number for ${country.name}`);
      } else {
        setError('');
      }
    };

    return (
      <div style={{ width: '360px' }}>
        <label
          htmlFor="phone-number-input"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          Phone Number
        </label>
        <div className="flex gap-2">
          <CountryCodeDropdown value={country.code} onChange={setCountry} />
          <div className="flex-1">
            <Input
              id="phone-number-input"
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={handleBlur}
              hasError={!!error}
              error={error}
            />
          </div>
        </div>
        {country && (
          <p className="text-muted-foreground mt-2 text-xs">
            Selected: {country.flag} {country.name} ({country.dialCode})
          </p>
        )}
      </div>
    );
  },
};

export const PreselectedCountry: Story = {
  args: {
    value: 'GB',
  },
};

export const BottomEnd: Story = {
  render: () => (
    <div className="flex justify-end" style={{ width: '400px' }}>
      <CountryCodeDropdown placement="bottom-end" />
    </div>
  ),
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
        <CountryCodeDropdown value={country.code} onChange={setCountry} />
        <div className="text-muted-foreground space-y-1 text-sm">
          <p>Country: {country.name}</p>
          <p>Code: {country.code}</p>
          <p>Dial code: {country.dialCode}</p>
          <p>Flag: {country.flag}</p>
        </div>
      </div>
    );
  },
};
