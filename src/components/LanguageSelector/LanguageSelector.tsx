import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface Language {
  /** Language code (e.g., 'en', 'es', 'fr') */
  code: string;
  /** Display name in the language itself (e.g., 'English', 'Español') */
  name: string;
  /** English name (optional, for searching) */
  englishName?: string;
  /** Flag emoji or icon */
  flag?: string;
  /** Whether this language is RTL */
  rtl?: boolean;
}

export const DEFAULT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', englishName: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', englishName: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', englishName: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', englishName: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', englishName: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: '中文', englishName: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', englishName: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', englishName: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', flag: '🇮🇳' },
  { code: 'ru', name: 'Русский', englishName: 'Russian', flag: '🇷🇺' },
];

// =============================================================================
// Variants
// =============================================================================

const selectorVariants = cva('relative inline-block text-left', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const buttonVariants = cva(
  [
    'inline-flex items-center justify-between gap-2 rounded-lg border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  ],
  {
    variants: {
      size: {
        sm: 'px-2.5 py-1.5 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2.5 text-base',
      },
      variant: {
        default:
          'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
        ghost:
          'border-transparent bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
        minimal:
          'border-transparent bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

// =============================================================================
// LanguageSelector Component
// =============================================================================

export interface LanguageSelectorProps
  extends
    VariantProps<typeof selectorVariants>,
    VariantProps<typeof buttonVariants> {
  /** Currently selected language code */
  value?: string;
  /** Callback when language changes */
  onChange?: (language: Language) => void;
  /** Available languages */
  languages?: Language[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show flags */
  showFlags?: boolean;
  /** Whether to show only flag (no text) when collapsed */
  flagOnly?: boolean;
  /** Label for accessibility */
  label?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * A dropdown selector for choosing a language/locale.
 *
 * @example
 * ```tsx
 * const [lang, setLang] = useState('en');
 *
 * <LanguageSelector
 *   value={lang}
 *   onChange={(language) => setLang(language.code)}
 *   showFlags
 * />
 * ```
 */
export function LanguageSelector({
  value,
  onChange,
  languages = DEFAULT_LANGUAGES,
  placeholder = 'Select language',
  showFlags = true,
  flagOnly = false,
  label = 'Language',
  size = 'md',
  variant = 'default',
  disabled = false,
  className,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Find selected language
  const selectedLanguage = languages.find((l) => l.code === value);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (language: Language) => {
    onChange?.(language);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(selectorVariants({ size }), className)}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        className={cn(
          buttonVariants({ size, variant }),
          'w-full',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span className="flex items-center gap-2">
          {showFlags && selectedLanguage?.flag && (
            <span className="text-base">{selectedLanguage.flag}</span>
          )}
          {!flagOnly && (
            <span className="truncate">
              {selectedLanguage?.name || placeholder}
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg',
            'dark:border-gray-700 dark:bg-gray-800',
            'animate-in fade-in slide-in-from-top-1 duration-150'
          )}
        >
          <ul
            role="listbox"
            aria-label={label}
            className="max-h-60 overflow-auto py-1"
          >
            {languages.map((language) => (
              <li
                key={language.code}
                role="option"
                aria-selected={language.code === value}
                onClick={() => handleSelect(language)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(language)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors',
                  language.code === value
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {showFlags && language.flag && (
                  <span className="text-base">{language.flag}</span>
                )}
                <span className="flex-1">{language.name}</span>
                {language.code === value && (
                  <CheckIcon className="text-primary-600 dark:text-primary-400 h-4 w-4" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LanguageSelectorNative Component (Using native select)
// =============================================================================

export interface LanguageSelectorNativeProps {
  /** Currently selected language code */
  value?: string;
  /** Callback when language changes */
  onChange?: (language: Language) => void;
  /** Available languages */
  languages?: Language[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show flags in options */
  showFlags?: boolean;
  /** Label for accessibility */
  label?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional className for the select element */
  className?: string;
}

/**
 * A native select element for language selection.
 * Better for mobile and accessibility.
 *
 * @example
 * ```tsx
 * <LanguageSelectorNative
 *   value={lang}
 *   onChange={(language) => setLang(language.code)}
 * />
 * ```
 */
export function LanguageSelectorNative({
  value,
  onChange,
  languages = DEFAULT_LANGUAGES,
  placeholder = 'Select language',
  showFlags = true,
  label = 'Language',
  disabled = false,
  className,
}: LanguageSelectorNativeProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const language = languages.find((l) => l.code === selectedCode);
    if (language) {
      onChange?.(language);
    }
  };

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        aria-label={label}
        className={cn(
          'w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm',
          'focus:border-primary-500 focus:ring-primary-500 text-gray-700 focus:ring-2 focus:outline-none',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {showFlags && language.flag ? `${language.flag} ` : ''}
            {language.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

// =============================================================================
// LanguageSelectorInline Component
// =============================================================================

export interface LanguageSelectorInlineProps {
  /** Currently selected language code */
  value?: string;
  /** Callback when language changes */
  onChange?: (language: Language) => void;
  /** Available languages */
  languages?: Language[];
  /** Whether to show flags */
  showFlags?: boolean;
  /** Maximum languages to show (rest in "more" dropdown) */
  maxVisible?: number;
  /** Additional className */
  className?: string;
}

/**
 * Inline language selector showing all options as buttons.
 * Good for small language sets.
 *
 * @example
 * ```tsx
 * <LanguageSelectorInline
 *   value={lang}
 *   onChange={(language) => setLang(language.code)}
 *   languages={[
 *     { code: 'en', name: 'EN', flag: '🇺🇸' },
 *     { code: 'es', name: 'ES', flag: '🇪🇸' },
 *   ]}
 * />
 * ```
 */
export function LanguageSelectorInline({
  value,
  onChange,
  languages = DEFAULT_LANGUAGES.slice(0, 5),
  showFlags = true,
  className,
}: LanguageSelectorInlineProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn(
        'inline-flex rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {languages.map((language, index) => (
        <button
          key={language.code}
          type="button"
          role="radio"
          aria-checked={language.code === value}
          onClick={() => onChange?.(language)}
          className={cn(
            'px-3 py-1.5 text-sm transition-colors',
            index === 0 && 'rounded-l-lg',
            index === languages.length - 1 && 'rounded-r-lg',
            index > 0 && 'border-l border-gray-200 dark:border-gray-700',
            language.code === value
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {showFlags && language.flag && (
            <span className="mr-1">{language.flag}</span>
          )}
          {language.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
