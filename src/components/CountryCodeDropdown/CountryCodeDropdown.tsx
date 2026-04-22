import * as React from 'react';
import * as libphonenumber from 'google-libphonenumber';
import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const PhoneNumberUtil =
  (libphonenumber as unknown as { default?: typeof libphonenumber }).default
    ?.PhoneNumberUtil ?? libphonenumber.PhoneNumberUtil;
const PhoneNumberFormat =
  (libphonenumber as unknown as { default?: typeof libphonenumber }).default
    ?.PhoneNumberFormat ?? libphonenumber.PhoneNumberFormat;

// =============================================================================
// Types
// =============================================================================

export interface CountryData {
  /** ISO 3166-1 alpha-2 country code (e.g. "US") */
  code: string;
  /** Country name (e.g. "United States") */
  name: string;
  /** Dial code (e.g. "+1") */
  dialCode: string;
  /** Emoji flag (e.g. "🇺🇸") */
  flag: string;
}

export interface CountryCodeDropdownProps {
  /** The currently selected country code (ISO alpha-2, e.g. "US") */
  value?: string;
  /** Called when a country is selected */
  onChange?: (country: CountryData) => void;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Additional class name for the trigger button */
  className?: string;
  /** Placement of the dropdown panel */
  placement?: 'bottom-start' | 'bottom-end';
  /** Placeholder text for the search field */
  searchPlaceholder?: string;
  /** Label for accessibility — visually hidden */
  'aria-label'?: string;
}

// =============================================================================
// Country Data (generated from libphonenumber)
// =============================================================================

/** Convert an ISO alpha-2 code to an emoji flag. */
function isoToEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('');
}

/** Build the full sorted list of countries from libphonenumber. */
function buildCountryList(): CountryData[] {
  const phoneUtil = PhoneNumberUtil.getInstance();
  const regions = phoneUtil.getSupportedRegions() as string[];
  const list: CountryData[] = regions.map((code: string) => {
    const callingCode = phoneUtil.getCountryCodeForRegion(code);
    return {
      code,
      name: regionDisplayName(code),
      dialCode: `+${callingCode}`,
      flag: isoToEmoji(code),
    };
  });
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/** Lazy singleton so we only build the list once. */
let _countries: CountryData[] | null = null;
function getCountries(): CountryData[] {
  if (!_countries) _countries = buildCountryList();
  return _countries;
}

// =============================================================================
// Region display name mapping
// =============================================================================

/** Lazy singleton for Intl.DisplayNames so we only construct it once. */
let _regionDisplayNames: Intl.DisplayNames | null = null;

function getRegionDisplayNames(): Intl.DisplayNames | null {
  if (_regionDisplayNames === null) {
    try {
      const locales =
        typeof navigator !== 'undefined' && navigator.languages?.length
          ? [...navigator.languages]
          : ['en'];
      _regionDisplayNames = new Intl.DisplayNames(locales, { type: 'region' });
    } catch {
      return null;
    }
  }
  return _regionDisplayNames;
}

/**
 * Use the browser Intl API for display names where available,
 * falling back to the raw ISO code.
 */
function regionDisplayName(code: string): string {
  const dn = getRegionDisplayNames();
  if (!dn) return code;
  return dn.of(code) ?? code;
}

// =============================================================================
// Validation helper (exported for consumers)
// =============================================================================

/**
 * Validate a phone number string for a given country code using libphonenumber.
 *
 * @param phoneNumber - The phone number (digits, may include formatting)
 * @param countryCode - ISO alpha-2 code (e.g. "US")
 * @returns Whether the number is valid for the given region.
 */
export function validatePhoneNumber(
  phoneNumber: string,
  countryCode: string
): boolean {
  try {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const parsed = phoneUtil.parse(phoneNumber, countryCode);
    return phoneUtil.isValidNumberForRegion(parsed, countryCode);
  } catch {
    return false;
  }
}

/**
 * Format a phone number into E.164 international format.
 *
 * @param phoneNumber - The phone number (digits, may include formatting)
 * @param countryCode - ISO alpha-2 code (e.g. "US")
 * @returns The formatted number (e.g. "+15551234567") or the original string if parsing fails.
 */
export function formatE164(phoneNumber: string, countryCode: string): string {
  try {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const parsed = phoneUtil.parse(phoneNumber, countryCode);
    return phoneUtil.format(parsed, PhoneNumberFormat.E164);
  } catch {
    return phoneNumber;
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * A country-code selector dropdown designed to sit beside a phone number input.
 *
 * Defaults to United States (+1) with the 🇺🇸 flag. Clicking the trigger opens
 * a searchable list of all supported countries with their dial codes and flags.
 *
 * Uses Google's libphonenumber for the canonical country/code list and provides
 * a `validatePhoneNumber` helper for phone validation.
 *
 * @example
 * ```tsx
 * const [country, setCountry] = useState<CountryData>();
 *
 * <div className="flex gap-2">
 *   <CountryCodeDropdown value={country?.code} onChange={setCountry} />
 *   <Input placeholder="Phone number" />
 * </div>
 * ```
 */
function CountryCodeDropdown({
  value,
  onChange,
  disabled = false,
  className,
  placement = 'bottom-start',
  searchPlaceholder = 'Search countries…',
  'aria-label': ariaLabel = 'Select country code',
}: CountryCodeDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [internalValue, setInternalValue] = React.useState(value ?? 'US');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  // Defer building the full country list until the dropdown is first opened
  const [countriesLoaded, setCountriesLoaded] = React.useState(false);
  const countries = React.useMemo(
    () => (countriesLoaded ? getCountries() : []),
    [countriesLoaded]
  );

  React.useEffect(() => {
    if (isOpen && !countriesLoaded) setCountriesLoaded(true);
  }, [isOpen, countriesLoaded]);

  const selected = React.useMemo(() => {
    if (countries.length) {
      return (
        countries.find((c) => c.code === activeValue) ??
        countries.find((c) => c.code === 'US')!
      );
    }
    // Lightweight fallback while list hasn't loaded yet
    return {
      code: activeValue ?? 'US',
      name: regionDisplayName(activeValue ?? 'US'),
      dialCode: `+${PhoneNumberUtil.getInstance().getCountryCodeForRegion(activeValue ?? 'US')}`,
      flag: isoToEmoji(activeValue ?? 'US'),
    };
  }, [activeValue, countries]);

  const filtered = React.useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search, countries]);

  // Close helpers
  const close = React.useCallback(() => {
    setIsOpen(false);
    setSearch('');
  }, []);

  useClickOutside(containerRef, close);
  useEscapeKey(close, isOpen);

  // Focus search input when opening
  React.useEffect(() => {
    if (isOpen) {
      // Defer to let the DOM render
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isOpen]);

  const handleToggle = React.useCallback(() => {
    if (!disabled) setIsOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = React.useCallback(
    (country: CountryData) => {
      if (!isControlled) {
        setInternalValue(country.code);
      }
      onChange?.(country);
      close();
    },
    [isControlled, onChange, close]
  );

  // Keyboard navigation inside the list
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items =
          listRef.current?.querySelectorAll<HTMLButtonElement>(
            '[role="option"]'
          );
        if (!items?.length) return;

        const current = document.activeElement as HTMLElement;
        const idx = Array.from(items).indexOf(current as HTMLButtonElement);
        let next: number;
        if (e.key === 'ArrowDown') {
          next = idx < items.length - 1 ? idx + 1 : 0;
        } else {
          next = idx > 0 ? idx - 1 : items.length - 1;
        }
        items[next].focus();
      }
    },
    [isOpen]
  );

  const placementClass =
    placement === 'bottom-end'
      ? 'top-full right-0 mt-1'
      : 'top-full left-0 mt-1';

  return (
    <div
      ref={containerRef}
      data-slot="country-dropdown"
      className="relative inline-flex"
    >
      {/* Trigger button */}
      <button
        type="button"
        data-slot="country-dropdown-trigger"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm',
          'border-input bg-background text-foreground',
          'transition-colors duration-200',
          'hover:bg-neutral-50 dark:hover:bg-neutral-700',
          'focus:ring-ring focus:ring-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <span
          data-slot="country-dropdown-flag"
          className="text-base leading-none"
          aria-hidden="true"
        >
          {selected.flag}
        </span>
        <span data-slot="country-dropdown-dialcode">{selected.dialCode}</span>
        <svg
          data-slot="country-dropdown-chevron"
          className={cn(
            'h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          id={menuId}
          role="listbox"
          data-slot="country-dropdown-panel"
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={cn(
            'absolute z-50 w-72',
            'rounded-xl border border-neutral-200 bg-white shadow-lg',
            'dark:border-neutral-700 dark:bg-neutral-800',
            'animate-in fade-in zoom-in-95 duration-100',
            placementClass
          )}
        >
          {/* Search input */}
          <div
            data-slot="country-dropdown-search"
            className="border-b border-neutral-200 p-2 dark:border-neutral-700"
          >
            <input
              ref={searchInputRef}
              type="text"
              data-slot="country-dropdown-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search countries"
              className={cn(
                'w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm',
                'text-foreground placeholder:text-muted-foreground bg-white',
                'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none',
                'dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100'
              )}
            />
          </div>

          {/* Country list */}
          <div
            ref={listRef}
            data-slot="country-dropdown-list"
            className="max-h-60 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <div className="text-muted-foreground px-3 py-4 text-center text-sm">
                No countries found
              </div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  role="option"
                  data-slot="country-dropdown-option"
                  aria-selected={country.code === selected.code}
                  onClick={() => handleSelect(country)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                    'transition-colors duration-150',
                    'focus:outline-none',
                    country.code === selected.code
                      ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50',
                    'focus:bg-neutral-100 dark:focus:bg-neutral-700'
                  )}
                >
                  <span
                    data-slot="country-dropdown-option-flag"
                    className="text-base leading-none"
                    aria-hidden="true"
                  >
                    {country.flag}
                  </span>
                  <span
                    data-slot="country-dropdown-option-name"
                    className="flex-1 truncate"
                  >
                    {country.name}
                  </span>
                  <span
                    data-slot="country-dropdown-option-dialcode"
                    className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    {country.dialCode}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

CountryCodeDropdown.displayName = 'CountryCodeDropdown';

export { CountryCodeDropdown };
