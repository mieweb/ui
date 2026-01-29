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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-3 px-3 border rounded-lg bg-white dark:bg-gray-800 text-left transition-colors',
          'border-gray-300 dark:border-gray-600',
          'hover:border-gray-400 dark:hover:border-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeStyles[size]
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 flex-1">
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
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
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-medium">
                {getInitials(selectedProvider.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {selectedProvider.name}
              </div>
              {selectedProvider.location && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
            'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
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
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
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
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-sm font-medium">
                      {getInitials(provider.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
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
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    {(provider.location || provider.type) && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {[provider.type, provider.location]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    )}
                  </div>

                  {/* Selected checkmark */}
                  {selectedProvider?.id === provider.id && (
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0"
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
