'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
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
 * Filter state object
 */
export interface ProviderFilters {
  /** Provider name/search phrase */
  searchPhrase?: string;
  /** ZIP code */
  zipCode?: string;
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

// ============================================================================
// Sub-components
// ============================================================================

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

function InputField({ label, icon, className, id, ...props }: InputFieldProps) {
  const inputId = id || React.useId();

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

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
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
  const selectId = id || React.useId();

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
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm',
        'bg-primary-100 text-primary-800',
        'dark:bg-primary-900/30 dark:text-primary-300'
      )}
    >
      {service.label}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5',
          'focus:ring-primary-500 focus:ring-2 focus:outline-none'
        )}
        aria-label={`Remove ${service.label}`}
      >
        <XMarkIcon className="h-3 w-3" />
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
  label = 'Services',
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

      {/* Selected tags display */}
      {selectedServiceObjects.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedServiceObjects.map((service) => (
            <ServiceTag
              key={service.value}
              service={service}
              onRemove={() => handleRemoveService(service.value)}
            />
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
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
            selectVariants(),
            'w-full text-left',
            !selectedServices.length &&
              'text-neutral-500 dark:text-neutral-400',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {selectedServices.length > 0
            ? `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} selected`
            : placeholder}
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
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <SearchIcon className="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Service options */}
          {Object.entries(groupedServices).length > 0 ? (
            Object.entries(groupedServices).map(
              ([category, categoryServices]) => (
                <div key={category}>
                  {services.some((s) => s.category) && (
                    <div className="bg-neutral-50 px-3 py-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:bg-neutral-900 dark:text-neutral-400">
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
                          isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border',
                              isSelected
                                ? 'bg-primary-500 border-primary-500 text-white'
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

export interface ProviderSearchFiltersProps extends VariantProps<
  typeof containerVariants
> {
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
  /** Show ZIP code input */
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

      {/* ZIP Code */}
      {showZipCode && (
        <div className={fieldGroupVariants({ size: 'sm' })}>
          <InputField
            label={showLabels ? 'ZIP Code' : undefined}
            icon={<MapPinIcon />}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="ZIP code"
            value={filters.zipCode || ''}
            onChange={(e) => {
              // Only allow digits
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              handleFieldChange('zipCode', value);
            }}
            disabled={loading}
            data-cy="input-search-providers-by-zip"
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
          <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={filters.searchPhrase || ''}
            onChange={(e) => handleFieldChange('searchPhrase', e.target.value)}
            disabled={loading}
            className={cn(
              'h-9 w-full rounded-md border border-neutral-200 pr-3 pl-9 text-sm',
              'focus:ring-primary-500 focus:ring-2 focus:outline-none',
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
            'focus:ring-primary-500 focus:z-10 focus:ring-2 focus:outline-none',
            'dark:border-neutral-600 dark:bg-neutral-700 dark:text-white'
          )}
        />
        <select
          value={filters.radius}
          onChange={(e) => handleFieldChange('radius', Number(e.target.value))}
          disabled={loading}
          className={cn(
            'h-9 rounded-r-md border border-l-0 border-neutral-200 px-2 text-sm',
            'focus:ring-primary-500 focus:ring-2 focus:outline-none',
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
              'focus:ring-primary-500 focus:ring-2 focus:outline-none',
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
            'bg-primary-500 hover:bg-primary-600 text-white',
            'focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 focus:outline-none',
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
      label: `Near ${filters.zipCode}`,
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
        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
      >
        Clear all
      </button>
    </div>
  );
}

export default ProviderSearchFilters;
