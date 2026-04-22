'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

/**
 * Service option for the multi-select filter
 */
export interface ServiceOption {
  /** Unique identifier (slug) */
  value: string;
  /** Display name */
  label: string;
  /** Optional category for grouping */
  category?: string;
  /** Number of providers offering this service */
  count?: number;
}

/**
 * Radius option for the distance dropdown
 */
export interface RadiusOption {
  /** Distance value in miles */
  value: number;
  /** Display label */
  label: string;
}

/**
 * Location suggestion from geocoding
 */
export interface LocationSuggestion {
  id: string;
  place_name: string;
  text: string;
  place_type: string[];
  center: [number, number];
}

/**
 * Filter state object
 */
export interface ProviderFilters {
  /** Provider name/search phrase */
  searchPhrase?: string;
  /** ZIP code (resolved postal code for API calls) */
  zipCode?: string;
  /** Display name shown in the location input (e.g. "Indianapolis, IN" or "46220") */
  locationDisplayName?: string;
  /** Search radius in miles */
  radius: number;
  /** Selected service slugs */
  services: string[];
}

/**
 * Default radius options
 */
export const DEFAULT_RADIUS_OPTIONS: RadiusOption[] = [
  { value: 1, label: '1 mile' },
  { value: 5, label: '5 miles' },
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
];

// ============================================================================
// Styles
// ============================================================================

const containerVariants = cva('provider-search-filters', {
  variants: {
    layout: {
      horizontal: 'flex flex-wrap items-end gap-3',
      vertical: 'flex flex-col gap-3',
      compact: 'flex flex-wrap items-center gap-2',
    },
  },
  defaultVariants: {
    layout: 'horizontal',
  },
});

const inputVariants = cva(
  [
    'flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm',
    'placeholder:text-neutral-500',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400',
  ],
  {
    variants: {
      hasIcon: {
        true: 'pl-10',
        false: '',
      },
    },
    defaultVariants: {
      hasIcon: false,
    },
  }
);

const selectVariants = cva([
  'flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
  'appearance-none bg-no-repeat bg-right pr-8',
  'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")]',
  'bg-[length:1.5em_1.5em]',
  'bg-[right_0.5rem_center]',
]);

const labelVariants = cva([
  'text-sm font-medium text-neutral-700 dark:text-neutral-300',
  'mb-1.5 block',
]);

const fieldGroupVariants = cva('flex-1 min-w-[150px]', {
  variants: {
    size: {
      sm: 'min-w-[100px] max-w-[150px]',
      md: 'min-w-[150px] max-w-[200px]',
      lg: 'min-w-[200px] max-w-[300px]',
      full: 'min-w-[200px] flex-grow',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// ============================================================================
// Icons
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-5 w-5', className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-5 w-5', className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function CrosshairsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={cn('h-4 w-4', className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function SpinnerSmallIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

function InputField({ label, icon, className, id, ...props }: InputFieldProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="relative">
      {label && (
        <label htmlFor={inputId} className={labelVariants()}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(inputVariants({ hasIcon: !!icon }), className)}
          {...props}
        />
      </div>
    </div>
  );
}

interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

function SelectField({
  label,
  options,
  className,
  id,
  ...props
}: SelectFieldProps) {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className={labelVariants()}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(selectVariants(), className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Location Input with Autocomplete + Geolocation
// ============================================================================

interface LocationInputProps {
  label?: string;
  /** Current display value (city name, ZIP, etc.) */
  value: string;
  /** Called when the display value changes (user typing) */
  onValueChange: (value: string) => void;
  /** Called when a location is resolved to a ZIP code */
  onZipCodeResolved: (zipCode: string, displayName: string) => void;
  /** Mapbox access token for geocoding */
  mapboxToken?: string;
  /** Called when geolocation button is clicked */
  onGeolocate?: () => void;
  /** Whether geolocation is in progress */
  geolocating?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function LocationInput({
  label,
  value,
  onValueChange,
  onZipCodeResolved,
  mapboxToken,
  onGeolocate,
  geolocating = false,
  disabled = false,
  placeholder = 'ZIP code or city',
}: LocationInputProps) {
  const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>(
    []
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatedId = React.useId();
  const listboxId = `${generatedId}-listbox`;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from Mapbox Geocoding API
  const fetchSuggestions = React.useCallback(
    async (query: string) => {
      if (!mapboxToken || query.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?types=postcode,place&country=us&access_token=${mapboxToken}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    },
    [mapboxToken]
  );

  // Resolve a suggestion to a ZIP code
  const resolveSuggestion = React.useCallback(
    async (suggestion: LocationSuggestion) => {
      setIsOpen(false);
      setSuggestions([]);

      if (suggestion.place_type.includes('postcode')) {
        onZipCodeResolved(suggestion.text, suggestion.text);
        onValueChange(suggestion.text);
        return;
      }

      // For cities, reverse-geocode to get postal code
      if (mapboxToken) {
        const [lng, lat] = suggestion.center;
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=postcode&access_token=${mapboxToken}&limit=1`
          );
          const data = await res.json();
          const zip = data.features?.[0]?.text;
          if (zip) {
            const displayName = suggestion.place_name
              .split(',')
              .slice(0, 2)
              .join(',')
              .trim();
            onZipCodeResolved(zip, displayName);
            onValueChange(displayName);
            return;
          }
        } catch {
          // Fall through
        }
      }

      // Fallback: use text as-is
      onValueChange(suggestion.place_name);
    },
    [mapboxToken, onValueChange, onZipCodeResolved]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onValueChange(newValue);

    // If it's a 5-digit ZIP, resolve immediately
    if (/^\d{5}$/.test(newValue)) {
      onZipCodeResolved(newValue, newValue);
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    // Debounce geocoding calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (mapboxToken && newValue.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(newValue), 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      resolveSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const showGeolocate = Boolean(onGeolocate);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={generatedId} className={labelVariants()}>
          {label}
        </label>
      )}
      <div className="relative">
        {/* Map pin icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
          <MapPinIcon />
        </div>

        <input
          ref={inputRef}
          id={generatedId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${listboxId}-${highlightedIndex}`
              : undefined
          }
          className={cn(
            inputVariants({ hasIcon: true }),
            showGeolocate && 'pr-10'
          )}
          data-cy="input-search-providers-by-location"
        />

        {/* Geolocation button */}
        {showGeolocate && (
          <button
            type="button"
            onClick={onGeolocate}
            disabled={disabled || geolocating}
            className={cn(
              'absolute inset-y-0 right-0 flex items-center pr-3',
              'text-neutral-400 transition-colors hover:text-primary-500',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Use my location"
            title="Use my location"
          >
            {geolocating ? <SpinnerSmallIcon /> : <CrosshairsIcon />}
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg',
            'dark:border-neutral-700 dark:bg-neutral-800',
            'max-h-48 overflow-auto py-1'
          )}
        >
          {suggestions.map((suggestion, index) => {
            const isZip = suggestion.place_type.includes('postcode');
            return (
              <li
                key={suggestion.id}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                onClick={() => resolveSuggestion(suggestion)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                  index === highlightedIndex
                    ? 'dark:bg-primary-900/20 bg-primary-50'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                )}
              >
                <MapPinIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="truncate">{suggestion.place_name}</span>
                {isZip && (
                  <span className="ml-auto shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                    ZIP
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Multi-Select Tag Component
// ============================================================================

interface ServiceTagProps {
  service: ServiceOption;
  onRemove: () => void;
}

function ServiceTag({ service, onRemove }: ServiceTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-xs leading-tight',
        'bg-primary-100 text-primary-800',
        'dark:bg-primary-900/30 dark:text-primary-300'
      )}
    >
      <span className="max-w-[120px] truncate">{service.label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          'shrink-0 rounded-full p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800',
          'focus:outline-none focus:ring-2 focus:ring-primary-500'
        )}
        aria-label={`Remove ${service.label}`}
      >
        <XMarkIcon className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

// ============================================================================
// Service Multi-Select Component
// ============================================================================

interface ServiceMultiSelectProps {
  /** Available services to select from */
  services: ServiceOption[];
  /** Currently selected service values */
  selectedServices: string[];
  /** Called when selection changes */
  onSelectionChange: (services: string[]) => void;
  /** Label for the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Show service counts */
  showCounts?: boolean;
}

export function ServiceMultiSelect({
  services,
  selectedServices,
  onSelectionChange,
  label,
  placeholder = 'All services',
  disabled = false,
  showCounts = false,
}: ServiceMultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter services based on search
  const filteredServices = React.useMemo(() => {
    if (!searchTerm) return services;
    const lowerSearch = searchTerm.toLowerCase();
    return services.filter(
      (service) =>
        service.label.toLowerCase().includes(lowerSearch) ||
        service.category?.toLowerCase().includes(lowerSearch)
    );
  }, [services, searchTerm]);

  // Group services by category
  const groupedServices = React.useMemo(() => {
    const groups: Record<string, ServiceOption[]> = {};
    filteredServices.forEach((service) => {
      const category = service.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(service);
    });
    return groups;
  }, [filteredServices]);

  // Get selected service objects
  const selectedServiceObjects = React.useMemo(
    () => services.filter((s) => selectedServices.includes(s.value)),
    [services, selectedServices]
  );

  function handleToggleService(value: string) {
    if (selectedServices.includes(value)) {
      onSelectionChange(selectedServices.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedServices, value]);
    }
  }

  function handleRemoveService(value: string) {
    onSelectionChange(selectedServices.filter((v) => v !== value));
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' && !isOpen) {
      setIsOpen(true);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && <label className={labelVariants()}>{label}</label>}

      {/* Dropdown trigger - tag input style */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? undefined : 'services-label'}
          className={cn(
            'flex h-10 w-full items-center rounded-md border border-neutral-200 bg-white text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
            'appearance-none bg-no-repeat',
            'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")]',
            'bg-[length:1.5em_1.5em]',
            'bg-[right_0.5rem_center]',
            'pr-8 text-left',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {selectedServiceObjects.length > 0 ? (
            <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 py-1">
              {selectedServiceObjects.map((service) => (
                <ServiceTag
                  key={service.value}
                  service={service}
                  onRemove={() => handleRemoveService(service.value)}
                />
              ))}
            </div>
          ) : (
            <span className="px-3 text-neutral-500 dark:text-neutral-400">
              {placeholder}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg',
            'dark:border-neutral-700 dark:bg-neutral-800',
            'max-h-60 overflow-auto'
          )}
          role="listbox"
          id={listboxId}
          aria-multiselectable="true"
        >
          {/* Search input */}
          <div className="sticky top-0 border-b border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              className={cn(inputVariants({ hasIcon: true }), 'pl-8')}
              autoFocus
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Service options */}
          {Object.entries(groupedServices).length > 0 ? (
            Object.entries(groupedServices).map(
              ([category, categoryServices]) => (
                <div key={category}>
                  {services.some((s) => s.category) && (
                    <div className="bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                      {category}
                    </div>
                  )}
                  {categoryServices.map((service) => {
                    const isSelected = selectedServices.includes(service.value);
                    return (
                      <button
                        key={service.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleToggleService(service.value)}
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                          'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                          isSelected && 'dark:bg-primary-900/20 bg-primary-50'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border',
                              isSelected
                                ? 'border-primary-500 bg-primary-500 text-white'
                                : 'border-neutral-300 dark:border-neutral-600'
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 12 12"
                                fill="currentColor"
                              >
                                <path d="M10.28 2.28L4.75 7.81 1.72 4.78a.75.75 0 00-1.06 1.06l3.75 3.75a.75.75 0 001.06 0l6.25-6.25a.75.75 0 00-1.06-1.06z" />
                              </svg>
                            )}
                          </span>
                          {service.label}
                        </span>
                        {showCounts && service.count !== undefined && (
                          <span className="text-xs text-neutral-400">
                            ({service.count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            )
          ) : (
            <div className="px-3 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No services found
            </div>
          )}

          {/* Clear selection */}
          {selectedServices.length > 0 && (
            <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => onSelectionChange([])}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-center text-sm',
                  'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                )}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main ProviderSearchFilters Component
// ============================================================================

export interface ProviderSearchFiltersProps
  extends VariantProps<typeof containerVariants> {
  /** Current filter values */
  filters: ProviderFilters;
  /** Called when any filter changes */
  onFiltersChange: (filters: ProviderFilters) => void;
  /** Available services for multi-select */
  services?: ServiceOption[];
  /** Available radius options (defaults to DEFAULT_RADIUS_OPTIONS) */
  radiusOptions?: RadiusOption[];
  /** Show provider name search input */
  showNameSearch?: boolean;
  /** Show ZIP code / location input */
  showZipCode?: boolean;
  /** Show radius selector */
  showRadius?: boolean;
  /** Show service filter */
  showServices?: boolean;
  /** Show service counts in dropdown */
  showServiceCounts?: boolean;
  /** Show field labels */
  showLabels?: boolean;
  /** Form ID for associating with submit button */
  formId?: string;
  /** Called when form is submitted */
  onSubmit?: (filters: ProviderFilters) => void;
  /** Loading state */
  loading?: boolean;
  /** Mapbox access token for location autocomplete (enables city name search) */
  mapboxToken?: string;
  /** Called when geolocation button is clicked. If provided, shows geolocation button. */
  onGeolocate?: () => void;
  /** Whether geolocation is in progress */
  geolocating?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ProviderSearchFilters({
  filters,
  onFiltersChange,
  services = [],
  radiusOptions = DEFAULT_RADIUS_OPTIONS,
  showNameSearch = true,
  showZipCode = true,
  showRadius = true,
  showServices = true,
  showServiceCounts = false,
  showLabels = true,
  layout = 'horizontal',
  formId,
  onSubmit,
  loading = false,
  mapboxToken,
  onGeolocate,
  geolocating = false,
  className,
}: ProviderSearchFiltersProps) {
  function handleFieldChange<K extends keyof ProviderFilters>(
    field: K,
    value: ProviderFilters[K]
  ) {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit?.(filters);
  }

  const FormWrapper = onSubmit ? 'form' : 'div';
  const formProps = onSubmit ? { onSubmit: handleSubmit, id: formId } : {};

  return (
    <FormWrapper
      {...formProps}
      className={cn(containerVariants({ layout }), className)}
    >
      {/* Provider Name Search */}
      {showNameSearch && (
        <div className={fieldGroupVariants({ size: 'lg' })}>
          <InputField
            label={showLabels ? 'Provider Name' : undefined}
            icon={<SearchIcon />}
            type="text"
            placeholder="Search by provider"
            value={filters.searchPhrase || ''}
            onChange={(e) => handleFieldChange('searchPhrase', e.target.value)}
            disabled={loading}
            data-cy="input-search-providers-by-name"
          />
        </div>
      )}

      {/* Location (ZIP code or city name) */}
      {showZipCode && (
        <div
          className={fieldGroupVariants({ size: mapboxToken ? 'lg' : 'sm' })}
        >
          <LocationInput
            label={showLabels ? 'Location' : undefined}
            value={filters.locationDisplayName ?? filters.zipCode ?? ''}
            onValueChange={(val) =>
              handleFieldChange('locationDisplayName', val)
            }
            onZipCodeResolved={(zip, displayName) => {
              onFiltersChange({
                ...filters,
                zipCode: zip,
                locationDisplayName: displayName,
              });
            }}
            mapboxToken={mapboxToken}
            onGeolocate={onGeolocate}
            geolocating={geolocating}
            disabled={loading}
            placeholder={mapboxToken ? 'ZIP code or city' : 'ZIP code'}
          />
        </div>
      )}

      {/* Radius Select */}
      {showRadius && (
        <div className={fieldGroupVariants({ size: 'sm' })}>
          <SelectField
            label={showLabels ? 'Radius' : undefined}
            options={radiusOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            value={filters.radius}
            onChange={(e) =>
              handleFieldChange('radius', Number(e.target.value))
            }
            disabled={loading}
            data-cy="select-search-radius"
          />
        </div>
      )}

      {/* Service Multi-Select */}
      {showServices && services.length > 0 && (
        <div className={fieldGroupVariants({ size: 'full' })}>
          <ServiceMultiSelect
            services={services}
            selectedServices={filters.services}
            onSelectionChange={(services) =>
              handleFieldChange('services', services)
            }
            label={showLabels ? 'Services' : undefined}
            placeholder="All services"
            disabled={loading}
            showCounts={showServiceCounts}
          />
        </div>
      )}
    </FormWrapper>
  );
}

// ============================================================================
// Compact Filter Bar (Alternative Layout)
// ============================================================================

export interface CompactFilterBarProps {
  /** Current filter values */
  filters: ProviderFilters;
  /** Called when any filter changes */
  onFiltersChange: (filters: ProviderFilters) => void;
  /** Available services */
  services?: ServiceOption[];
  /** Called when search button is clicked */
  onSearch?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function CompactFilterBar({
  filters,
  onFiltersChange,
  services = [],
  onSearch,
  loading = false,
  className,
}: CompactFilterBarProps) {
  function handleFieldChange<K extends keyof ProviderFilters>(
    field: K,
    value: ProviderFilters[K]
  ) {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg p-3',
        'border border-neutral-200 bg-white shadow-sm',
        'dark:border-neutral-700 dark:bg-neutral-800',
        className
      )}
    >
      {/* Search Input */}
      <div className="min-w-[150px] flex-1">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={filters.searchPhrase || ''}
            onChange={(e) => handleFieldChange('searchPhrase', e.target.value)}
            disabled={loading}
            className={cn(
              'h-9 w-full rounded-md border border-neutral-200 pl-9 pr-3 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'dark:border-neutral-600 dark:bg-neutral-700 dark:text-white'
            )}
          />
        </div>
      </div>

      {/* ZIP + Radius combo */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="ZIP"
          value={filters.zipCode || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 5);
            handleFieldChange('zipCode', value);
          }}
          disabled={loading}
          className={cn(
            'h-9 w-20 rounded-l-md border border-neutral-200 px-3 text-sm',
            'focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary-500',
            'dark:border-neutral-600 dark:bg-neutral-700 dark:text-white'
          )}
        />
        <select
          value={filters.radius}
          onChange={(e) => handleFieldChange('radius', Number(e.target.value))}
          disabled={loading}
          className={cn(
            'h-9 rounded-r-md border border-l-0 border-neutral-200 px-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'dark:border-neutral-600 dark:bg-neutral-700 dark:text-white'
          )}
        >
          {DEFAULT_RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value}mi
            </option>
          ))}
        </select>
      </div>

      {/* Service filter */}
      {services.length > 0 && (
        <div className="min-w-[150px]">
          <select
            value={filters.services[0] || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleFieldChange('services', value ? [value] : []);
            }}
            disabled={loading}
            className={cn(
              'h-9 w-full rounded-md border border-neutral-200 px-3 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'dark:border-neutral-600 dark:bg-neutral-700 dark:text-white',
              !filters.services.length && 'text-neutral-500'
            )}
          >
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search button */}
      {onSearch && (
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className={cn(
            'h-9 rounded-md px-4 text-sm font-medium',
            'bg-primary-500 text-white hover:bg-primary-600',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Active Filters Display
// ============================================================================

export interface ActiveFiltersProps {
  /** Current filter values */
  filters: ProviderFilters;
  /** Service options for label lookup */
  services?: ServiceOption[];
  /** Called to clear a specific filter */
  onClearFilter: (field: keyof ProviderFilters, value?: string) => void;
  /** Called to clear all filters */
  onClearAll: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ActiveFilters({
  filters,
  services = [],
  onClearFilter,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const activeFilters: { key: string; label: string; onClear: () => void }[] =
    [];

  if (filters.searchPhrase) {
    activeFilters.push({
      key: 'searchPhrase',
      label: `"${filters.searchPhrase}"`,
      onClear: () => onClearFilter('searchPhrase'),
    });
  }

  if (filters.zipCode) {
    activeFilters.push({
      key: 'zipCode',
      label: `Near ${filters.locationDisplayName || filters.zipCode}`,
      onClear: () => onClearFilter('zipCode'),
    });
  }

  if (filters.radius !== 25) {
    activeFilters.push({
      key: 'radius',
      label: `Within ${filters.radius} miles`,
      onClear: () => onClearFilter('radius'),
    });
  }

  filters.services.forEach((serviceValue) => {
    const service = services.find((s) => s.value === serviceValue);
    activeFilters.push({
      key: `service-${serviceValue}`,
      label: service?.label || serviceValue,
      onClear: () => onClearFilter('services', serviceValue),
    });
  });

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        Active filters:
      </span>
      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm',
            'bg-neutral-100 text-neutral-700',
            'dark:bg-neutral-700 dark:text-neutral-300'
          )}
        >
          {filter.label}
          <button
            type="button"
            onClick={filter.onClear}
            className="ml-1 rounded-full p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-600"
            aria-label={`Remove filter: ${filter.label}`}
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        Clear all
      </button>
    </div>
  );
}

export default ProviderSearchFilters;
