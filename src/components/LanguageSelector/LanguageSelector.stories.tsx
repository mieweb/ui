import type { Meta, StoryObj } from '@storybook/react';
import {
  LanguageSelector,
  LanguageSelectorNative,
  LanguageSelectorInline,
  type Language,
} from './LanguageSelector';

const limitedLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const meta: Meta<typeof LanguageSelector> = {
  title: 'Components/LanguageSelector',
  component: LanguageSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    value: 'en',
    languages: limitedLanguages,
    showFlags: true,
    flagOnly: false,
    disabled: false,
    size: 'md',
    variant: 'default',
  },
  argTypes: {
    value: {
      control: 'select',
      options: ['en', 'es', 'fr'],
      description: 'Currently selected language code',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the selector',
    },
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'minimal'],
      description: 'Visual variant of the selector',
    },
    showFlags: {
      control: 'boolean',
      description: 'Whether to show flag emojis',
    },
    flagOnly: {
      control: 'boolean',
      description: 'Show only the flag without text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the selector is disabled',
    },
    languages: {
      control: 'object',
      description: 'Available languages',
    },
    onChange: { action: 'onChange' },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageSelector>;

// Default dropdown selector
export const Default: Story = {};

// Visual variants (default, ghost, minimal)
export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Minimal: Story = {
  args: {
    variant: 'minimal',
  },
};

// Size variants
export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

// Flag-only display
export const FlagOnly: Story = {
  args: {
    flagOnly: true,
    showFlags: true,
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

// All three selector types comparison
export const AllVariantsComparison: Story = {
  render: (args) => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Custom Dropdown</p>
        <LanguageSelector {...args} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Native Select</p>
        <LanguageSelectorNative {...args} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Inline Buttons</p>
        <LanguageSelectorInline {...args} />
      </div>
    </div>
  ),
};

// In header context
export const InHeader: Story = {
  args: {
    variant: 'ghost',
    size: 'sm',
  },
  render: (args) => (
    <header className="border-border bg-card flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="text-foreground font-semibold">BlueHive</div>
      <div className="flex items-center gap-4">
        <LanguageSelector {...args} />
        <button className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm">
          Sign In
        </button>
      </div>
    </header>
  ),
};
