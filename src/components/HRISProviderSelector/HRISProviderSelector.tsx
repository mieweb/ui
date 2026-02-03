'use client';

import * as React from 'react';
import { cn } from '../../utils';

export interface HRISProvider {
  /** Provider ID (from Finch) */
  id: string;
  /** Display name */
  displayName: string;
  /** Logo URL */
  logoUrl?: string;
  /** Whether this provider is currently connected */
  connected?: boolean;
  /** Connection status message */
  statusMessage?: string;
  /** Last sync timestamp */
  lastSync?: Date | string;
}

export interface HRISProviderSelectorProps {
  /** Available HRIS providers */
  providers: HRISProvider[];
  /** Currently connected provider */
  currentProvider?: HRISProvider;
  /** Callback when provider is selected */
  onProviderSelect?: (provider: HRISProvider) => void;
  /** Callback to disconnect current provider */
  onDisconnect?: () => void;
  /** Callback to reconnect/refresh sync */
  onRefreshSync?: () => void;
  /** Whether providers are loading */
  loading?: boolean;
  /** Search query */
  searchQuery?: string;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  /** Whether to show the CSV import option */
  showCSVOption?: boolean;
  /** Callback for CSV import */
  onCSVImport?: () => void;
  /** Custom class name */
  className?: string;
  /** Labels */
  labels?: {
    search?: string;
    importCSV?: string;
    connected?: string;
    lastSync?: string;
    disconnect?: string;
    refreshSync?: string;
    noProviders?: string;
    syncPending?: string;
    supportEmail?: string;
  };
}

export function HRISProviderSelector({
  providers,
  currentProvider,
  onProviderSelect,
  onDisconnect,
  onRefreshSync,
  loading = false,
  searchQuery = '',
  onSearchChange,
  showCSVOption = true,
  onCSVImport,
  className,
  labels = {},
}: HRISProviderSelectorProps) {
  const {
    search = 'Search HR Providers...',
    importCSV = 'Import from CSV',
    lastSync = 'Last HRIS Sync',
    disconnect = 'Disconnect',
    refreshSync = 'Update Employees',
    noProviders = 'No providers found',
    syncPending = 'We are still waiting on data from your HRIS Provider. Please check back later.',
    supportEmail = 'support@bluehive.com',
  } = labels;

  const filteredProviders = React.useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const query = searchQuery.toLowerCase();
    return providers.filter((p) => p.displayName.toLowerCase().includes(query));
  }, [providers, searchQuery]);

  const formatLastSync = (date?: Date | string) => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  // If there's a connected provider, show the connection status
  if (currentProvider) {
    return (
      <div className={cn('hris-provider-selector', className)}>
        <div className="border-border bg-muted/50 rounded-lg border p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Provider Logo */}
            {currentProvider.logoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={currentProvider.logoUrl}
                  alt={currentProvider.displayName}
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}

            {/* Provider Info */}
            <div className="flex-1">
              <h4 className="text-foreground text-lg font-bold">
                {currentProvider.displayName}
              </h4>
              <p className="text-muted-foreground text-sm">
                Your data will automatically sync as we receive updates from{' '}
                {currentProvider.displayName}. For issues, change requests, or
                additional information regarding your HRIS connection, please
                email{' '}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-primary hover:underline"
                >
                  {supportEmail}
                </a>
                .
              </p>

              <div className="mt-2 text-sm">
                <strong>{lastSync}:</strong>{' '}
                <span className="text-primary">
                  {formatLastSync(currentProvider.lastSync)}
                </span>
              </div>

              {!currentProvider.lastSync && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 p-3 text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
                  <i className="fas fa-exclamation-triangle text-lg" />
                  <span className="text-sm">{syncPending}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onDisconnect}
              className="border-border bg-card text-foreground hover:bg-muted rounded-lg border px-4 py-2"
            >
              <i className="fas fa-link-slash mr-2" />
              {disconnect}
            </button>
            <button
              type="button"
              onClick={onRefreshSync}
              className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-white"
            >
              <i className="fas fa-rotate mr-2" />
              {refreshSync}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show provider selection grid
  return (
    <div className={cn('hris-provider-selector', className)}>
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
            <i className="fas fa-search" />
          </span>
          <input
            type="search"
            placeholder={search}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="focus:border-primary focus:ring-primary border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-1 focus:outline-none"
          />
        </div>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {/* CSV Import Option */}
        {showCSVOption && (
          <button
            type="button"
            onClick={onCSVImport}
            className="border-border bg-card dark:hover:bg-muted/50 flex flex-col items-center justify-center rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex h-16 w-16 items-center justify-center">
              <img
                src="/images/app/icon-csv.svg"
                alt="CSV"
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove(
                    'hidden'
                  );
                }}
              />
              <i className="fas fa-file-csv text-muted-foreground hidden text-4xl" />
            </div>
            <span className="text-foreground text-center text-sm font-medium">
              {importCSV}
            </span>
          </button>
        )}

        {/* Loading State */}
        {loading && (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="border-border bg-card flex flex-col items-center justify-center rounded-lg border p-4 shadow-sm"
              >
                <div className="bg-muted mb-3 h-16 w-16 animate-pulse rounded-lg" />
                <div className="bg-muted h-4 w-20 animate-pulse rounded" />
              </div>
            ))}
          </>
        )}

        {/* Provider Cards */}
        {!loading &&
          filteredProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => onProviderSelect?.(provider)}
              className="border-border bg-card dark:hover:bg-muted/50 flex flex-col items-center justify-center rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-16 w-16 items-center justify-center">
                {provider.logoUrl ? (
                  <>
                    <img
                      src={provider.logoUrl}
                      alt={provider.displayName}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        // Hide broken image and show fallback
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className="bg-muted text-muted-foreground hidden h-12 w-12 items-center justify-center rounded-lg text-lg font-bold">
                      {provider.displayName
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold">
                    {provider.displayName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-foreground text-center text-sm font-medium">
                {provider.displayName}
              </span>
            </button>
          ))}

        {/* No Results */}
        {!loading && filteredProviders.length === 0 && (
          <div className="text-muted-foreground col-span-full py-8 text-center">
            {noProviders}
          </div>
        )}
      </div>
    </div>
  );
}

export default HRISProviderSelector;
