import { cva, type VariantProps } from 'class-variance-authority';
import { Phone as PhoneIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export type PhoneNumberType = 'Cell' | 'Home' | 'Work' | 'Other' | string;

/** Structured phone number entry (matches BlueHive API shape). */
export interface PhoneNumberEntry {
  number: string;
  type?: PhoneNumberType;
  extension?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/** Strip everything that isn't a digit or leading `+`. */
function stripNonDigits(value: string): string {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Format a phone number for display.
 *
 * Handles:
 * - 10-digit US numbers:       "(317) 555-0123"
 * - 11-digit US (leading 1):   "+1 (317) 555-0123"
 * - E.164 / international:     returns the original (already canonical)
 * - Anything else:             returns the input unchanged
 *
 * This function is pure and safe to call with any string. Invalid input
 * is returned as-is so the caller can still display something.
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  // Preserve E.164-style international numbers that aren't NANP.
  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '');
    // NANP international: +1XXXXXXXXXX
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  // Unknown format — return caller's input unchanged so it's still visible.
  return trimmed;
}

/**
 * Build an RFC 3966 / `tel:` URI from a phone number, preserving the
 * extension if provided.
 */
export function toTelHref(value: string, extension?: string): string {
  const normalized = stripNonDigits(value);
  // Default to +1 for 10-digit US numbers so dialers handle them correctly.
  const dialNumber = /^\d{10}$/.test(normalized)
    ? `+1${normalized}`
    : normalized;
  const ext = extension ? `;ext=${extension.replace(/\D/g, '')}` : '';
  return `tel:${dialNumber}${ext}`;
}

// =============================================================================
// Variants
// =============================================================================

const phoneNumberVariants = cva('inline-flex items-center gap-1.5', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    /**
     * Visual tone of the link.
     * - `muted`: muted foreground that brightens on hover (best on list rows)
     * - `link`:  primary-colored link (best on standalone pages)
     * - `plain`: inherits color (no distinct link styling)
     */
    tone: {
      muted:
        'text-muted-foreground hover:text-foreground focus-visible:text-foreground',
      link: 'text-primary-600 hover:text-primary-700 hover:underline focus-visible:underline',
      plain: 'text-inherit hover:underline',
    },
  },
  defaultVariants: {
    size: 'sm',
    tone: 'muted',
  },
});

// =============================================================================
// Component
// =============================================================================

type AnchorProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'children'
>;

export interface PhoneNumberProps
  extends VariantProps<typeof phoneNumberVariants>,
    AnchorProps {
  /**
   * The phone number to display. Accepts either a string or a structured
   * entry (`{ number, type, extension }`). Invalid / non-numeric input is
   * rendered as plain text (no `tel:` link) so your UI never breaks.
   */
  value: string | PhoneNumberEntry | null | undefined;
  /**
   * Optional extension. Ignored when `value` is a `PhoneNumberEntry` that
   * already carries an `extension`.
   */
  extension?: string;
  /**
   * Optional label (e.g. "Cell", "Work") shown after the number.
   * When `value` is a `PhoneNumberEntry`, its `type` is used by default.
   * Set to `false` to suppress.
   */
  label?: string | false;
  /** Show a phone icon before the number. Defaults to `false`. */
  showIcon?: boolean;
  /** Custom icon to use (overrides the default phone icon). */
  icon?: React.ReactNode;
  /**
   * When `true` (default), clicking/tapping the number opens the user's
   * dialer via `tel:`. Set to `false` to render as plain text.
   */
  clickable?: boolean;
  /**
   * Fallback content shown when `value` is empty. Defaults to `—`.
   */
  fallback?: React.ReactNode;
  /**
   * Stop click events from bubbling (useful inside clickable rows/cards
   * so tapping the phone doesn't also trigger row navigation).
   * Defaults to `true`.
   */
  stopPropagation?: boolean;
}

/**
 * Renders a phone number that is always formatted consistently and
 * hyperlinked via `tel:` so it opens the device dialer on click.
 *
 * Safe to use anywhere a phone number appears — it handles formatting,
 * accessibility, empty values, and event bubbling for you.
 *
 * @example
 * ```tsx
 * // Bare string — auto-formats to "(317) 555-0123"
 * <PhoneNumber value="3175550123" />
 *
 * // Structured entry from the API
 * <PhoneNumber value={{ number: "3175550123", type: "Cell" }} showIcon />
 *
 * // Standalone link style on a detail page
 * <PhoneNumber value={employer.phone} tone="link" size="md" />
 *
 * // Non-clickable display (e.g. printed invoices)
 * <PhoneNumber value={phone} clickable={false} />
 * ```
 */
export function PhoneNumber({
  value,
  extension,
  label,
  showIcon = false,
  icon,
  clickable = true,
  fallback = '—',
  stopPropagation = true,
  size,
  tone,
  className,
  onClick,
  ...anchorProps
}: PhoneNumberProps) {
  // Normalize input
  const entry: PhoneNumberEntry | null = React.useMemo(() => {
    if (!value) return null;
    if (typeof value === 'string') {
      return value.trim() ? { number: value } : null;
    }
    if (!value.number || !String(value.number).trim()) return null;
    return value;
  }, [value]);

  if (!entry) {
    return (
      <span
        className={cn('text-xs italic text-muted-foreground', className)}
        aria-label="No phone number"
      >
        {fallback}
      </span>
    );
  }

  const ext = entry.extension ?? extension;
  const formatted = formatPhoneNumber(entry.number);
  const derivedLabel = label === false ? undefined : (label ?? entry.type);

  const iconEl = showIcon
    ? (icon ?? (
        <PhoneIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ))
    : null;

  const body = (
    <>
      {iconEl}
      <span className="truncate">
        {formatted}
        {ext ? <span className="ml-1 opacity-80">ext. {ext}</span> : null}
        {derivedLabel ? (
          <span className="ml-1 text-xs opacity-70">({derivedLabel})</span>
        ) : null}
      </span>
    </>
  );

  // Accessible label for screen readers — always unformatted + context
  const ariaLabel = [
    'Call',
    formatted || entry.number,
    ext ? `extension ${ext}` : null,
    derivedLabel ? `(${derivedLabel})` : null,
  ]
    .filter(Boolean)
    .join(' ');

  if (!clickable) {
    return (
      <span
        className={cn(
          phoneNumberVariants({ size, tone: tone ?? 'plain' }),
          'cursor-default',
          className
        )}
      >
        {body}
      </span>
    );
  }

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (stopPropagation) e.stopPropagation();
    onClick?.(e);
  };

  return (
    <a
      href={toTelHref(entry.number, ext)}
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(phoneNumberVariants({ size, tone }), className)}
      {...anchorProps}
    >
      {body}
    </a>
  );
}

PhoneNumber.displayName = 'PhoneNumber';
