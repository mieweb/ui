import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

/**
 * Standard address structure used throughout the application.
 * This is the canonical type for all address data.
 */
export interface AddressData {
  /** Primary street address (e.g., "123 Healthcare Way") */
  street1: string;
  /** Secondary address line (e.g., "Suite 500", "Building A") */
  street2?: string;
  /** City name */
  city: string;
  /** State/province code or name (e.g., "IN", "Indiana") */
  state: string;
  /** ZIP/postal code */
  postalCode: string;
  /** Country (optional, defaults to US) */
  country?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generates a Google Maps directions URL for an address.
 */
export function getGoogleMapsUrl(address: AddressData): string {
  const addressString = formatAddressSingleLine(address);
  return `https://www.google.com/maps?daddr=${encodeURIComponent(addressString)}`;
}

/**
 * Generates a Google Maps search URL for an address.
 */
export function getGoogleMapsSearchUrl(address: AddressData): string {
  const addressString = formatAddressSingleLine(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
}

/**
 * Formats an address as a single line string.
 * Example: "123 Healthcare Way, Suite 500, Indianapolis, IN 46220"
 */
export function formatAddressSingleLine(address: AddressData): string {
  const parts = [address.street1];
  if (address.street2) parts.push(address.street2);
  parts.push(`${address.city}, ${address.state} ${address.postalCode}`);
  return parts.join(', ');
}

/**
 * Formats an address as a multi-line string array.
 * Example: ["123 Healthcare Way", "Suite 500", "Indianapolis, IN 46220"]
 */
export function formatAddressLines(address: AddressData): string[] {
  const lines = [address.street1];
  if (address.street2) lines.push(address.street2);
  lines.push(`${address.city}, ${address.state} ${address.postalCode}`);
  return lines;
}

/**
 * Formats just the city, state, and postal code.
 * Example: "Indianapolis, IN 46220"
 */
export function formatCityStateZip(address: AddressData): string {
  return `${address.city}, ${address.state} ${address.postalCode}`;
}

/**
 * Formats just the city and state.
 * Example: "Indianapolis, Indiana" or "Indianapolis, IN"
 */
export function formatCityState(address: AddressData): string {
  return `${address.city}, ${address.state}`;
}

// =============================================================================
// Address Component Variants
// =============================================================================

const addressVariants = cva('', {
  variants: {
    /**
     * Display format:
     * - block: Multi-line display (default)
     * - inline: Single line with comma separation
     * - compact: City, State only
     */
    format: {
      block: 'block',
      inline: 'inline',
      compact: 'inline',
    },
    /**
     * Visual size
     */
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    format: 'block',
    size: 'md',
  },
});

// =============================================================================
// Address Component
// =============================================================================

export interface AddressProps
  extends
    VariantProps<typeof addressVariants>,
    Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The address data to display */
  address: AddressData;
  /**
   * Whether to link to Google Maps.
   * - true: Link to directions
   * - 'directions': Link to directions
   * - 'search': Link to search/location
   * - false: No link
   */
  linkToMaps?: boolean | 'directions' | 'search';
  /** Whether to show a map pin icon */
  showIcon?: boolean;
  /** Custom icon to display (overrides default map pin) */
  icon?: React.ReactNode;
  /** Whether to hide the street address (show only city/state/zip) */
  hideStreet?: boolean;
  /** Whether to hide the postal code */
  hidePostalCode?: boolean;
}

/**
 * A flexible, reusable address display component.
 *
 * Supports multiple formats:
 * - Block (multi-line) for detail pages
 * - Inline (single-line) for cards and lists
 * - Compact (city/state only) for space-constrained layouts
 *
 * @example
 * ```tsx
 * // Full block address with map link
 * <Address
 *   address={{ street1: "123 Main St", city: "Indianapolis", state: "IN", postalCode: "46220" }}
 *   linkToMaps
 * />
 *
 * // Inline format for cards
 * <Address address={address} format="inline" size="sm" />
 *
 * // Compact city/state only
 * <Address address={address} format="compact" />
 *
 * // With icon
 * <Address address={address} showIcon />
 * ```
 */
export function Address({
  address,
  format = 'block',
  size = 'md',
  linkToMaps = false,
  showIcon = false,
  icon,
  hideStreet = false,
  hidePostalCode = false,
  className,
  ...props
}: AddressProps) {
  // Build the address content based on format
  const renderContent = () => {
    if (format === 'compact') {
      return hidePostalCode
        ? formatCityState(address)
        : formatCityStateZip(address);
    }

    if (format === 'inline') {
      if (hideStreet) {
        return hidePostalCode
          ? formatCityState(address)
          : formatCityStateZip(address);
      }
      return formatAddressSingleLine(address);
    }

    // Block format
    if (hideStreet) {
      return hidePostalCode
        ? formatCityState(address)
        : formatCityStateZip(address);
    }

    return (
      <>
        {address.street1}
        {address.street2 && (
          <>
            <br />
            {address.street2}
          </>
        )}
        <br />
        {hidePostalCode
          ? formatCityState(address)
          : formatCityStateZip(address)}
      </>
    );
  };

  const content = renderContent();

  // Determine the maps URL
  const getMapsUrl = () => {
    if (!linkToMaps) return null;
    if (linkToMaps === 'search') return getGoogleMapsSearchUrl(address);
    return getGoogleMapsUrl(address);
  };

  const mapsUrl = getMapsUrl();

  // The icon element
  const iconElement = showIcon
    ? icon || <MapPinIcon className="h-4 w-4 shrink-0" />
    : null;

  // Base styling
  const baseStyles = cn(
    addressVariants({ format, size }),
    'text-gray-600 dark:text-gray-300',
    className
  );

  // Wrapper for icon + content
  const wrapWithIcon = (children: React.ReactNode) => {
    if (!iconElement) return children;
    return (
      <span
        className={cn(
          'inline-flex items-start gap-2',
          format === 'inline' && 'items-center'
        )}
      >
        {iconElement}
        <span>{children}</span>
      </span>
    );
  };

  // If linked to maps
  if (mapsUrl) {
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          baseStyles,
          'hover:text-primary-600 dark:hover:text-primary-400 hover:underline',
          'focus:ring-primary-500 rounded focus:ring-2 focus:ring-offset-2 focus:outline-none'
        )}
        {...props}
      >
        {wrapWithIcon(content)}
      </a>
    );
  }

  // Non-linked address (semantic <address> tag for block format)
  if (format === 'block') {
    return (
      <address className={cn(baseStyles, 'not-italic')} {...props}>
        {wrapWithIcon(content)}
      </address>
    );
  }

  return (
    <span className={baseStyles} {...props}>
      {wrapWithIcon(content)}
    </span>
  );
}

// =============================================================================
// AddressCard - A styled card wrapper for addresses
// =============================================================================

export interface AddressCardProps extends AddressProps {
  /** Title/label for the address (e.g., "Main Office", "Mailing Address") */
  title?: string;
  /** Optional phone number to display */
  phoneNumber?: string;
  /** Click handler for phone number */
  onPhoneClick?: (phone: string) => void;
}

/**
 * A card-style address display with optional title and phone number.
 *
 * @example
 * ```tsx
 * <AddressCard
 *   title="Main Office"
 *   address={address}
 *   phoneNumber="(317) 555-1234"
 *   linkToMaps
 * />
 * ```
 */
export function AddressCard({
  title,
  address,
  phoneNumber,
  onPhoneClick,
  className,
  ...addressProps
}: AddressCardProps) {
  const handlePhoneClick = (e: React.MouseEvent) => {
    if (onPhoneClick) {
      e.preventDefault();
      onPhoneClick(phoneNumber!);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {title && (
        <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h4>
      )}
      <Address address={address} showIcon {...addressProps} />
      {phoneNumber && (
        <a
          href={`tel:${phoneNumber.replace(/\D/g, '')}`}
          onClick={handlePhoneClick}
          className="hover:text-primary-600 dark:hover:text-primary-400 mt-2 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <PhoneIcon className="h-4 w-4" />
          {phoneNumber}
        </a>
      )}
    </div>
  );
}

// =============================================================================
// AddressInline - Convenience component for inline addresses
// =============================================================================

export type AddressInlineProps = Omit<AddressProps, 'format'>;

/**
 * Convenience component for inline address display.
 * Shorthand for `<Address format="inline" />`.
 */
export function AddressInline(props: AddressInlineProps) {
  return <Address format="inline" {...props} />;
}

// =============================================================================
// AddressCompact - Convenience component for compact addresses
// =============================================================================

export type AddressCompactProps = Omit<
  AddressProps,
  'format' | 'hideStreet'
>;

/**
 * Convenience component for compact city/state display.
 * Shorthand for `<Address format="compact" />`.
 */
export function AddressCompact(props: AddressCompactProps) {
  return <Address format="compact" {...props} />;
}

// =============================================================================
// Icons
// =============================================================================

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}
