import * as React from 'react';
import { cn } from '../../utils/cn';
import { Input, type InputProps } from '../Input';

// =============================================================================
// Website Types
// =============================================================================

export type WebsiteType =
  | 'blog'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'pinterest'
  | 'twitter'
  | 'website'
  | 'yelp'
  | 'youtube';

export interface WebsiteEntry {
  url: string;
  type: WebsiteType;
}

export interface WebsiteInputProps extends Omit<
  InputProps,
  'type' | 'onChange' | 'value'
> {
  /** The URL value */
  value?: string;
  /** Callback fired when the value changes */
  onChange?: (value: string) => void;
  /** Whether to validate and show error state for invalid URLs */
  validateOnBlur?: boolean;
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is not invalid, just empty
  try {
    new URL(url);
    return true;
  } catch {
    // Try adding https:// prefix
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * A URL input with validation
 *
 * @example
 * ```tsx
 * const [url, setUrl] = useState('');
 * <WebsiteInput
 *   label="Website URL"
 *   value={url}
 *   onChange={setUrl}
 *   validateOnBlur
 * />
 * ```
 */
const WebsiteInput = React.forwardRef<HTMLInputElement, WebsiteInputProps>(
  (
    {
      value = '',
      onChange,
      validateOnBlur,
      className,
      onBlur,
      hasError,
      error,
      ...props
    },
    ref
  ) => {
    const [localError, setLocalError] = React.useState<string | undefined>();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);

      // Clear error when user starts typing again
      if (localError) {
        setLocalError(undefined);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);

      if (validateOnBlur) {
        if (value.length > 0 && !isValidUrl(value)) {
          setLocalError('Please enter a valid URL');
        } else {
          setLocalError(undefined);
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://example.com"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        hasError={hasError || !!localError}
        error={error || localError}
        className={cn(className)}
        {...props}
      />
    );
  }
);

WebsiteInput.displayName = 'WebsiteInput';

// =============================================================================
// Website Type Options
// =============================================================================

const WEBSITE_TYPES: { value: WebsiteType; label: string; icon?: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'blog', label: 'Blog' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'youtube', label: 'YouTube' },
];

/**
 * Get placeholder text based on website type
 */
function getPlaceholder(type: WebsiteType): string {
  switch (type) {
    case 'facebook':
      return 'https://facebook.com/yourpage';
    case 'instagram':
      return 'https://instagram.com/yourhandle';
    case 'linkedin':
      return 'https://linkedin.com/in/yourprofile';
    case 'pinterest':
      return 'https://pinterest.com/yourprofile';
    case 'twitter':
      return 'https://twitter.com/yourhandle';
    case 'yelp':
      return 'https://yelp.com/biz/yourbusiness';
    case 'youtube':
      return 'https://youtube.com/c/yourchannel';
    case 'blog':
      return 'https://yourblog.com';
    default:
      return 'https://example.com';
  }
}

// =============================================================================
// WebsiteInputGroup
// =============================================================================

export interface WebsiteInputGroupProps {
  /** Array of website entries */
  value: WebsiteEntry[];
  /** Callback when website entries change */
  onChange: (websites: WebsiteEntry[]) => void;
  /** Minimum number of website entries (default: 1) */
  minEntries?: number;
  /** Maximum number of website entries (default: 10) */
  maxEntries?: number;
  /** Whether the first entry is required */
  required?: boolean;
  /** Whether all inputs are disabled */
  disabled?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Label for the website input */
  label?: string;
  /** Labels for type options (for i18n) */
  typeLabels?: Partial<Record<WebsiteType, string>>;
  /** Custom className */
  className?: string;
}

/**
 * A group of website/social media URL inputs with type selection and add/remove functionality.
 *
 * @example
 * ```tsx
 * const [websites, setWebsites] = useState<WebsiteEntry[]>([
 *   { url: '', type: 'website' }
 * ]);
 *
 * <WebsiteInputGroup
 *   value={websites}
 *   onChange={setWebsites}
 * />
 * ```
 */
function WebsiteInputGroup({
  value,
  onChange,
  minEntries = 1,
  maxEntries = 10,
  required = false,
  disabled = false,
  validateOnBlur = false,
  label,
  typeLabels,
  className,
}: WebsiteInputGroupProps) {
  // Ensure we always have at least minEntries
  const websites = React.useMemo(() => {
    if (value.length >= minEntries) return value;
    const padding: WebsiteEntry[] = Array(minEntries - value.length)
      .fill(null)
      .map(() => ({ url: '', type: 'website' as WebsiteType }));
    return [...value, ...padding];
  }, [value, minEntries]);

  const handleUrlChange = (index: number, url: string) => {
    const updated = [...websites];
    updated[index] = { ...updated[index], url };
    onChange(updated);
  };

  const handleTypeChange = (index: number, type: WebsiteType) => {
    const updated = [...websites];
    updated[index] = { ...updated[index], type };
    onChange(updated);
  };

  const handleAdd = () => {
    if (websites.length < maxEntries) {
      onChange([...websites, { url: '', type: 'website' }]);
    }
  };

  const handleRemove = (index: number) => {
    if (websites.length > minEntries) {
      onChange(websites.filter((_, i) => i !== index));
    }
  };

  const getTypeLabel = (type: WebsiteType): string => {
    if (typeLabels?.[type]) return typeLabels[type];
    return WEBSITE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const canAdd = websites.length < maxEntries;
  const canRemove = websites.length > minEntries;

  return (
    <div className={cn('space-y-3', className)}>
      {websites.map((website, index) => (
        <div key={index} className="flex items-start gap-2">
          {/* URL input */}
          <div className="flex-1">
            <WebsiteInput
              label={index === 0 ? label : undefined}
              value={website.url}
              onChange={(url) => handleUrlChange(index, url)}
              disabled={disabled}
              validateOnBlur={validateOnBlur}
              required={required && index === 0}
              placeholder={getPlaceholder(website.type)}
            />
          </div>

          {/* Type selector */}
          <div className="w-36 shrink-0">
            <label className="sr-only" htmlFor={`website-type-${index}`}>
              URL type
            </label>
            <select
              id={`website-type-${index}`}
              value={website.type}
              onChange={(e) =>
                handleTypeChange(index, e.target.value as WebsiteType)
              }
              disabled={disabled}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm',
                'border-gray-300 bg-white text-gray-900',
                'focus:border-brand-500 focus:ring-brand-500/20 focus:ring-2 focus:outline-none',
                'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                'dark:focus:border-brand-400 dark:focus:ring-brand-400/20',
                index === 0 && label ? 'mt-6' : ''
              )}
            >
              {WEBSITE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {getTypeLabel(type.value)}
                </option>
              ))}
            </select>
          </div>

          {/* Add/Remove buttons */}
          <div
            className={cn(
              'flex shrink-0 items-center',
              index === 0 && label ? 'mt-6' : ''
            )}
          >
            {index === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                disabled={disabled || !canAdd}
                className={cn(
                  'rounded-full p-2 transition-colors',
                  'text-brand-600 hover:bg-brand-50',
                  'disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent',
                  'dark:text-brand-400 dark:hover:bg-brand-900/20',
                  'dark:disabled:text-gray-600'
                )}
                aria-label="Add website"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled || !canRemove}
                className={cn(
                  'rounded-full p-2 transition-colors',
                  'text-red-600 hover:bg-red-50',
                  'disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent',
                  'dark:text-red-400 dark:hover:bg-red-900/20',
                  'dark:disabled:text-gray-600'
                )}
                aria-label="Remove website"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

WebsiteInputGroup.displayName = 'WebsiteInputGroup';

export { WebsiteInput, WebsiteInputGroup, WEBSITE_TYPES, isValidUrl };
