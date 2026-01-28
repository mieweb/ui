import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  LanguageSelector,
  LanguageSelectorNative,
  LanguageSelectorInline,
  type Language,
} from './LanguageSelector';

const meta: Meta<typeof LanguageSelector> = {
  title: 'Components/LanguageSelector',
  component: LanguageSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'minimal'],
    },
    showFlags: { control: 'boolean' },
    flagOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageSelector>;

const limitedLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

// Interactive wrapper for stories
function LanguageSelectorDemo(
  props: Partial<React.ComponentProps<typeof LanguageSelector>>
) {
  const [value, setValue] = React.useState('en');
  return (
    <LanguageSelector
      value={value}
      onChange={(lang) => setValue(lang.code)}
      languages={limitedLanguages}
      {...props}
    />
  );
}

// Default dropdown selector
export const Default: Story = {
  render: () => <LanguageSelectorDemo />,
};

// All three selector types comparison
export const AllVariantsComparison: Story = {
  render: () => {
    const [value, setValue] = React.useState('en');
    const handleChange = (lang: Language) => setValue(lang.code);

    return (
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Custom Dropdown
          </p>
          <LanguageSelector
            value={value}
            onChange={handleChange}
            languages={limitedLanguages}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Native Select
          </p>
          <LanguageSelectorNative
            value={value}
            onChange={handleChange}
            languages={limitedLanguages}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Inline Buttons
          </p>
          <LanguageSelectorInline
            value={value}
            onChange={handleChange}
            languages={limitedLanguages}
          />
        </div>
      </div>
    );
  },
};

// Visual variants (default, ghost, minimal)
export const VisualVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-gray-500">Default</span>
        <LanguageSelectorDemo variant="default" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-gray-500">Ghost</span>
        <LanguageSelectorDemo variant="ghost" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-gray-500">Minimal</span>
        <LanguageSelectorDemo variant="minimal" />
      </div>
    </div>
  ),
};

// Flag-only display
export const FlagOnly: Story = {
  render: () => <LanguageSelectorDemo flagOnly showFlags />,
};

// Disabled state
export const Disabled: Story = {
  render: () => <LanguageSelectorDemo disabled />,
};

// In header context
export const InHeader: Story = {
  render: () => {
    const [value, setValue] = React.useState('en');

    return (
      <header className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="font-semibold text-gray-900 dark:text-white">
          BlueHive
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector
            value={value}
            onChange={(lang) => setValue(lang.code)}
            variant="ghost"
            size="sm"
            languages={limitedLanguages}
          />
          <button className="bg-primary-600 rounded-lg px-3 py-1.5 text-sm text-white">
            Sign In
          </button>
        </div>
      </header>
    );
  },
};
