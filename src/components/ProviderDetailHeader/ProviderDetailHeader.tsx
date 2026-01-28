import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface ProviderAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ProviderUrls {
  website?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  yelp?: string;
  youtube?: string;
  pinterest?: string;
  blog?: string;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface ProviderDetailData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address: ProviderAddress;
  phoneNumber?: string;
  urls?: ProviderUrls;
  isVerified?: boolean;
  isClaimed?: boolean;
  lastUpdated?: Date | string;
}

// =============================================================================
// Action Button Bar
// =============================================================================

const actionButtonVariants = cva(
  'flex flex-col items-center justify-center gap-1 py-3 px-2 text-sm font-normal transition-colors',
  {
    variants: {
      variant: {
        default:
          'text-gray-600 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800',
        active:
          'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ActionButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  icon: React.ReactNode;
  label: string;
  href?: string;
}

export function ActionButton({
  icon,
  label,
  variant,
  href,
  className,
  onClick,
  ...props
}: ActionButtonProps) {
  const content = (
    <>
      <span className="text-xl">{icon}</span>
      <span className="text-xs whitespace-nowrap">{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          actionButtonVariants({ variant: variant ?? 'default' }),
          className
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        actionButtonVariants({ variant: variant ?? 'default' }),
        className
      )}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}

// =============================================================================
// Action Buttons Bar
// =============================================================================

export interface ActionButtonsBarProps {
  provider: ProviderDetailData;
  onShare?: () => void;
  onCopyLink?: () => void;
  onCall?: (phoneNumber: string) => void;
  className?: string;
}

export function ActionButtonsBar({
  provider,
  onShare,
  onCopyLink,
  onCall,
  className,
}: ActionButtonsBarProps) {
  const { address, phoneNumber, urls } = provider;

  const directionsUrl = `https://www.google.com/maps?daddr=${encodeURIComponent(
    `${address.street1}, ${address.city}, ${address.state} ${address.postalCode}`
  )}`;

  return (
    <div
      className={cn(
        'flex justify-center border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex overflow-x-auto">
        <ActionButton
          icon={<DirectionsIcon />}
          label="Directions"
          href={directionsUrl}
        />

        {phoneNumber && (
          <ActionButton
            icon={<PhoneIcon />}
            label="Call"
            onClick={() => onCall?.(phoneNumber)}
          />
        )}

        {urls?.website && (
          <ActionButton
            icon={<WebsiteIcon />}
            label="Website"
            href={urls.website}
          />
        )}

        <ActionButton icon={<ShareIcon />} label="Share" onClick={onShare} />

        <ActionButton
          icon={<CopyIcon />}
          label="Copy Link"
          onClick={onCopyLink}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Breadcrumb Navigation
// =============================================================================

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('py-2', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="mx-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
            {index === items.length - 1 ? (
              <span className="max-w-[200px] truncate font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// =============================================================================
// Mobile Back Button
// =============================================================================

export interface MobileBackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function MobileBackButton({
  href,
  label = 'Back',
  className,
}: MobileBackButtonProps) {
  return (
    <div className={cn('py-2 sm:hidden', className)}>
      <a
        href={href}
        className="bg-primary-600 hover:bg-primary-700 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        {label}
      </a>
    </div>
  );
}

// =============================================================================
// Provider Logo
// =============================================================================

export interface ProviderLogoProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const logoSizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export function ProviderLogo({
  src,
  name,
  size = 'md',
  className,
}: ProviderLogoProps) {
  const [hasError, setHasError] = React.useState(false);

  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          logoSizeClasses[size],
          'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center rounded-lg font-bold',
          size === 'sm' && 'text-lg',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-3xl',
          className
        )}
        aria-label={`${name} logo`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      className={cn(
        logoSizeClasses[size],
        'rounded-lg object-contain',
        className
      )}
      onError={() => setHasError(true)}
    />
  );
}

// =============================================================================
// Social Media Links
// =============================================================================

export interface SocialMediaLinksProps {
  urls: ProviderUrls;
  providerName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const socialIconSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function SocialMediaLinks({
  urls,
  providerName,
  size = 'md',
  className,
}: SocialMediaLinksProps) {
  const socialLinks = [
    {
      key: 'linkedin',
      url: urls.linkedin,
      icon: <LinkedInIcon />,
      label: 'LinkedIn',
    },
    {
      key: 'facebook',
      url: urls.facebook,
      icon: <FacebookIcon />,
      label: 'Facebook',
    },
    {
      key: 'instagram',
      url: urls.instagram,
      icon: <InstagramIcon />,
      label: 'Instagram',
    },
    {
      key: 'twitter',
      url: urls.twitter,
      icon: <TwitterIcon />,
      label: 'Twitter',
    },
    { key: 'tiktok', url: urls.tiktok, icon: <TikTokIcon />, label: 'TikTok' },
    { key: 'yelp', url: urls.yelp, icon: <YelpIcon />, label: 'Yelp' },
    {
      key: 'youtube',
      url: urls.youtube,
      icon: <YouTubeIcon />,
      label: 'YouTube',
    },
    {
      key: 'pinterest',
      url: urls.pinterest,
      icon: <PinterestIcon />,
      label: 'Pinterest',
    },
    { key: 'blog', url: urls.blog, icon: <BlogIcon />, label: 'Blog' },
  ].filter((link) => link.url);

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {socialLinks.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Visit ${providerName} on ${link.label}`}
          className={cn(
            'hover:text-primary-600 dark:hover:text-primary-400 text-gray-500 transition-colors dark:text-gray-400',
            socialIconSizes[size]
          )}
        >
          {link.icon}
          <span className="sr-only">{link.label}</span>
        </a>
      ))}
    </div>
  );
}

// =============================================================================
// Verified Badge
// =============================================================================

export interface VerifiedBadgeProps {
  isVerified?: boolean;
  isClaimed?: boolean;
  lastUpdated?: Date | string;
  className?: string;
}

export function VerifiedBadge({
  isVerified,
  isClaimed,
  lastUpdated,
  className,
}: VerifiedBadgeProps) {
  const formattedDate = lastUpdated
    ? typeof lastUpdated === 'string'
      ? lastUpdated
      : lastUpdated.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {(isVerified || isClaimed) && (
        <>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span>Information verified</span>
        </>
      )}
      {!isVerified && !isClaimed && <span>Information updated</span>}
      {formattedDate && <span>{formattedDate}</span>}
    </div>
  );
}

// =============================================================================
// Address Display
// =============================================================================

export interface AddressDisplayProps {
  address: ProviderAddress;
  linkToMaps?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  linkToMaps = true,
  className,
}: AddressDisplayProps) {
  const mapsUrl = `https://www.google.com/maps?daddr=${encodeURIComponent(
    `${address.street1}, ${address.city}, ${address.state} ${address.postalCode}`
  )}`;

  const addressContent = (
    <>
      {address.street1}
      {address.street2 && (
        <>
          <br />
          {address.street2}
        </>
      )}
      <br />
      {address.city}, {address.state} {address.postalCode}
    </>
  );

  if (linkToMaps) {
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 hover:underline dark:text-gray-300',
          className
        )}
      >
        {addressContent}
      </a>
    );
  }

  return (
    <address
      className={cn('text-gray-600 not-italic dark:text-gray-300', className)}
    >
      {addressContent}
    </address>
  );
}

// =============================================================================
// Claim Listing Button
// =============================================================================

export interface ClaimListingButtonProps {
  slug: string;
  href?: string;
  className?: string;
}

export function ClaimListingButton({
  slug,
  href,
  className,
}: ClaimListingButtonProps) {
  const claimUrl = href || `/provider/${slug}/claim`;

  return (
    <a
      href={claimUrl}
      className={cn(
        'hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400',
        className
      )}
    >
      <CheckCircleIcon className="h-4 w-4" />
      Claim this listing
    </a>
  );
}

// =============================================================================
// Report Inaccurate Info Link
// =============================================================================

export interface ReportLinkProps {
  slug: string;
  href?: string;
  className?: string;
}

export function ReportLink({ slug, href, className }: ReportLinkProps) {
  const reportUrl = href || `/provider/${slug}/report`;

  return (
    <a
      href={reportUrl}
      className={cn(
        'inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
        className
      )}
    >
      <FlagIcon className="h-4 w-4" />
      Report inaccurate information
    </a>
  );
}

// =============================================================================
// Book Appointment Button
// =============================================================================

const bookButtonVariants = cva(
  'inline-flex items-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
      variant: {
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        outline:
          'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
      },
    },
    defaultVariants: {
      size: 'lg',
      variant: 'primary',
    },
  }
);

export interface BookAppointmentButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bookButtonVariants> {
  showIcon?: boolean;
}

export function BookAppointmentButton({
  size,
  variant,
  showIcon = true,
  className,
  children,
  ...props
}: BookAppointmentButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        bookButtonVariants({
          size: size ?? 'lg',
          variant: variant ?? 'primary',
        }),
        className
      )}
      {...props}
    >
      {showIcon && <CalendarCheckIcon className="h-5 w-5" />}
      {children || 'Book Appointment'}
    </button>
  );
}

// =============================================================================
// Main Provider Detail Header
// =============================================================================

const headerVariants = cva('bg-white dark:bg-gray-900', {
  variants: {
    variant: {
      default: 'shadow-sm',
      flat: '',
      elevated: 'shadow-md',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ProviderDetailHeaderProps extends VariantProps<
  typeof headerVariants
> {
  provider: ProviderDetailData;
  breadcrumbs?: BreadcrumbItem[];
  backButtonHref?: string;
  showActionButtons?: boolean;
  showBreadcrumb?: boolean;
  showSocialLinks?: boolean;
  showVerifiedBadge?: boolean;
  showClaimButton?: boolean;
  showReportLink?: boolean;
  showBookButton?: boolean;
  onShare?: () => void;
  onCopyLink?: () => void;
  onCall?: (phoneNumber: string) => void;
  onBook?: () => void;
  className?: string;
}

export function ProviderDetailHeader({
  provider,
  breadcrumbs,
  backButtonHref,
  variant,
  showActionButtons = true,
  showBreadcrumb = true,
  showSocialLinks = true,
  showVerifiedBadge = true,
  showClaimButton = false,
  showReportLink = true,
  showBookButton = true,
  onShare,
  onCopyLink,
  onCall,
  onBook,
  className,
}: ProviderDetailHeaderProps) {
  const defaultBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    { label: 'Home', href: '/' },
    {
      label: provider.address.state,
      href: `/state/${provider.address.state.toLowerCase()}`,
    },
    {
      label: `${provider.address.city} (${provider.address.postalCode})`,
      href: `/search/${provider.address.postalCode}`,
    },
    { label: provider.name, href: `/provider/${provider.slug}` },
  ];

  const defaultBackHref =
    backButtonHref || `/search/${provider.address.postalCode}`;

  return (
    <div
      className={cn(
        headerVariants({ variant: variant ?? 'default' }),
        className
      )}
    >
      {/* Action Buttons Bar */}
      {showActionButtons && (
        <ActionButtonsBar
          provider={provider}
          onShare={onShare}
          onCopyLink={onCopyLink}
          onCall={onCall}
        />
      )}

      {/* Main Header Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb (Desktop) */}
        {showBreadcrumb && (
          <Breadcrumb
            items={defaultBreadcrumbs}
            className="mb-4 hidden sm:block"
          />
        )}

        {/* Back Button (Mobile) */}
        {showBreadcrumb && (
          <MobileBackButton href={defaultBackHref} className="mb-4" />
        )}

        {/* Provider Info */}
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Logo */}
          <ProviderLogo src={provider.logoUrl} name={provider.name} size="lg" />

          {/* Details */}
          <div className="flex-1">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {provider.name}
            </h1>

            <AddressDisplay address={provider.address} className="mb-3" />

            {/* Social Media Links */}
            {showSocialLinks && provider.urls && (
              <SocialMediaLinks
                urls={provider.urls}
                providerName={provider.name}
                className="mb-3"
              />
            )}

            {/* Verified Badge */}
            {showVerifiedBadge && (
              <VerifiedBadge
                isVerified={provider.isVerified}
                isClaimed={provider.isClaimed}
                lastUpdated={provider.lastUpdated}
                className="mb-4"
              />
            )}

            {/* Divider */}
            <hr className="my-4 border-gray-200 dark:border-gray-700" />

            {/* Actions Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                {showReportLink && <ReportLink slug={provider.slug} />}
                {showClaimButton && <ClaimListingButton slug={provider.slug} />}
              </div>

              {showBookButton && provider.phoneNumber && (
                <BookAppointmentButton onClick={onBook} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Compact Header Variant (for mobile or embed)
// =============================================================================

export interface CompactProviderHeaderProps {
  provider: ProviderDetailData;
  showLogo?: boolean;
  onBook?: () => void;
  className?: string;
}

export function CompactProviderHeader({
  provider,
  showLogo = true,
  onBook,
  className,
}: CompactProviderHeaderProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {showLogo && (
          <ProviderLogo src={provider.logoUrl} name={provider.name} size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
            {provider.name}
          </h2>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {provider.address.city}, {provider.address.state}{' '}
            {provider.address.postalCode}
          </p>
        </div>
        {provider.phoneNumber && onBook && (
          <BookAppointmentButton size="sm" onClick={onBook}>
            Book
          </BookAppointmentButton>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Provider Header Skeleton
// =============================================================================

export interface ProviderDetailHeaderSkeletonProps {
  showActionButtons?: boolean;
  className?: string;
}

export function ProviderDetailHeaderSkeleton({
  showActionButtons = true,
  className,
}: ProviderDetailHeaderSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-white shadow-sm dark:bg-gray-900',
        className
      )}
    >
      {/* Action Buttons Bar Skeleton */}
      {showActionButtons && (
        <div className="flex justify-center gap-4 border-b border-gray-200 py-4 dark:border-gray-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      )}

      {/* Main Content Skeleton */}
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4 hidden items-center gap-2 sm:flex">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              {i > 1 && (
                <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700" />
              )}
              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Logo Skeleton */}
          <div className="h-32 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />

          {/* Details Skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-12 w-36 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Icons (inline SVG for independence)
// =============================================================================

function DirectionsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M22.43 10.59l-9.01-9.01c-.75-.75-2.07-.76-2.83 0l-9 9.01c-.78.78-.78 2.04 0 2.82l9 9.01c.39.39.9.58 1.41.58.51 0 1.02-.19 1.41-.58l9.01-9.01c.79-.78.79-2.04.01-2.82zM7.25 14a.75.75 0 01-.75-.75v-2.5c0-.41.34-.75.75-.75h4v-1.5c0-.89 1.08-1.34 1.71-.71l3.5 3.5c.39.39.39 1.02 0 1.41l-3.5 3.5c-.63.63-1.71.18-1.71-.71V13.5h-3.25a.75.75 0 01-.75-.75v-.75h.75a.25.25 0 00.25-.25v-1.5a.25.25 0 00-.25-.25H7.25z" />
    </svg>
  );
}

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

function WebsiteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
    </svg>
  );
}

function CalendarCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 14.5l-1.5-1.5-1 1 2.5 2.5 5-5-1-1-4 4z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function YelpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 0 1 1.596-.206 9.194 9.194 0 0 1 2.364 3.252 1.073 1.073 0 0 1-.686 1.459zm-5.025 3.152l4.942 1.606a1.072 1.072 0 0 1 .636 1.48 9.188 9.188 0 0 1-2.468 3.168 1.073 1.073 0 0 1-1.592-.26l-2.76-4.409c-.55-.88.196-1.945 1.242-1.585zM8.232 4.764l2.24 8.048c.23.818-.71 1.52-1.444 1.08l-6.51-3.94a1.072 1.072 0 0 1-.328-1.56 9.2 9.2 0 0 1 4.626-4.13 1.073 1.073 0 0 1 1.416.502zm.818 13.83l-.177-5.157c-.037-1 1.225-1.493 1.9-.74l3.54 3.988a1.073 1.073 0 0 1-.108 1.596 9.2 9.2 0 0 1-3.648 1.937 1.073 1.073 0 0 1-1.507-1.624zm-3.98-1.587l4.468-2.59c.86-.496 1.8.4 1.417 1.346l-2.137 5.244a1.073 1.073 0 0 1-1.42.573 9.2 9.2 0 0 1-3.157-2.915 1.073 1.073 0 0 1 .83-1.658z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.47 6.12 5.75 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03z" />
    </svg>
  );
}

function BlogIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  );
}

export default ProviderDetailHeader;
