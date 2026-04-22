import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CountryCodeDropdown,
  validatePhoneNumber,
  type CountryData,
} from './CountryCodeDropdown';
import { Input } from '../Input';

const meta: Meta<typeof CountryCodeDropdown> = {
  title: 'Components/Forms & Inputs/CountryCodeDropdown',
  component: CountryCodeDropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
