import * as React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface NearbyProviderAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface NearbyProviderData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address?: NearbyProviderAddress;
  phoneNumber?: string;
  distance: number; // in miles
}

// =============================================================================
// Nearby Provider Card
// =============================================================================

export interface NearbyProviderCardProps {
  provider: NearbyProviderData;
  /** Link component or function (for React Router compatibility) */
  LinkComponent?: React.ComponentType<{
    to: string;
    className?: string;
    children: React.ReactNode;
  }>;
  /** Phone number formatter function */
  formatPhone?: (phone: string) => string;
  className?: string;
}

/**
 * Card displaying a nearby provider with logo, address, phone, and distance.
 * Matches the bluehive.com production design.
 */
export function NearbyProviderCard({
  provider,
  LinkComponent,
  formatPhone = defaultFormatPhone,
  className,
}: NearbyProviderCardProps) {
  const { name, slug, logoUrl, address, phoneNumber, distance } = provider;

  // Use custom Link component or default anchor
  const LinkWrapper = LinkComponent
    ? ({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) => (
        <LinkComponent to={to} className={className}>
          {children}
        </LinkComponent>
      )
    : ({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) => (
        <a href={to} className={className}>
          {children}
        </a>
      );

  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <LinkWrapper to={`/provider/${slug}`} className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="h-16 w-16 rounded-lg object-contain"
              onError={(e) => {
                // Hide broken image and show fallback
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-lg bg-primary-100 text-xl font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
              logoUrl && 'hidden'
            )}
          >
            {initials}
          </div>
        </LinkWrapper>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name & Distance */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <LinkWrapper
              to={`/provider/${slug}`}
              className="text-base font-semibold text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
            >
              {name}
            </LinkWrapper>
            <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {distance.toFixed(2)}
              </span>{' '}
              <span className="text-xs uppercase">mi</span>
            </span>
          </div>

          {/* Address */}
          {address && (
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              <div>{address.street1}</div>
              {address.street2 && <div>{address.street2}</div>}
              <div>
                {address.city}, {address.state} {address.postalCode}
              </div>
            </div>
          )}

          {/* Phone */}
          {phoneNumber && (
            <a
              href={`tel:${phoneNumber}`}
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <PhoneIcon className="h-4 w-4" />
              {formatPhone(phoneNumber)}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Nearby Providers List
// =============================================================================

export interface NearbyProvidersListProps {
  providers: NearbyProviderData[];
  /** Show maximum N providers */
  maxProviders?: number;
  /** Zipcode for "Show more" link */
  zipcode?: string;
  /** Link component for React Router */
  LinkComponent?: NearbyProviderCardProps['LinkComponent'];
  /** Phone formatter */
  formatPhone?: (phone: string) => string;
  /** Title */
  title?: string;
  /** Show concierge banner */
  showConciergeBanner?: boolean;
  className?: string;
}

export function NearbyProvidersList({
  providers,
  maxProviders = 3,
  zipcode,
  LinkComponent,
  formatPhone,
  title = 'Nearby Providers',
  showConciergeBanner = true,
  className,
}: NearbyProvidersListProps) {
  const displayedProviders = providers.slice(0, maxProviders);

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Title */}
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <LocationIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        {title}
      </h2>

      {/* Concierge Banner */}
      {showConciergeBanner && <ConciergeBanner />}

      {/* Provider Cards */}
      <div className="space-y-3">
        {displayedProviders.map((provider) => (
          <NearbyProviderCard
            key={provider.id}
            provider={provider}
            LinkComponent={LinkComponent}
            formatPhone={formatPhone}
          />
        ))}
      </div>

      {/* Show More Link */}
      {zipcode && (
        <a
          href={`/providers/search/${zipcode}/25`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          <LocationIcon className="h-4 w-4" />
          SHOW PROVIDERS IN {zipcode}
        </a>
      )}
    </div>
  );
}

// =============================================================================
// Concierge Banner
// =============================================================================

function ConciergeBanner() {
  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
      <div className="flex items-center gap-4">
        <img
          src="/images/logos/bluehive-concierge.png"
          alt="BlueHive Concierge"
          className="h-12 w-auto"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We handle every step for you — from scheduling to results.
          </p>
          <a
            href="https://bluehive.com/concierge/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            LEARN MORE
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function defaultFormatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// =============================================================================
// Icons
// =============================================================================

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default NearbyProviderCard;
