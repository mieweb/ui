import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { Tooltip } from '../Tooltip';

// ============================================================================
// Types
// ============================================================================

export interface ProviderAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ProviderService {
  _id: string;
  name: string;
  slug: string;
}

export interface Provider {
  _id: string;
  name: string;
  slug: string;
  logoURL?: string;
  address: ProviderAddress;
  workNumber?: string;
  distance?: number;
  services?: ProviderService[];
  verified?: boolean;
  safeFromWildfires?: boolean;
}

// ============================================================================
// Variants
// ============================================================================

const providerCardVariants = cva(
  [
    'group relative flex w-full overflow-hidden rounded-xl',
    'bg-card text-card-foreground',
    'border border-border',
    'shadow-card',
    'transition-all duration-200',
    'hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800',
  ],
  {
    variants: {
      variant: {
        compact: 'flex-col',
        list: 'flex-row items-stretch min-h-[120px]',
        featured: 'flex-col p-6',
      },
      interactive: {
        true: 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'compact',
      interactive: true,
    },
  }
);

const logoContainerVariants = cva(
  'flex items-center justify-center bg-muted overflow-hidden shrink-0',
  {
    variants: {
      variant: {
        compact: 'h-20 w-full',
        list: 'w-28 h-full',
        featured: 'h-32 w-full rounded-lg mb-4',
      },
    },
    defaultVariants: {
      variant: 'compact',
    },
  }
);

// ============================================================================
// Utility Components
// ============================================================================

const ProviderLogo: React.FC<{
  logoURL?: string;
  name: string;
  variant: 'compact' | 'list' | 'featured';
}> = ({ logoURL, name, variant }) => {
  const [hasError, setHasError] = React.useState(false);

  if (!logoURL || hasError) {
    return (
      <div className={cn(logoContainerVariants({ variant }))}>
        <div className="bg-primary-100 dark:bg-primary-900 flex h-12 w-12 items-center justify-center rounded-full">
          <span className="text-primary-800 dark:text-primary-300 text-lg font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(logoContainerVariants({ variant }))}>
      <img
        src={logoURL}
        alt={`${name}'s logo`}
        className="h-full w-full object-contain p-2"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

const DistanceBadge: React.FC<{ distance?: number }> = ({ distance }) => {
  if (distance === undefined) return null;

  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
      <svg
        className="h-3 w-3"
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
      {distance.toFixed(1)}mi
    </span>
  );
};

const SafeFromWildfiresNotice: React.FC = () => (
  <Tooltip content="BlueHive has confirmed that this provider is operational and not impacted by the January 2025 wildfires.">
    <div className="inline-flex items-center gap-1.5 rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span>Operational</span>
    </div>
  </Tooltip>
);

const VerifiedBadge: React.FC = () => (
  <Tooltip content="This provider's information has been verified">
    <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  </Tooltip>
);

// ============================================================================
// Format Utilities
// ============================================================================

/**
 * Format a phone number for display
 */
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Format address for single line display
 */
function formatAddressSingleLine(address: ProviderAddress): string {
  const parts = [address.street1];
  if (address.street2) parts.push(address.street2);
  parts.push(`${address.city}, ${address.state} ${address.postalCode}`);
  return parts.join(', ');
}

// ============================================================================
// Main Component
// ============================================================================

export interface ProviderCardProps
  extends
    VariantProps<typeof providerCardVariants>,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Provider data to display */
  provider: Provider;
  /** Click handler - navigates to provider detail */
  onClick?: (provider: Provider) => void;
  /** Phone click handler */
  onPhoneClick?: (phone: string, provider: Provider) => void;
  /** Show services as badges */
  showServices?: boolean;
  /** Maximum number of services to show */
  maxServices?: number;
  /** Custom render for actions */
  renderActions?: (provider: Provider) => React.ReactNode;
}

/**
 * A card component for displaying provider information in search results and listings.
 *
 * @example
 * ```tsx
 * <ProviderCard
 *   provider={provider}
 *   variant="compact"
 *   onClick={(p) => navigate(`/provider/${p.slug}`)}
 *   onPhoneClick={(phone) => trackPhoneClick(phone)}
 * />
 * ```
 */
export const ProviderCard = React.forwardRef<HTMLDivElement, ProviderCardProps>(
  (
    {
      provider,
      variant = 'compact',
      interactive = true,
      onClick,
      onPhoneClick,
      showServices = false,
      maxServices = 3,
      renderActions,
      className,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent) => {
      // Don't trigger card click if clicking on phone link
      if ((e.target as HTMLElement).closest('[data-phone-link]')) {
        return;
      }
      onClick?.(provider);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(provider);
      }
    };

    const handlePhoneClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (provider.workNumber) {
        onPhoneClick?.(provider.workNumber, provider);
      }
    };

    const displayServices =
      showServices && provider.services?.slice(0, maxServices);
    const remainingServices =
      showServices && provider.services
        ? Math.max(0, provider.services.length - maxServices)
        : 0;

    return (
      <div
        ref={ref}
        className={cn(
          providerCardVariants({ variant, interactive }),
          className
        )}
        onClick={interactive ? handleClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        aria-label={`View ${provider.name}`}
        data-testid="provider-card"
        {...props}
      >
        {/* Logo Section */}
        {(variant === 'compact' || variant === 'featured') && (
          <ProviderLogo
            logoURL={provider.logoURL}
            name={provider.name}
            variant={variant}
          />
        )}
        {variant === 'list' && (
          <ProviderLogo
            logoURL={provider.logoURL}
            name={provider.name}
            variant={variant}
          />
        )}

        {/* Content Section */}
        <div
          className={cn(
            'flex flex-1 flex-col',
            variant === 'compact' && 'p-4',
            variant === 'list' && 'p-4',
            variant === 'featured' && ''
          )}
        >
          {/* Header: Name + Verified */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3
              className={cn(
                'text-primary-800 dark:text-primary-300 line-clamp-2 font-semibold',
                'group-hover:text-primary-900 dark:group-hover:text-primary-200',
                'transition-colors',
                variant === 'featured' ? 'text-lg' : 'text-sm'
              )}
            >
              {provider.name}
            </h3>
            {provider.verified && <VerifiedBadge />}
          </div>

          {/* Address */}
          <p
            className={cn(
              'text-muted-foreground',
              variant === 'featured' ? 'text-sm' : 'text-xs'
            )}
          >
            {variant === 'list' ? (
              formatAddressSingleLine(provider.address)
            ) : (
              <>
                {provider.address.street1}
                {provider.address.street2 && (
                  <>
                    <br />
                    {provider.address.street2}
                  </>
                )}
                <br />
                {provider.address.city}, {provider.address.state}{' '}
                {provider.address.postalCode}
              </>
            )}
          </p>

          {/* Phone */}
          {provider.workNumber && (
            <a
              href={`tel:${provider.workNumber}`}
              data-phone-link
              onClick={handlePhoneClick}
              className={cn(
                'text-primary-800 hover:text-primary-900 mt-1',
                'dark:text-primary-300 dark:hover:text-primary-200',
                'hover:underline',
                variant === 'featured' ? 'text-sm' : 'text-xs'
              )}
            >
              {formatPhoneNumber(provider.workNumber)}
            </a>
          )}

          {/* Services Badges */}
          {displayServices && displayServices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {displayServices.map((service) => (
                <Badge
                  key={service._id}
                  variant="default"
                  size="sm"
                  className="text-xs capitalize"
                >
                  {service.name}
                </Badge>
              ))}
              {remainingServices > 0 && (
                <Badge variant="secondary" size="sm" className="text-xs">
                  +{remainingServices} more
                </Badge>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer: Distance + Actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {provider.safeFromWildfires && <SafeFromWildfiresNotice />}
              {!provider.safeFromWildfires && (
                <DistanceBadge distance={provider.distance} />
              )}
            </div>

            {renderActions?.(provider)}
          </div>
        </div>
      </div>
    );
  }
);

ProviderCard.displayName = 'ProviderCard';

// ============================================================================
// Provider Card Grid
// ============================================================================

export interface ProviderCardGridProps {
  /** Array of providers to display */
  providers: Provider[];
  /** Card variant */
  variant?: 'compact' | 'list';
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Click handler for cards */
  onProviderClick?: (provider: Provider) => void;
  /** Phone click handler */
  onPhoneClick?: (phone: string, provider: Provider) => void;
  /** Show services on cards */
  showServices?: boolean;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * A responsive grid of provider cards with loading and empty states.
 */
export const ProviderCardGrid: React.FC<ProviderCardGridProps> = ({
  providers,
  variant = 'compact',
  loading = false,
  skeletonCount = 6,
  onProviderClick,
  onPhoneClick,
  showServices = false,
  emptyState,
  className,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          variant === 'compact' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          variant === 'list' && 'grid-cols-1',
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProviderCardSkeleton key={index} variant={variant} />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className={cn('py-12 text-center', className)}>
        {emptyState || (
          <div className="text-muted-foreground">
            <svg
              className="mx-auto mb-4 h-12 w-12 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">No providers found</p>
            <p className="mt-1 text-sm">
              Try adjusting your search or expanding your search area.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        variant === 'compact' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        variant === 'list' && 'grid-cols-1',
        className
      )}
    >
      {providers.map((provider) => (
        <ProviderCard
          key={provider._id}
          provider={provider}
          variant={variant}
          onClick={onProviderClick}
          onPhoneClick={onPhoneClick}
          showServices={showServices}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Skeleton
// ============================================================================

export interface ProviderCardSkeletonProps {
  variant?: 'compact' | 'list' | 'featured';
}

export const ProviderCardSkeleton: React.FC<ProviderCardSkeletonProps> = ({
  variant = 'compact',
}) => {
  return (
    <div
      className={cn(
        'border-border bg-card animate-pulse rounded-xl border',
        variant === 'compact' && 'flex flex-col',
        variant === 'list' && 'flex min-h-[120px] flex-row',
        variant === 'featured' && 'flex flex-col p-6'
      )}
    >
      {/* Logo placeholder */}
      <div
        className={cn(
          'bg-muted',
          variant === 'compact' && 'h-20 w-full',
          variant === 'list' && 'h-full w-28',
          variant === 'featured' && 'mb-4 h-32 w-full rounded-lg'
        )}
      />

      {/* Content */}
      <div
        className={cn(
          'flex flex-1 flex-col gap-2',
          variant !== 'featured' && 'p-4'
        )}
      >
        {/* Title */}
        <div className="bg-muted h-4 w-3/4 rounded" />

        {/* Address lines */}
        <div className="bg-muted h-3 w-full rounded" />
        <div className="bg-muted h-3 w-2/3 rounded" />

        {/* Phone */}
        <div className="bg-muted h-3 w-1/3 rounded" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex justify-between">
          <div className="bg-muted h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
};

ProviderCardSkeleton.displayName = 'ProviderCardSkeleton';
