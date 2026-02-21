import * as React from 'react';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface StripeBadgeProps {
  /** Display variant */
  variant?: 'default' | 'outline' | 'minimal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show "Powered by" text */
  showPoweredBy?: boolean;
  /** Link to Stripe's website */
  href?: string;
  /** Custom className */
  className?: string;
}

// ============================================================================
// Stripe Logo SVG
// ============================================================================

function StripeLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 60 25"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Stripe"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.64 14.28c0-4.38-2.1-7.84-6.12-7.84-4.04 0-6.48 3.46-6.48 7.8 0 5.16 2.88 7.76 7.02 7.76 2.02 0 3.54-.46 4.7-1.1v-3.42c-1.16.58-2.48.94-4.16.94-1.64 0-3.1-.58-3.28-2.58h8.28c0-.22.04-1.1.04-1.56zm-8.36-1.62c0-1.92 1.18-2.72 2.26-2.72 1.04 0 2.16.8 2.16 2.72h-4.42zM40.04 6.44c-1.66 0-2.72.78-3.32 1.32l-.22-1.04h-3.74v20.52l4.24-.9.02-4.98c.62.44 1.52 1.08 3 1.08 3.04 0 5.8-2.44 5.8-7.82-.02-4.92-2.82-7.58-5.78-7.58v-.6zm-1.02 11.66c-1 0-1.58-.36-2-.8l-.02-6.32c.44-.48 1.04-.86 2.02-.86 1.54 0 2.6 1.74 2.6 4 0 2.3-1.04 3.98-2.6 3.98zM27.42 5.16l4.26-.92V.78l-4.26.9v3.48zM27.42 6.72h4.26v14.86h-4.26V6.72zM22.94 7.94l-.26-1.22h-3.68v14.86h4.24v-10.1c1-.8 2.7-.66 3.24-.44V6.72c-.56-.2-2.62-.58-3.54 1.22zM14.66 2.9l-4.14.88-.02 13.6c0 2.52 1.88 4.38 4.4 4.38 1.4 0 2.42-.26 2.98-.56v-3.44c-.54.22-3.22 1-3.22-1.5V10.2h3.22V6.72h-3.22V2.9zM4.32 11.08c0-.66.54-1.14 1.44-1.14 1.28 0 2.9.52 4.18 1.44V7.36c-1.4-.56-2.78-.78-4.18-.78C2.32 6.58 0 8.46 0 11.3c0 4.48 6.16 3.76 6.16 5.7 0 .78-.68 1.04-1.62 1.04-1.4 0-3.2-.58-4.62-1.36v4.04c1.58.68 3.18.98 4.62.98 3.5 0 5.9-1.74 5.9-4.62-.02-4.84-6.2-3.98-6.2-5.8h.08z"
      />
    </svg>
  );
}

// ============================================================================
// StripeBadge Component
// ============================================================================

/**
 * A badge indicating Stripe payment processing, commonly used in payment forms
 * and checkout pages to show trust and security.
 *
 * @example
 * ```tsx
 * <StripeBadge />
 * <StripeBadge variant="outline" showPoweredBy />
 * <StripeBadge size="sm" variant="minimal" />
 * ```
 */
export function StripeBadge({
  variant = 'default',
  size = 'md',
  showPoweredBy = true,
  href = 'https://stripe.com',
  className,
}: StripeBadgeProps) {
  const sizeClasses = {
    sm: {
      container: 'gap-1 px-2 py-1',
      text: 'text-xs',
      logo: 'h-3',
    },
    md: {
      container: 'gap-1.5 px-3 py-1.5',
      text: 'text-sm',
      logo: 'h-4',
    },
    lg: {
      container: 'gap-2 px-4 py-2',
      text: 'text-base',
      logo: 'h-5',
    },
  };

  const variantClasses = {
    default: 'bg-[#635bff]/5 text-[#635bff] dark:bg-[#635bff]/20',
    outline: 'border border-[#635bff]/30 text-[#635bff]',
    minimal: 'text-muted-foreground hover:text-[#635bff]',
  };

  const content = (
    <>
      {showPoweredBy && (
        <span className={cn('font-normal', sizeClasses[size].text)}>
          Powered by
        </span>
      )}
      <StripeLogo className={sizeClasses[size].logo} />
    </>
  );

  const badgeClasses = cn(
    'inline-flex items-center rounded-md transition-colors',
    sizeClasses[size].container,
    variantClasses[variant],
    variant !== 'minimal' && 'font-medium',
    className
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(badgeClasses, 'hover:opacity-80')}
        aria-label="Powered by Stripe - Visit Stripe website"
      >
        {content}
      </a>
    );
  }

  return (
    <div className={badgeClasses} role="img" aria-label="Powered by Stripe">
      {content}
    </div>
  );
}

// ============================================================================
// StripeSecureBadge - Security-focused variant
// ============================================================================

export interface StripeSecureBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md';
  /** Custom className */
  className?: string;
}

/**
 * A badge emphasizing Stripe's security, commonly used near sensitive form fields.
 *
 * @example
 * ```tsx
 * <StripeSecureBadge />
 * <StripeSecureBadge size="sm" />
 * ```
 */
export function StripeSecureBadge({
  size = 'md',
  className,
}: StripeSecureBadgeProps) {
  const sizeClasses = {
    sm: {
      container: 'gap-1.5',
      icon: 'h-3 w-3',
      text: 'text-xs',
      logo: 'h-2.5',
    },
    md: {
      container: 'gap-2',
      icon: 'h-4 w-4',
      text: 'text-sm',
      logo: 'h-3',
    },
  };

  return (
    <div
      className={cn(
        'text-muted-foreground inline-flex items-center',
        sizeClasses[size].container,
        className
      )}
      role="img"
      aria-label="Secure payments powered by Stripe"
    >
      <svg
        className={cn(
          sizeClasses[size].icon,
          'text-green-600 dark:text-green-500'
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span className={sizeClasses[size].text}>Secured by</span>
      <StripeLogo className={sizeClasses[size].logo} />
    </div>
  );
}

export default StripeBadge;
