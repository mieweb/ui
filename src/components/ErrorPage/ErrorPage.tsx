import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Button, buttonVariants } from '../Button/Button';

// =============================================================================
// Types
// =============================================================================

export type ErrorType =
  | '404'
  | '500'
  | '403'
  | '401'
  | 'offline'
  | 'maintenance'
  | 'generic';

export interface ErrorPageConfig {
  code?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
}

export const DEFAULT_ERROR_CONFIGS: Record<ErrorType, ErrorPageConfig> = {
  '404': {
    code: '404',
    title: 'Page Not Found',
    description:
      "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.",
  },
  '500': {
    code: '500',
    title: 'Server Error',
    description:
      'Something went wrong on our end. Our team has been notified and is working to fix it.',
  },
  '403': {
    code: '403',
    title: 'Access Denied',
    description:
      "You don't have permission to access this page. Please contact support if you think this is a mistake.",
  },
  '401': {
    code: '401',
    title: 'Unauthorized',
    description: 'Please sign in to access this page.',
  },
  offline: {
    title: "You're Offline",
    description: 'Check your internet connection and try again.',
  },
  maintenance: {
    title: 'Under Maintenance',
    description:
      "We're currently performing scheduled maintenance. We'll be back shortly!",
  },
  generic: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again later.',
  },
};

// =============================================================================
// Variant Definitions
// =============================================================================

const errorPageVariants = cva(
  'flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center',
  {
    variants: {
      size: {
        sm: 'min-h-[40vh] py-8',
        md: 'min-h-[60vh] py-12',
        lg: 'min-h-screen py-16',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// =============================================================================
// ErrorPage Component
// =============================================================================

export interface ErrorPageProps extends VariantProps<typeof errorPageVariants> {
  /** Error type to display */
  type?: ErrorType;
  /** Custom error code */
  code?: string;
  /** Custom title (overrides type default) */
  title?: string;
  /** Custom description (overrides type default) */
  description?: string;
  /** Custom illustration/icon */
  illustration?: React.ReactNode;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Show home button */
  showHomeButton?: boolean;
  /** Home button href */
  homeHref?: string;
  /** Show back button */
  showBackButton?: boolean;
  /** Additional content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * A versatile error page component for displaying various error states.
 *
 * @example
 * ```tsx
 * <ErrorPage
 *   type="404"
 *   showHomeButton
 *   showBackButton
 * />
 * ```
 */
export function ErrorPage({
  type = 'generic',
  code,
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  showHomeButton = true,
  homeHref = '/',
  showBackButton = true,
  children,
  size,
  className,
}: ErrorPageProps) {
  const config = DEFAULT_ERROR_CONFIGS[type];
  const displayCode = code ?? config.code;
  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className={cn(errorPageVariants({ size }), className)}>
      {/* Illustration */}
      <div className="mb-8">
        {illustration || <DefaultIllustration type={type} />}
      </div>

      {/* Error Code */}
      {displayCode && (
        <div className="mb-4 text-6xl font-bold text-gray-200 sm:text-8xl dark:text-gray-700">
          {displayCode}
        </div>
      )}

      {/* Title */}
      <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
        {displayTitle}
      </h1>

      {/* Description */}
      <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
        {displayDescription}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {primaryAction && (
          <ActionButton
            label={primaryAction.label}
            onClick={primaryAction.onClick}
            href={primaryAction.href}
            variant="primary"
          />
        )}
        {secondaryAction && (
          <ActionButton
            label={secondaryAction.label}
            onClick={secondaryAction.onClick}
            href={secondaryAction.href}
            variant="secondary"
          />
        )}
        {showHomeButton && !primaryAction && (
          <ActionButton
            label="Take Me Home"
            href={homeHref}
            variant="primary"
          />
        )}
        {showBackButton && (
          <ActionButton
            label="Go Back"
            onClick={handleBack}
            variant="secondary"
          />
        )}
      </div>

      {/* Additional Content */}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}

// =============================================================================
// NotFoundPage Component
// =============================================================================

export type NotFoundPageProps = Omit<ErrorPageProps, 'type'>;

/**
 * A pre-configured 404 Not Found page.
 *
 * @example
 * ```tsx
 * <NotFoundPage showHomeButton showBackButton />
 * ```
 */
export function NotFoundPage(props: NotFoundPageProps) {
  return <ErrorPage type="404" {...props} />;
}

// =============================================================================
// ServerErrorPage Component
// =============================================================================

export interface ServerErrorPageProps extends Omit<ErrorPageProps, 'type'> {
  /** Error details for debugging */
  error?: Error | string;
  /** Show error details in development */
  showErrorDetails?: boolean;
}

/**
 * A pre-configured 500 Server Error page.
 *
 * @example
 * ```tsx
 * <ServerErrorPage error={error} showErrorDetails={isDev} />
 * ```
 */
export function ServerErrorPage({
  error,
  showErrorDetails = false,
  children,
  ...props
}: ServerErrorPageProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <ErrorPage type="500" {...props}>
      {showErrorDetails && errorMessage && (
        <div className="mt-4 max-w-2xl text-left">
          <details className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Error Details
            </summary>
            <div className="mt-3 space-y-2">
              <p className="font-mono text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
              {errorStack && (
                <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                  {errorStack}
                </pre>
              )}
            </div>
          </details>
        </div>
      )}
      {children}
    </ErrorPage>
  );
}

// =============================================================================
// OfflinePage Component
// =============================================================================

export interface OfflinePageProps extends Omit<ErrorPageProps, 'type'> {
  /** Retry callback */
  onRetry?: () => void;
}

/**
 * A page displayed when the user is offline.
 *
 * @example
 * ```tsx
 * <OfflinePage onRetry={() => window.location.reload()} />
 * ```
 */
export function OfflinePage({ onRetry, ...props }: OfflinePageProps) {
  return (
    <ErrorPage
      type="offline"
      primaryAction={
        onRetry
          ? { label: 'Try Again', onClick: onRetry }
          : { label: 'Refresh', onClick: () => window.location.reload() }
      }
      showHomeButton={false}
      showBackButton={false}
      {...props}
    />
  );
}

// =============================================================================
// MaintenancePage Component
// =============================================================================

export interface MaintenancePageProps extends Omit<ErrorPageProps, 'type'> {
  /** Estimated time until back online */
  estimatedTime?: string;
  /** Status page URL */
  statusUrl?: string;
}

/**
 * A page displayed during maintenance.
 *
 * @example
 * ```tsx
 * <MaintenancePage
 *   estimatedTime="30 minutes"
 *   statusUrl="https://status.example.com"
 * />
 * ```
 */
export function MaintenancePage({
  estimatedTime,
  statusUrl,
  description,
  children,
  ...props
}: MaintenancePageProps) {
  const fullDescription =
    description ?? DEFAULT_ERROR_CONFIGS.maintenance.description;
  const descriptionWithTime = estimatedTime
    ? `${fullDescription} Estimated time: ${estimatedTime}.`
    : fullDescription;

  return (
    <ErrorPage
      type="maintenance"
      description={descriptionWithTime}
      showHomeButton={false}
      showBackButton={false}
      {...props}
    >
      {statusUrl && (
        <a
          href={statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Check Status Page →
        </a>
      )}
      {children}
    </ErrorPage>
  );
}

// =============================================================================
// AccessDeniedPage Component
// =============================================================================

export interface AccessDeniedPageProps extends Omit<ErrorPageProps, 'type'> {
  /** Show sign in button for 401 */
  showSignInButton?: boolean;
  /** Sign in callback or URL */
  onSignIn?: () => void;
  signInHref?: string;
}

/**
 * A page displayed when access is denied (403/401).
 *
 * @example
 * ```tsx
 * <AccessDeniedPage showSignInButton onSignIn={handleLogin} />
 * ```
 */
export function AccessDeniedPage({
  showSignInButton = false,
  onSignIn,
  signInHref = '/login',
  ...props
}: AccessDeniedPageProps) {
  return (
    <ErrorPage
      type="403"
      primaryAction={
        showSignInButton
          ? { label: 'Sign In', onClick: onSignIn, href: signInHref }
          : undefined
      }
      {...props}
    />
  );
}

// =============================================================================
// Helper Components
// =============================================================================

interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  href?: string;
  variant: 'primary' | 'secondary';
}

function ActionButton({ label, onClick, href, variant }: ActionButtonProps) {
  if (href) {
    return (
      <a
        href={href}
        className={cn(
          buttonVariants({ variant, size: 'md' }),
          'min-w-[140px] text-center'
        )}
      >
        {label}
      </a>
    );
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      variant={variant}
      size="md"
      className="min-w-[140px]"
    >
      {label}
    </Button>
  );
}

interface DefaultIllustrationProps {
  type: ErrorType;
}

function DefaultIllustration({ type }: DefaultIllustrationProps) {
  const iconClasses = 'h-24 w-24 text-gray-300 dark:text-gray-600';

  switch (type) {
    case '404':
      return <Search404Icon className={iconClasses} />;
    case '500':
      return <ServerErrorIcon className={iconClasses} />;
    case '403':
    case '401':
      return <LockIcon className={iconClasses} />;
    case 'offline':
      return <WifiOffIcon className={iconClasses} />;
    case 'maintenance':
      return <WrenchIcon className={iconClasses} />;
    default:
      return <AlertIcon className={iconClasses} />;
  }
}

// =============================================================================
// Icons
// =============================================================================

function Search404Icon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 8.5v0m0 3.5v.01"
      />
    </svg>
  );
}

function ServerErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function WifiOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.867 19.125h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}
