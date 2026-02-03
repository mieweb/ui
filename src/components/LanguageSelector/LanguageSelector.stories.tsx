import * as React from 'react';
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

// =============================================================================
// Story Component Wrapper for State Management (primary Storybook component)
// Wraps LanguageSelector to integrate with Storybook controls and local state
// =============================================================================

interface LanguageSelectorWithStateProps {
  value?: string;
  languages?: Language[];
  showFlags?: boolean;
  flagOnly?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'minimal';
  onChange?: (language: Language) => void;
}

function LanguageSelectorWithState({
  value: initialValue = 'en',
  languages = limitedLanguages,
  showFlags = true,
  flagOnly = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  onChange,
}: LanguageSelectorWithStateProps) {
  const [value, setValue] = React.useState(initialValue);

  // Sync with Storybook controls when initialValue changes
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (language: Language) => {
    setValue(language.code);
    onChange?.(language);
  };

  return (
    <LanguageSelector
      value={value}
      onChange={handleChange}
      languages={languages}
      showFlags={showFlags}
      flagOnly={flagOnly}
      disabled={disabled}
      size={size}
      variant={variant}
    />
  );
}

const meta: Meta<typeof LanguageSelectorWithState> = {
  title: 'Components/LanguageSelector',
  component: LanguageSelectorWithState,
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
type Story = StoryObj<typeof LanguageSelectorWithState>;

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

// All three selector types comparison with state management
export const AllVariantsComparison: Story = {
  render: function AllVariantsComparisonStory(args) {
    const [dropdownValue, setDropdownValue] = React.useState(
      args.value || 'en'
    );
    const [nativeValue, setNativeValue] = React.useState(args.value || 'en');
    const [inlineValue, setInlineValue] = React.useState(args.value || 'en');

    // Sync with Storybook controls
    React.useEffect(() => {
      setDropdownValue(args.value || 'en');
      setNativeValue(args.value || 'en');
      setInlineValue(args.value || 'en');
    }, [args.value]);

    return (
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground mb-2 text-sm">Custom Dropdown</p>
          <LanguageSelector
            {...args}
            value={dropdownValue}
            onChange={(language) => setDropdownValue(language.code)}
          />
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-sm">Native Select</p>
          <LanguageSelectorNative
            {...args}
            value={nativeValue}
            onChange={(language) => setNativeValue(language.code)}
          />
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-sm">Inline Buttons</p>
          <LanguageSelectorInline
            {...args}
            value={inlineValue}
            onChange={(language) => setInlineValue(language.code)}
          />
        </div>
      </div>
    );
  },
};

// In header context with state management
export const InHeader: Story = {
  args: {
    variant: 'ghost',
    size: 'sm',
  },
  render: function InHeaderStory(args) {
    const [value, setValue] = React.useState(args.value || 'en');

    // Sync with Storybook controls
    React.useEffect(() => {
      setValue(args.value || 'en');
    }, [args.value]);

    return (
      <header className="border-border bg-card flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="text-foreground font-semibold">BlueHive</div>
        <div className="flex items-center gap-4">
          <LanguageSelector
            {...args}
            value={value}
            onChange={(language) => setValue(language.code)}
          />
          <button className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm">
            Sign In
          </button>
        </div>
      </header>
    );
  },
};
