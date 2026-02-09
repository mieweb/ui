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
// Breadcrumb Navigation
// =============================================================================

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('py-3', className)}>
      {/* Desktop breadcrumb */}
      <ol className="hidden flex-wrap items-center gap-1 text-sm sm:flex">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <span className="mx-1.5 text-white/50">›</span>}
            {index === items.length - 1 ? (
              <span className="text-white/80">{item.label}</span>
            ) : index === 0 ? (
              <a
                href={item.href}
                className="text-white/70 transition-colors hover:text-white"
              >
                <HomeIcon className="-mt-0.5 mr-1 inline-block h-3.5 w-3.5" />
                {item.label}
              </a>
            ) : (
              <a
                href={item.href}
                className="text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
      {/* Mobile back button */}
      {items.length >= 2 && (
        <div className="block sm:hidden">
          <a
            href={items[items.length - 2].href}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            Back
          </a>
        </div>
      )}
    </nav>
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
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-[80px] h-[80px]',
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
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/30 to-white/10 font-bold text-white shadow-lg',
          size === 'sm' && 'rounded-xl text-lg',
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
    <div
      className={cn(
        logoSizeClasses[size],
        'flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
        size === 'sm' && 'rounded-xl',
        className
      )}
    >
      <img
        src={src}
        alt={`${name} logo`}
        className="h-full w-full object-contain p-2"
        onError={() => setHasError(true)}
      />
    </div>
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

  if (socialLinks.length === 0) return null;

  const iconSizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };
  const containerSizes = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-10 h-10' };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {socialLinks.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${providerName} on ${link.label}`}
          className={cn(
            containerSizes[size],
            'inline-flex items-center justify-center rounded-lg bg-white/15 text-white transition-all hover:bg-white/25'
          )}
        >
          <span className={iconSizes[size]}>{link.icon}</span>
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
  className,
}: VerifiedBadgeProps) {
  if (!isVerified && !isClaimed) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800',
        className
      )}
    >
      <CheckCircleIcon className="h-3.5 w-3.5" />
      Verified
    </span>
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

  const addressText = [
    address.street1,
    address.street2,
    `${address.city}, ${address.state} ${address.postalCode}`,
  ]
    .filter(Boolean)
    .join(', ');

  if (linkToMaps) {
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1.5 text-[15px] text-white/90 transition-colors hover:text-white',
          className
        )}
      >
        <LocationPinIcon className="h-4 w-4 shrink-0" />
        <span>{addressText}</span>
      </a>
    );
  }

  return (
    <address className={cn('text-sm text-white/90 not-italic', className)}>
      {addressText}
    </address>
  );
}

// =============================================================================
// Quick Action Buttons (pill style)
// =============================================================================

export interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  className?: string;
}

export function QuickAction({
  icon,
  label,
  href,
  onClick,
  className,
}: QuickActionProps) {
  const classes = cn(
    'flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2.5 px-2 lg:w-[70px] lg:h-[74px] text-white transition-all hover:bg-white/20 active:scale-95 cursor-pointer',
    className
  );

  const content = (
    <>
      <span className="text-lg">{icon}</span>
      <span className="text-[11px] font-medium tracking-[0.22px] uppercase">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
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
  return (
    <a
      href={href || `/provider/${slug}/claim`}
      className={cn(
        'hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors dark:text-gray-400',
        className
      )}
    >
      <CheckCircleIcon className="h-3.5 w-3.5" />
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
  return (
    <a
      href={href || `/provider/${slug}/report`}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
        className
      )}
    >
      <FlagIcon className="h-3.5 w-3.5" />
      Report inaccurate info
    </a>
  );
}

// =============================================================================
// Book Appointment Button
// =============================================================================

const bookButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'px-4 py-2 text-sm rounded-full',
        md: 'px-5 py-2.5 text-sm rounded-full',
        lg: 'w-full px-4 py-2 text-[17px] rounded-3xl',
      },
      variant: {
        primary:
          'bg-white text-[#086684] uppercase hover:bg-gray-50 focus:ring-white active:bg-gray-100',
        outline:
          'border-2 border-white text-white hover:bg-white/10 focus:ring-white',
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

export interface ProviderDetailHeaderProps {
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
  variant?: 'default' | 'flat' | 'elevated';
  className?: string;
}

export function ProviderDetailHeader({
  provider,
  breadcrumbs,
  showActionButtons = true,
  showBreadcrumb = true,
  showSocialLinks = true,
  showVerifiedBadge = true,
  showClaimButton = false,
  showReportLink = true,
  showBookButton = true,
  onShare,
  onCopyLink: _onCopyLink,
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

  const directionsUrl = `https://www.google.com/maps?daddr=${encodeURIComponent(
    `${provider.address.street1}, ${provider.address.city}, ${provider.address.state} ${provider.address.postalCode}`
  )}`;

  return (
    <section
      className={cn(
        'relative -mt-16 bg-gradient-to-br from-[#27AAE1] to-[#146A8E] pt-16',
        className
      )}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(23,123,165,0.2)] to-[rgba(39,170,225,0.1)]" />

      {/* Content */}
      <div className="relative px-4 py-10 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
            {/* Left column: Provider info */}
            <div className="min-w-0 flex-1 lg:max-w-[66%]">
              {/* Breadcrumb */}
              {showBreadcrumb && (
                <Breadcrumb items={defaultBreadcrumbs} className="mb-3" />
              )}

              {/* Logo + Title + Location badge */}
              <div className="mb-3 flex items-start gap-3">
                <ProviderLogo
                  src={provider.logoUrl}
                  name={provider.name}
                  size="lg"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="mb-2 text-3xl leading-tight font-bold text-white lg:text-4xl">
                    {provider.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-medium text-white">
                      <LocationPinIcon className="h-3.5 w-3.5" />
                      {provider.address.city}, {provider.address.state}
                    </span>
                    {showVerifiedBadge &&
                      (provider.isVerified || provider.isClaimed) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-200">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <AddressDisplay address={provider.address} className="mb-3" />

              {/* Social Links */}
              {showSocialLinks && provider.urls && (
                <SocialMediaLinks
                  urls={provider.urls}
                  providerName={provider.name}
                  className="mt-3"
                />
              )}
            </div>

            {/* Right column: Actions card */}
            {showActionButtons && (
              <div className="mt-6 lg:mt-0 lg:w-[34%] lg:max-w-[360px]">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-[10px]">
                  {/* Mobile call button */}
                  {provider.phoneNumber && (
                    <a
                      href={`tel:${provider.phoneNumber}`}
                      className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-lg font-semibold text-[#086684] shadow-[0_2px_8px_rgba(0,0,0,0.1)] lg:hidden"
                    >
                      <PhoneIcon className="h-5 w-5" />
                      Call now
                    </a>
                  )}

                  {/* Action buttons grid */}
                  <div className="mb-4 grid grid-cols-3 gap-1 lg:flex lg:justify-center lg:gap-2">
                    <QuickAction
                      icon={<DirectionsIcon className="h-[18px] w-[18px]" />}
                      label="Directions"
                      href={directionsUrl}
                    />

                    {provider.phoneNumber ? (
                      <QuickAction
                        icon={<PhoneIcon className="h-[18px] w-[18px]" />}
                        label="Call now"
                        onClick={() => onCall?.(provider.phoneNumber!)}
                        className="hidden lg:flex"
                      />
                    ) : null}

                    {provider.urls?.website && (
                      <QuickAction
                        icon={<WebsiteIcon className="h-[18px] w-[18px]" />}
                        label="Website"
                        href={provider.urls.website}
                      />
                    )}

                    <QuickAction
                      icon={<ShareIcon className="h-[18px] w-[18px]" />}
                      label="Share"
                      onClick={onShare}
                    />
                  </div>

                  {/* Book Appointment */}
                  {showBookButton && (
                    <BookAppointmentButton
                      size="lg"
                      onClick={onBook}
                      className="hidden lg:flex"
                    />
                  )}
                </div>

                {/* Meta links */}
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {showReportLink && (
                    <a
                      href={`/provider/${provider.slug}/report`}
                      className="inline-flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white/80"
                    >
                      <FlagIcon className="h-3.5 w-3.5" />
                      Report inaccurate info
                    </a>
                  )}
                  {showClaimButton && (
                    <a
                      href={`/provider/${provider.slug}/claim`}
                      className="inline-flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white/80"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Claim this listing
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Compact Header Variant
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
        'rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900',
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
// Skeleton
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
    <section
      className={cn(
        'relative -mt-16 animate-pulse bg-gradient-to-br from-[#27AAE1] to-[#146A8E] pt-16',
        className
      )}
    >
      <div className="relative px-4 py-10 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
            <div className="flex-1">
              <div className="mb-4 hidden items-center gap-2 sm:flex">
                {[1, 2, 3, 4].map((i) => (
                  <React.Fragment key={i}>
                    {i > 1 && <div className="h-3 w-3 rounded bg-white/20" />}
                    <div className="h-4 w-16 rounded-full bg-white/20" />
                  </React.Fragment>
                ))}
              </div>
              <div className="mb-4 flex items-start gap-3">
                <div className="h-[80px] w-[80px] rounded-2xl bg-white/20" />
                <div className="flex-1 space-y-3">
                  <div className="h-9 w-64 rounded-lg bg-white/20" />
                  <div className="h-8 w-32 rounded-full bg-white/20" />
                </div>
              </div>
              <div className="mb-3 h-5 w-80 rounded bg-white/20" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 w-9 rounded-lg bg-white/20" />
                ))}
              </div>
            </div>
            {showActionButtons && (
              <div className="mt-6 lg:mt-0 lg:w-[34%]">
                <div className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-5">
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-[74px] rounded-xl bg-white/10"
                      />
                    ))}
                  </div>
                  <div className="h-10 rounded-3xl bg-white/20" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Backward-compatible exports
// =============================================================================

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  href?: string;
  variant?: 'default' | 'active';
}

export function ActionButton(props: ActionButtonProps) {
  return (
    <QuickAction
      icon={props.icon}
      label={props.label}
      href={props.href}
      onClick={
        props.onClick ? () => props.onClick?.(undefined as never) : undefined
      }
    />
  );
}

export interface ActionButtonsBarProps {
  provider: ProviderDetailData;
  onShare?: () => void;
  onCopyLink?: () => void;
  onCall?: (phoneNumber: string) => void;
  className?: string;
}

export function ActionButtonsBar(_props: ActionButtonsBarProps) {
  return null;
}

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
        className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        {label}
      </a>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

function DirectionsIcon({ className }: { className?: string }) {
  return (
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
}

function PhoneIcon({ className }: { className?: string }) {
  return (
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
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function WebsiteIcon({ className }: { className?: string }) {
  return (
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
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
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
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function LocationPinIcon({ className }: { className?: string }) {
  return (
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
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
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
        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
      />
    </svg>
  );
}

function CalendarCheckIcon({ className }: { className?: string }) {
  return (
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function YelpIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 0 1 1.596-.206 9.194 9.194 0 0 1 2.364 3.252 1.073 1.073 0 0 1-.686 1.459zm-5.025 3.152l4.942 1.606a1.072 1.072 0 0 1 .636 1.48 9.188 9.188 0 0 1-2.468 3.168 1.073 1.073 0 0 1-1.592-.26l-2.76-4.409c-.55-.88.196-1.945 1.242-1.585zM8.232 4.764l2.24 8.048c.23.818-.71 1.52-1.444 1.08l-6.51-3.94a1.072 1.072 0 0 1-.328-1.56 9.2 9.2 0 0 1 4.626-4.13 1.073 1.073 0 0 1 1.416.502zm.818 13.83l-.177-5.157c-.037-1 1.225-1.493 1.9-.74l3.54 3.988a1.073 1.073 0 0 1-.108 1.596 9.2 9.2 0 0 1-3.648 1.937 1.073 1.073 0 0 1-1.507-1.624zm-3.98-1.587l4.468-2.59c.86-.496 1.8.4 1.417 1.346l-2.137 5.244a1.073 1.073 0 0 1-1.42.573 9.2 9.2 0 0 1-3.157-2.915 1.073 1.073 0 0 1 .83-1.658z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.47 6.12 5.75 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03z" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  );
}

export default ProviderDetailHeader;
