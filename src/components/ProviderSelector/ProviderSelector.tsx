'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ProviderOption {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short code or abbreviation */
  code?: string;
  /** Location or address */
  location?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Whether this provider is active */
  isActive?: boolean;
  /** Provider type */
  type?: string;
}

export interface ProviderSelectorProps {
  /** Currently selected provider */
  selectedProvider?: ProviderOption | null;
  /** Available providers */
  providers: ProviderOption[];
  /** Handler for provider change */
  onSelect?: (provider: ProviderOption) => void;
  /** Label text */
  label?: string;
  /** Placeholder when no provider selected */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Show search input */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

/**
 * ProviderSelector provides a dropdown to switch between providers/organizations.
 */
export function ProviderSelector({
  selectedProvider,
  providers,
  onSelect,
  label,
  placeholder = 'Select provider...',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search providers...',
  isLoading = false,
  size = 'md',
  className,
}: ProviderSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
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

  // Close on escape
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Reset search when closing
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredProviders = React.useMemo(() => {
    if (!searchQuery) return providers;
    const query = searchQuery.toLowerCase();
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.code?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  const handleSelect = (provider: ProviderOption) => {
    onSelect?.(provider);
    setIsOpen(false);
  };

  const sizeStyles = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border bg-white px-3 text-left transition-colors dark:bg-gray-800',
          'border-gray-300 dark:border-gray-600',
          'hover:border-gray-400 dark:hover:border-gray-500',
          'focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          sizeStyles[size]
        )}
      >
        {isLoading ? (
          <div className="flex flex-1 items-center gap-2">
            <svg
              className="h-5 w-5 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
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
            <span className="text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        ) : selectedProvider ? (
          <>
            {/* Provider avatar/logo */}
            {selectedProvider.logoUrl ? (
              <img
                src={selectedProvider.logoUrl}
                alt={selectedProvider.name}
                className="h-6 w-6 rounded object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                {getInitials(selectedProvider.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900 dark:text-white">
                {selectedProvider.name}
              </div>
              {selectedProvider.location && (
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {selectedProvider.location}
                </div>
              )}
            </div>
          </>
        ) : (
          <span className="flex-1 text-gray-500 dark:text-gray-400">
            {placeholder}
          </span>
        )}

        {/* Dropdown arrow */}
        <svg
          className={cn(
            'h-4 w-4 flex-shrink-0 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* Search */}
          {searchable && (
            <div className="border-b border-gray-200 p-2 dark:border-gray-700">
              <div className="relative">
                <svg
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pr-4 pl-9 text-sm text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredProviders.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                No providers found
              </div>
            ) : (
              filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleSelect(provider)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    selectedProvider?.id === provider.id &&
                      'bg-blue-50 dark:bg-blue-900/30'
                  )}
                >
                  {/* Provider avatar/logo */}
                  {provider.logoUrl ? (
                    <img
                      src={provider.logoUrl}
                      alt={provider.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {getInitials(provider.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {provider.name}
                      </span>
                      {provider.code && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({provider.code})
                        </span>
                      )}
                      {provider.isActive === false && (
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    {(provider.location || provider.type) && (
                      <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {[provider.type, provider.location]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    )}
                  </div>

                  {/* Selected checkmark */}
                  {selectedProvider?.id === provider.id && (
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderSelector;
