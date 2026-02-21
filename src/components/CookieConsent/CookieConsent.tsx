import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface CookieConsentLink {
  /** Label for the link */
  label: string;
  /** URL for the link */
  href: string;
}

// =============================================================================
// Variants
// =============================================================================

const bannerVariants = cva(
  'fixed z-50 transition-all duration-300 ease-in-out',
  {
    variants: {
      position: {
        bottom: 'bottom-0 left-0 right-0',
        top: 'top-0 left-0 right-0',
        'bottom-left': 'bottom-4 left-4 max-w-md',
        'bottom-right': 'bottom-4 right-4 max-w-md',
      },
      variant: {
        default:
          'bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg',
        minimal: 'bg-gray-900 text-white',
        branded: 'bg-primary-800 text-white',
      },
    },
    defaultVariants: {
      position: 'bottom',
      variant: 'default',
    },
  }
);

// =============================================================================
// CookieConsentBanner Component
// =============================================================================

export interface CookieConsentBannerProps extends VariantProps<
  typeof bannerVariants
> {
  /** Whether the banner is visible */
  isVisible?: boolean;
  /** Callback when user accepts cookies */
  onAccept: () => void;
  /** Callback when user declines cookies (optional) */
  onDecline?: () => void;
  /** Callback when user wants to customize settings (optional) */
  onCustomize?: () => void;
  /** Main message text */
  message?: string;
  /** Link to terms and conditions */
  termsLink?: CookieConsentLink;
  /** Link to privacy policy */
  privacyLink?: CookieConsentLink;
  /** Link to cookie policy */
  cookieLink?: CookieConsentLink;
  /** Text for the accept button */
  acceptText?: string;
  /** Text for the decline button */
  declineText?: string;
  /** Text for the customize button */
  customizeText?: string;
  /** Whether to show the decline button */
  showDecline?: boolean;
  /** Whether to show the customize button */
  showCustomize?: boolean;
  /** App name to display in message */
  appName?: string;
  /** Whether this is a mobile/app context */
  isMobileApp?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * A cookie consent banner component for GDPR compliance.
 *
 * Supports multiple layouts and customization options.
 *
 * @example
 * ```tsx
 * <CookieConsentBanner
 *   isVisible={!hasConsented}
 *   onAccept={() => setConsented(true)}
 *   termsLink={{ label: "Terms", href: "/terms" }}
 *   privacyLink={{ label: "Privacy", href: "/privacy" }}
 * />
 * ```
 */
export function CookieConsentBanner({
  isVisible = true,
  position = 'bottom',
  variant = 'default',
  onAccept,
  onDecline,
  onCustomize,
  message,
  termsLink,
  privacyLink,
  cookieLink,
  acceptText = 'I Agree',
  declineText = 'Decline',
  customizeText = 'Customize',
  showDecline = false,
  showCustomize = false,
  appName = 'BlueHive',
  isMobileApp = false,
  className,
}: CookieConsentBannerProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Handle accept with animation
  const handleAccept = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onAccept();
    }, 200);
  };

  if (!isVisible) return null;

  const defaultMessage = isMobileApp
    ? 'This application uses cookies.'
    : 'This application and website use cookies.';

  const displayMessage = message || defaultMessage;

  // Build the legal links
  const legalLinks = [termsLink, privacyLink, cookieLink].filter(Boolean);

  const isCompact = position === 'bottom-left' || position === 'bottom-right';

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className={cn(
        bannerVariants({ position, variant }),
        isAnimating && 'translate-y-4 opacity-0',
        isCompact && 'rounded-lg shadow-xl',
        className
      )}
    >
      <div className={cn('p-4', !isCompact && 'container mx-auto')}>
        <div
          className={cn(
            isCompact
              ? 'space-y-3'
              : 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between'
          )}
        >
          {/* Message */}
          <div
            className={cn(
              'text-sm',
              variant === 'default'
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-white/90'
            )}
          >
            <p className="mb-1">
              <strong>{displayMessage}</strong>
            </p>
            <p
              className={cn(
                'text-xs',
                variant === 'default'
                  ? 'text-gray-600 dark:text-gray-400'
                  : 'text-white/80'
              )}
            >
              By using {appName} you are agreeing to our{' '}
              {legalLinks.map((link, index) => (
                <React.Fragment key={link!.href}>
                  {index > 0 &&
                    (index === legalLinks.length - 1 ? ' and ' : ', ')}
                  <a
                    href={link!.href}
                    className={cn(
                      'underline hover:no-underline',
                      variant === 'default'
                        ? 'text-primary-800 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200'
                        : 'text-white hover:text-white/80'
                    )}
                  >
                    {link!.label}
                  </a>
                </React.Fragment>
              ))}
              {legalLinks.length > 0 && ' and our use of cookies.'}
            </p>
          </div>

          {/* Buttons */}
          <div
            className={cn(
              'flex gap-2',
              isCompact ? 'flex-col' : 'flex-shrink-0'
            )}
          >
            {showCustomize && onCustomize && (
              <button
                type="button"
                onClick={onCustomize}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  variant === 'default'
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                {customizeText}
              </button>
            )}
            {showDecline && onDecline && (
              <button
                type="button"
                onClick={onDecline}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  variant === 'default'
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                {declineText}
              </button>
            )}
            <button
              type="button"
              onClick={handleAccept}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                variant === 'default'
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              )}
            >
              {acceptText}
              <CheckIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Compact Cookie Banner
// =============================================================================

export interface CompactCookieBannerProps {
  isVisible?: boolean;
  onAccept: () => void;
  privacyHref?: string;
  className?: string;
}

/**
 * A minimal cookie banner for less intrusive consent collection.
 */
export function CompactCookieBanner({
  isVisible = true,
  onAccept,
  privacyHref = '/privacy',
  className,
}: CompactCookieBannerProps) {
  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={cn(
        'fixed right-4 bottom-4 left-4 md:right-4 md:left-auto md:max-w-sm',
        'z-50 rounded-lg bg-gray-900 p-4 text-white shadow-xl',
        className
      )}
    >
      <p className="mb-3 text-sm">
        We use cookies to improve your experience.{' '}
        <a href={privacyHref} className="underline hover:no-underline">
          Learn more
        </a>
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="w-full rounded-lg bg-white px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-100"
      >
        Got it
      </button>
    </div>
  );
}

// =============================================================================
// Cookie Consent Hook
// =============================================================================

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';

export interface UseCookieConsentOptions {
  /** Storage key for consent */
  storageKey?: string;
  /** Callback when consent is given */
  onConsent?: () => void;
}

export interface UseCookieConsentReturn {
  /** Whether user has consented */
  hasConsented: boolean;
  /** Whether the banner should be shown */
  showBanner: boolean;
  /** Accept cookies */
  acceptCookies: () => void;
  /** Decline cookies */
  declineCookies: () => void;
  /** Reset consent (for testing) */
  resetConsent: () => void;
}

/**
 * Hook for managing cookie consent state.
 *
 * @example
 * ```tsx
 * const { showBanner, acceptCookies } = useCookieConsent();
 *
 * return (
 *   <CookieConsentBanner
 *     isVisible={showBanner}
 *     onAccept={acceptCookies}
 *   />
 * );
 * ```
 */
export function useCookieConsent(
  options: UseCookieConsentOptions = {}
): UseCookieConsentReturn {
  const { storageKey = COOKIE_CONSENT_KEY, onConsent } = options;

  const [hasConsented, setHasConsented] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storageKey) === 'true';
  });

  const acceptCookies = React.useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setHasConsented(true);
    onConsent?.();
  }, [storageKey, onConsent]);

  const declineCookies = React.useCallback(() => {
    localStorage.setItem(storageKey, 'declined');
    setHasConsented(true); // Hide banner even if declined
  }, [storageKey]);

  const resetConsent = React.useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasConsented(false);
  }, [storageKey]);

  return {
    hasConsented,
    showBanner: !hasConsented,
    acceptCookies,
    declineCookies,
    resetConsent,
  };
}

// =============================================================================
// Icons
// =============================================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
