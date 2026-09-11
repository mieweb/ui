import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import {
  type Language,
  LanguageSelector,
  LanguageSelectorInline,
  LanguageSelectorNative,
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
  id: 'composite-forms-languageselector',
  title: 'Inputs/Composite forms/LanguageSelector',
  component: LanguageSelectorWithState,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **UI-language / locale switcher** with a built-in list. \`Language = { code, name, englishName?, flag?, rtl? }\`; \`DEFAULT_LANGUAGES\` ships 12 entries (en, es, fr, de, it, pt, zh, ja, ko, ar, hi, ru) with native names and flag emoji. Three renderings share \`value\` (a code), \`onChange(language)\` (the whole object, so you get \`code\` and \`rtl\`) and \`languages\`: **\`LanguageSelector\`** — a button that opens a portaled \`role="listbox"\` (\`showFlags\`, \`flagOnly\`, \`size\` \`sm\`|\`md\`|\`lg\`, \`variant\` \`default\`|\`ghost\`|\`minimal\`, \`label\`, \`placeholder\`, \`disabled\`); **\`LanguageSelectorNative\`** — a real \`<select>\`, best on mobile; **\`LanguageSelectorInline\`** — a \`role="radiogroup"\` of code buttons (EN | ES | FR) for 2–5 languages. Exports: the three components, \`DEFAULT_LANGUAGES\`, types \`Language\`, \`LanguageSelectorProps\`, \`LanguageSelectorNativeProps\`, \`LanguageSelectorInlineProps\`.

### Use it when

- The app header, login page or settings needs a **language picker** whose result drives your i18n library and the document \`dir\`.
- You want native-name labels and flags without building the list; pass \`languages\` to trim it to what you actually translate.

### Don't use it when

- The value is a **country** for an address or nationality — \`CountryDropdown\`; a dial code — \`CountryCodeDropdown\`.
- It is an arbitrary form value with label, helper and error — \`Select\`.
- The choice is a patient's *spoken* language stored on the record with validation — use \`Select\` with your own option list; this component has no \`error\` / \`required\` / \`name\`.

### Example

\`\`\`tsx
const { i18n } = useTranslation();

<LanguageSelector
  value={i18n.language}
  languages={DEFAULT_LANGUAGES.filter((l) => ['en', 'es', 'ar'].includes(l.code))}
  variant="ghost"
  onChange={(language) => {
    i18n.changeLanguage(language.code);
    document.documentElement.dir = language.rtl ? 'rtl' : 'ltr'; // useDirection() picks this up
  }}
/>

// compact header or mobile
<LanguageSelectorNative value={i18n.language} onChange={(l) => i18n.changeLanguage(l.code)} />
\`\`\`

### Limitations

- Accessibility: \`LanguageSelector\`'s trigger is \`<button aria-haspopup="listbox" aria-expanded aria-label={label}>\` and the popup a \`<ul role="listbox" aria-label>\` of \`<li role="option" aria-selected>\`; but **options are not focusable** (\`<li>\` without \`tabIndex\`), there is no arrow-key navigation, no \`aria-activedescendant\`, and the \`onKeyDown\` Enter handler can never fire — the custom popup is mouse/touch only. Escape closes it (listener attached for the component's lifetime, not just while open) but focus is not returned to the trigger. \`LanguageSelectorNative\` inherits full native keyboard support. \`LanguageSelectorInline\` uses \`role="radiogroup"\` / \`role="radio" aria-checked\` with a hard-coded \`aria-label="Language"\`, and Tab (not arrow keys) moves between the radios.
- No form-field anatomy: no visible label, \`helperText\`, \`error\`, \`required\` or \`name\`; \`label\` is used only as \`aria-label\`. The \`rtl\` flag is data for your handler — the component does not read \`useDirection\` or set \`dir\` itself.
- Filtering/search is not available; \`englishName\` is in the type but unused by the components.
- i18n: language names are the native names from \`DEFAULT_LANGUAGES\` (not localized to the current UI language); \`placeholder\` defaults to English "Select language"; flags are emoji and render per-platform (Windows shows letter codes). Default flag for \`en\` is 🇺🇸.
- RTL: \`selectorVariants\` sets \`text-left\`; the native chevron is \`absolute right-2\` with \`pr-8\`; inline options use \`rounded-l-lg\` / \`rounded-r-lg\` / \`border-l\` / \`mr-1\` — all physical.
- Theming: trigger, popup and native select use hard-coded \`gray-*\` / \`bg-white\` classes with \`dark:\` variants; selected option \`bg-primary-50 text-primary-700\`, inline selected \`bg-primary-800 text-white\`, focus ring \`ring-primary-500\`. Depends on \`class-variance-authority\`, \`useAnchoredPosition\`, \`useClickOutside\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-select',
          why: 'LanguageSelector is a header/settings switcher with a built-in language list; Select is a labelled, validated form field for arbitrary values.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-countrydropdown',
          why: 'LanguageSelector picks a language/locale code; CountryDropdown picks a country for an address or nationality.',
        },
      ],
    },
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
          <p className="mb-2 text-sm text-muted-foreground">Custom Dropdown</p>
          <LanguageSelector
            {...args}
            value={dropdownValue}
            onChange={(language) => setDropdownValue(language.code)}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Native Select</p>
          <LanguageSelectorNative
            {...args}
            value={nativeValue}
            onChange={(language) => setNativeValue(language.code)}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Inline Buttons</p>
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
      <header className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div className="font-semibold text-foreground">BlueHive</div>
        <div className="flex items-center gap-4">
          <LanguageSelector
            {...args}
            value={value}
            onChange={(language) => setValue(language.code)}
          />
          <button className="bg-primary-800 rounded-lg px-3 py-1.5 text-sm text-white">
            Sign In
          </button>
        </div>
      </header>
    );
  },
};
