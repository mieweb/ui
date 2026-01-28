import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Tooltip } from '../Tooltip';

// ============================================================================
// Types
// ============================================================================

export interface PostalCodeInfo {
  zipcode: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  streetName?: string;
}

export interface SearchResults {
  count: number;
  postalCode: PostalCodeInfo;
  distance: number;
}

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// Variants
// ============================================================================

const searchBarVariants = cva('', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    variant: {
      default: '',
      hero: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

// ============================================================================
// Icons
// ============================================================================

const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const CrosshairsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
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
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

// ============================================================================
// Geolocation Button Component
// ============================================================================

interface GeolocationButtonProps {
  status: GeolocationStatus;
  onClick: () => void;
  disabled?: boolean;
}

const GeolocationButton: React.FC<GeolocationButtonProps> = ({
  status,
  onClick,
  disabled,
}) => {
  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <SpinnerIcon className="h-4 w-4" />;
      case 'success':
        return (
          <CheckIcon className="text-success animate-in zoom-in h-4 w-4" />
        );
      case 'error':
        return <WarningIcon className="text-destructive h-4 w-4" />;
      default:
        return <CrosshairsIcon className="h-4 w-4" />;
    }
  };

  const getTooltip = () => {
    switch (status) {
      case 'loading':
        return 'Finding your location...';
      case 'success':
        return 'Location found!';
      case 'error':
        return 'Unable to get location. Please enter your ZIP code.';
      default:
        return 'Click to automatically find your location';
    }
  };

  return (
    <Tooltip content={getTooltip()}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled || status === 'loading'}
        className={cn(
          'h-10 w-10 shrink-0',
          status === 'success' && 'text-success',
          status === 'error' && 'text-destructive'
        )}
        aria-label="Find my location"
      >
        {getIcon()}
      </Button>
    </Tooltip>
  );
};

// ============================================================================
// Search Results Message
// ============================================================================

export interface SearchResultsMessageProps {
  results?: SearchResults;
  loading?: boolean;
  onResultsClick?: () => void;
  className?: string;
}

export const SearchResultsMessage: React.FC<SearchResultsMessageProps> = ({
  results,
  loading,
  onResultsClick,
  className,
}) => {
  if (loading) {
    return (
      <div
        className={cn('text-muted-foreground animate-pulse text-sm', className)}
      >
        Searching for providers near you...
      </div>
    );
  }

  if (!results) return null;

  if (results.count === 0) {
    return (
      <div className={cn('text-muted-foreground text-sm', className)}>
        <strong>No providers found</strong> for ZIP code{' '}
        {results.postalCode.zipcode}
      </div>
    );
  }

  const handleClick = () => {
    onResultsClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onResultsClick?.();
    }
  };

  return (
    <div
      className={cn(
        'cursor-pointer text-sm hover:underline',
        'text-primary-foreground/90 dark:text-primary-foreground',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <strong>{results.count.toLocaleString()}</strong> results in{' '}
      {results.postalCode.city}, {results.postalCode.state}
      <br />
      <small>
        Near {results.postalCode.streetName || results.postalCode.zipcode}{' '}
        (within {results.distance} miles) - Click to view
      </small>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface ProviderSearchBarProps
  extends
    VariantProps<typeof searchBarVariants>,
    Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'results'> {
  /** Callback when search is submitted */
  onSearch: (zipCode: string) => void;
  /** Callback when geolocation button is clicked */
  onGeolocate?: () => void;
  /** Current geolocation status */
  geoStatus?: GeolocationStatus;
  /** Total provider count for placeholder */
  providerCount?: number;
  /** Search results to display */
  results?: SearchResults;
  /** Loading state for results */
  resultsLoading?: boolean;
  /** Callback when results message is clicked */
  onResultsClick?: () => void;
  /** Initial ZIP code value */
  defaultValue?: string;
  /** Controlled ZIP code value */
  value?: string;
  /** Controlled value change handler */
  onValueChange?: (value: string) => void;
  /** Placeholder text override */
  placeholder?: string;
  /** Whether the search is currently loading */
  loading?: boolean;
  /** Error message to display */
  error?: string;
  /** Show results message below search */
  showResults?: boolean;
}

/**
 * A search bar component for finding healthcare providers by ZIP code.
 *
 * @example
 * ```tsx
 * <ProviderSearchBar
 *   onSearch={(zip) => searchProviders(zip)}
 *   onGeolocate={handleGeolocate}
 *   geoStatus={geoStatus}
 *   providerCount={17500}
 * />
 * ```
 */
export const ProviderSearchBar = React.forwardRef<
  HTMLFormElement,
  ProviderSearchBarProps
>(
  (
    {
      onSearch,
      onGeolocate,
      geoStatus = 'idle',
      providerCount,
      results,
      resultsLoading,
      onResultsClick,
      defaultValue,
      value,
      onValueChange,
      placeholder,
      loading,
      error,
      showResults = true,
      size,
      variant,
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      defaultValue || ''
    );
    const [validationError, setValidationError] = React.useState<string | null>(
      null
    );

    const zipValue = value ?? internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValidationError(null);

      if (onValueChange) {
        onValueChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // Validate ZIP code
      if (!zipValue) {
        setValidationError('Please enter a ZIP code');
        return;
      }

      const cleanZip = zipValue.replace(/\D/g, '');
      if (cleanZip.length !== 5) {
        setValidationError('Please enter a valid 5-digit ZIP code');
        return;
      }

      setValidationError(null);
      onSearch(cleanZip);
    };

    const handleGeolocate = () => {
      onGeolocate?.();
    };

    const placeholderText =
      placeholder ||
      (providerCount
        ? `Search our ${providerCount.toLocaleString()} providers by ZIP`
        : 'Search providers by ZIP code');

    const displayError = error || validationError;

    return (
      <div
        className={cn(
          'w-full',
          searchBarVariants({ size, variant }),
          className
        )}
      >
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className="w-full"
          role="search"
          aria-label="Provider search"
          {...props}
        >
          <div
            className={cn(
              'bg-background flex items-center gap-1 rounded-lg border',
              'focus-within:ring-primary-500 focus-within:ring-2 focus-within:ring-offset-2',
              displayError && 'border-destructive',
              !displayError && 'border-input'
            )}
          >
            {/* Geolocation Button */}
            {onGeolocate && (
              <GeolocationButton
                status={geoStatus}
                onClick={handleGeolocate}
                disabled={loading}
              />
            )}

            {/* ZIP Code Input */}
            <div className="min-w-0 flex-1">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={zipValue}
                onChange={handleChange}
                placeholder={placeholderText}
                disabled={loading}
                aria-label="ZIP code"
                aria-invalid={!!displayError}
                aria-describedby={displayError ? 'search-error' : undefined}
                className={cn(
                  'border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
                  'w-full',
                  onGeolocate ? 'pl-0' : 'pl-3'
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={loading}
              className="h-10 w-10 shrink-0"
              aria-label="Search"
            >
              {loading ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Error Message */}
          {displayError && (
            <p
              id="search-error"
              className="text-destructive mt-2 text-sm"
              role="alert"
            >
              {displayError}
            </p>
          )}
        </form>

        {/* Results Message */}
        {showResults && (results || resultsLoading) && (
          <div className="mt-3">
            <SearchResultsMessage
              results={results}
              loading={resultsLoading}
              onResultsClick={onResultsClick}
            />
          </div>
        )}
      </div>
    );
  }
);

ProviderSearchBar.displayName = 'ProviderSearchBar';

// ============================================================================
// Hero Search Bar Variant
// ============================================================================

export interface HeroSearchBarProps extends ProviderSearchBarProps {
  /** Hero title text */
  title?: string;
  /** Hero subtitle text */
  subtitle?: string;
}

/**
 * A hero-style search bar for landing pages with optional title and subtitle.
 */
export const HeroSearchBar: React.FC<HeroSearchBarProps> = ({
  title,
  subtitle,
  className,
  ...props
}) => {
  return (
    <div className={cn('text-center', className)}>
      {title && (
        <h1 className="text-foreground mb-2 text-3xl font-bold md:text-4xl lg:text-5xl">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-muted-foreground mb-6 text-lg md:text-xl">
          {subtitle}
        </p>
      )}
      <div className="mx-auto max-w-xl">
        <ProviderSearchBar {...props} variant="hero" />
      </div>
    </div>
  );
};

HeroSearchBar.displayName = 'HeroSearchBar';
