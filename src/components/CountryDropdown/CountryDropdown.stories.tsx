import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountryDropdown } from './CountryDropdown';
import type { CountryData } from '../CountryCodeDropdown';

const meta: Meta<typeof CountryDropdown> = {
  title: 'Components/Forms & Inputs/CountryDropdown',
  component: CountryDropdown,
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
          htmlFor="country-dropdown-trigger"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          Country
        </label>
        <CountryDropdown value={country?.code} onChange={setCountry} />
      </div>
    );
  },
};
