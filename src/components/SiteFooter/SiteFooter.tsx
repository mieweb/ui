import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform:
    | 'instagram'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'youtube'
    | 'tiktok'
    | 'github';
  href: string;
  label?: string;
}

// =============================================================================
// Social Media Icons
// =============================================================================

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const socialIcons = {
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  twitter: TwitterIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
  github: GitHubIcon,
};

// =============================================================================
// Social Media Links Component
// =============================================================================

export interface SocialMediaLinksProps {
  links: SocialLink[];
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SocialMediaLinks({
  links,
  variant = 'dark',
  size = 'md',
  className,
}: SocialMediaLinksProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {links.map((link) => {
        const Icon = socialIcons[link.platform];
        return (
          <a
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label || `Follow us on ${link.platform}`}
            className={cn(
              'flex items-center justify-center rounded-full transition-colors',
              sizeClasses[size],
              variant === 'light'
                ? 'text-white/70 hover:bg-white/10 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
            )}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
}

// =============================================================================
// Newsletter Form Component
// =============================================================================

export interface NewsletterFormProps {
  onSubmit?: (email: string) => void;
  placeholder?: string;
  buttonText?: string;
  variant?: 'light' | 'dark';
  isLoading?: boolean;
  className?: string;
}

export function NewsletterForm({
  onSubmit,
  placeholder = 'Enter your email',
  buttonText = 'Sign Up',
  variant = 'dark',
  isLoading = false,
  className,
}: NewsletterFormProps) {
  const [email, setEmail] = React.useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      onSubmit?.(email.trim());
      setEmail('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        className={cn(
          'min-w-0 flex-1 rounded-lg px-4 py-2 text-sm transition-colors',
          variant === 'light'
            ? 'border border-white/40 bg-white/20 text-white placeholder-white/60 focus:border-white/60 focus:outline-none'
            : 'focus:border-primary-500 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400'
        )}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
          variant === 'light'
            ? 'text-primary-900 bg-white hover:bg-white/90'
            : 'bg-primary-700 hover:bg-primary-800 text-white',
          isLoading && 'cursor-not-allowed opacity-50'
        )}
      >
        {isLoading ? 'Sending...' : buttonText}
      </button>
    </form>
  );
}

// =============================================================================
// Footer Link Section Component
// =============================================================================

export interface FooterLinkSectionProps {
  group: FooterLinkGroup;
  variant?: 'light' | 'dark';
  className?: string;
}

export function FooterLinkSection({
  group,
  variant = 'dark',
  className,
}: FooterLinkSectionProps) {
  return (
    <div className={className}>
      <h3
        className={cn(
          'mb-4 text-sm font-semibold tracking-wider uppercase',
          variant === 'light'
            ? 'text-white/70'
            : 'text-gray-600 dark:text-gray-400'
        )}
      >
        {group.title}
      </h3>
      <ul className="space-y-2">
        {group.links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className={cn(
                'text-sm transition-colors',
                variant === 'light'
                  ? 'text-white/60 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              )}
            >
              {link.label}
              {link.external && (
                <ExternalLinkIcon className="ml-1 inline-block h-3 w-3 opacity-50" />
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// Copyright Text Component
// =============================================================================

export interface CopyrightTextProps {
  companyName: string;
  year?: number;
  variant?: 'light' | 'dark';
  className?: string;
}

export function CopyrightText({
  companyName,
  year = new Date().getFullYear(),
  variant = 'dark',
  className,
}: CopyrightTextProps) {
  return (
    <span
      className={cn(
        'text-sm',
        variant === 'light'
          ? 'text-white/60'
          : 'text-gray-600 dark:text-gray-400',
        className
      )}
    >
      &copy; {year} {companyName}
    </span>
  );
}

// =============================================================================
// Legal Links Component
// =============================================================================

export interface LegalLinksProps {
  privacyHref?: string;
  termsHref?: string;
  cookiesHref?: string;
  additionalLinks?: FooterLink[];
  variant?: 'light' | 'dark';
  className?: string;
}

export function LegalLinks({
  privacyHref = '/privacy',
  termsHref = '/terms',
  cookiesHref,
  additionalLinks = [],
  variant = 'dark',
  className,
}: LegalLinksProps) {
  const links: FooterLink[] = [
    { label: 'Privacy Policy', href: privacyHref },
    { label: 'Terms & Conditions', href: termsHref },
    ...(cookiesHref ? [{ label: 'Cookie Policy', href: cookiesHref }] : []),
    ...additionalLinks,
  ];

  return (
    <nav
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}
    >
      {links.map((link, index) => (
        <React.Fragment key={link.href}>
          {index > 0 && (
            <span
              className={cn(
                'hidden sm:inline',
                variant === 'light'
                  ? 'text-white/40'
                  : 'text-gray-300 dark:text-gray-600'
              )}
            >
              |
            </span>
          )}
          <a
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            className={cn(
              'text-sm transition-colors',
              variant === 'light'
                ? 'text-white/60 hover:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            {link.label}
          </a>
        </React.Fragment>
      ))}
    </nav>
  );
}

// =============================================================================
// Disclaimer Text Component
// =============================================================================

export interface DisclaimerTextProps {
  children: React.ReactNode;
  variant?: 'light' | 'dark';
  className?: string;
}

export function DisclaimerText({
  children,
  variant = 'dark',
  className,
}: DisclaimerTextProps) {
  return (
    <p
      className={cn(
        'text-xs leading-relaxed',
        variant === 'light'
          ? 'text-white/50'
          : 'text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {children}
    </p>
  );
}

// =============================================================================
// Main SiteFooter Component
// =============================================================================

const footerVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-gray-100 dark:bg-gray-900',
      dark: 'bg-gray-900 dark:bg-gray-950',
      primary: 'bg-primary-600 dark:bg-primary-800',
      white:
        'bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface SiteFooterProps extends VariantProps<typeof footerVariants> {
  logo?: {
    src?: string;
    alt?: string;
    name?: string;
    href?: string;
  };
  description?: string;
  linkGroups?: FooterLinkGroup[];
  socialLinks?: SocialLink[];
  companyName?: string;
  showNewsletter?: boolean;
  onNewsletterSubmit?: (email: string) => void;
  newsletterPlaceholder?: string;
  privacyHref?: string;
  termsHref?: string;
  cookiesHref?: string;
  additionalLegalLinks?: FooterLink[];
  disclaimer?: React.ReactNode;
  emergencyDisclaimer?: boolean;
  className?: string;
}

export function SiteFooter({
  logo = {},
  description,
  linkGroups = [],
  socialLinks = [],
  companyName = 'BlueHive Health LLC',
  variant,
  showNewsletter = false,
  onNewsletterSubmit,
  newsletterPlaceholder,
  privacyHref,
  termsHref,
  cookiesHref,
  additionalLegalLinks,
  disclaimer,
  emergencyDisclaimer = false,
  className,
}: SiteFooterProps) {
  const colorVariant =
    variant === 'primary' || variant === 'dark' ? 'light' : 'dark';

  return (
    <footer
      className={cn(
        footerVariants({ variant: variant ?? 'default' }),
        className
      )}
    >
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Description */}
          <div className="lg:col-span-4">
            {(logo.name || logo.src) && (
              <div className="mb-4">
                {logo.href ? (
                  <a
                    href={logo.href}
                    className="inline-flex items-center gap-2"
                  >
                    {logo.src ? (
                      <img
                        src={logo.src}
                        alt={logo.alt || logo.name}
                        className="h-8"
                      />
                    ) : (
                      <span
                        className={cn(
                          'text-xl font-bold',
                          colorVariant === 'light'
                            ? 'text-white'
                            : 'text-gray-900 dark:text-white'
                        )}
                      >
                        {logo.name}
                      </span>
                    )}
                  </a>
                ) : logo.src ? (
                  <img
                    src={logo.src}
                    alt={logo.alt || logo.name}
                    className="h-8"
                  />
                ) : (
                  <span
                    className={cn(
                      'text-xl font-bold',
                      colorVariant === 'light'
                        ? 'text-white'
                        : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {logo.name}
                  </span>
                )}
              </div>
            )}
            {description && (
              <p
                className={cn(
                  'mb-4 text-sm',
                  colorVariant === 'light'
                    ? 'text-white/70'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {description}
              </p>
            )}
            {socialLinks.length > 0 && (
              <SocialMediaLinks links={socialLinks} variant={colorVariant} />
            )}
          </div>

          {/* Link Groups */}
          {linkGroups.length > 0 && (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-4">
              {linkGroups.map((group) => (
                <FooterLinkSection
                  key={group.title}
                  group={group}
                  variant={colorVariant}
                />
              ))}
            </div>
          )}
        </div>

        {/* Newsletter Section */}
        {showNewsletter && (
          <div
            className={cn(
              'mb-6 border-t py-6',
              colorVariant === 'light'
                ? 'border-white/10'
                : 'border-gray-200 dark:border-gray-800'
            )}
          >
            <div className="max-w-md">
              <h3
                className={cn(
                  'mb-3 text-sm font-semibold',
                  colorVariant === 'light'
                    ? 'text-white'
                    : 'text-gray-900 dark:text-white'
                )}
              >
                Subscribe to our newsletter
              </h3>
              <NewsletterForm
                onSubmit={onNewsletterSubmit}
                placeholder={newsletterPlaceholder}
                variant={colorVariant}
              />
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div
          className={cn(
            'border-t pt-6',
            colorVariant === 'light'
              ? 'border-white/10'
              : 'border-gray-200 dark:border-gray-800'
          )}
        >
          {/* Legal Links & Copyright */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CopyrightText companyName={companyName} variant={colorVariant} />
            <LegalLinks
              privacyHref={privacyHref}
              termsHref={termsHref}
              cookiesHref={cookiesHref}
              additionalLinks={additionalLegalLinks}
              variant={colorVariant}
            />
          </div>

          {/* Disclaimer */}
          {(disclaimer || emergencyDisclaimer) && (
            <div className="space-y-2">
              {emergencyDisclaimer && (
                <DisclaimerText variant={colorVariant}>
                  <strong>
                    In the event of a medical emergency, call 911.
                  </strong>
                </DisclaimerText>
              )}
              {disclaimer && (
                <DisclaimerText variant={colorVariant}>
                  {disclaimer}
                </DisclaimerText>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Simple Footer Variant
// =============================================================================

export interface SimpleFooterProps {
  companyName?: string;
  privacyHref?: string;
  termsHref?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

export function SimpleFooter({
  companyName = 'BlueHive Health LLC',
  privacyHref = '/privacy',
  termsHref = '/terms',
  variant = 'dark',
  className,
}: SimpleFooterProps) {
  return (
    <footer
      className={cn(
        'border-t py-4',
        variant === 'light'
          ? 'bg-primary-700 border-white/10'
          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <CopyrightText companyName={companyName} variant={variant} />
          <div className="flex items-center justify-center gap-4 sm:justify-end">
            <a
              href={privacyHref}
              className={cn(
                'text-sm transition-colors',
                variant === 'light'
                  ? 'text-white/60 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              )}
            >
              Privacy
            </a>
            <a
              href={termsHref}
              className={cn(
                'text-sm transition-colors',
                variant === 'light'
                  ? 'text-white/60 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              )}
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Icons
// =============================================================================

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

export default SiteFooter;
