/**
 * AG Grid Cell Renderers
 *
 * Rich, visually appealing cell renderers for AG Grid tables.
 * Based on Waggleline's production-tested implementations with
 * full dark mode support and design system integration.
 *
 * All renderers are memoized with React.memo for performance optimization.
 */

import * as React from 'react';
import { memo } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { cn } from '../../utils/cn';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get a nested value from an object using dot notation (e.g., 'company.domain')
 */
function getNestedValue(obj: Record<string, unknown> | undefined | null, path: string): unknown {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Get favicon URL from a domain using Google's favicon service
 */
function getFaviconUrl(domain: string | null | undefined): string | null {
  if (!domain || typeof domain !== 'string') return null;
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim();
  if (!cleanDomain) return null;
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;
}

/**
 * Format a phone number with dashes for display
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `${cleaned[0]}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Generate initials from a name
 */
function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '??';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Generate a consistent avatar color based on a name
 */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-amber-500',
  ];
  if (!name || typeof name !== 'string') return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Custom comparison function for AG Grid cell renderers.
 */
function cellRendererPropsAreEqual(
  prevProps: ICellRendererParams,
  nextProps: ICellRendererParams,
): boolean {
  if (prevProps.value !== nextProps.value) return false;
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.node?.rowIndex !== nextProps.node?.rowIndex) return false;
  return true;
}

// =============================================================================
// Status Configuration Types
// =============================================================================

export interface StatusConfig {
  label: string;
  bgClass: string;
  textClass: string;
  iconName?: string;
}

// =============================================================================
// Default Status Colors
// =============================================================================

export const statusColors: Record<string, StatusConfig> = {
  active: {
    label: 'Active',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-600 dark:text-green-400',
  },
  inactive: {
    label: 'Inactive',
    bgClass: 'bg-gray-200 dark:bg-gray-700',
    textClass: 'text-gray-600 dark:text-gray-400',
  },
  pending: {
    label: 'Pending',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  new: {
    label: 'New',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  verified: {
    label: 'Verified',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-600 dark:text-green-400',
  },
  flagged: {
    label: 'Flagged',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-600 dark:text-red-400',
  },
};

// =============================================================================
// Avatar Name Renderer
// =============================================================================

interface AvatarNameRendererProps extends ICellRendererParams {
  avatarField?: string;
  domainField?: string;
}

/**
 * Renders an avatar with name, suitable for contact/owner columns
 */
export function AvatarNameRenderer(props: AvatarNameRendererProps): React.ReactElement {
  const { data, value } = props;
  if (!data && !value) return <span className="text-muted-foreground">--</span>;

  const displayName = typeof value === 'string' && value ? value : 'Unknown';
  const isSystemValue = ['Unknown', 'Unassigned', 'System'].includes(displayName);

  const avatarUrl =
    props.avatarField && data
      ? (getNestedValue(data, props.avatarField) as string | undefined)
      : data?.avatarUrl;

  const domain =
    props.domainField && data
      ? (getNestedValue(data, props.domainField) as string | undefined)
      : data?.company?.domain || data?.domain;

  const faviconUrl = getFaviconUrl(domain);
  const initials = getInitials(displayName);
  const imageUrl = avatarUrl || faviconUrl;

  if (isSystemValue) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-400 dark:text-gray-500">
          {displayName === 'Unassigned' ? '—' : '??'}
        </div>
        <span className="truncate text-gray-400 dark:text-gray-500 italic">{displayName}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className="h-7 w-7 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 bg-white"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const sibling = target.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white',
          getAvatarColor(displayName),
        )}
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        {initials}
      </div>
      <span className="truncate font-medium text-foreground">{displayName}</span>
    </div>
  );
}

// =============================================================================
// Status Badge Renderer
// =============================================================================

export interface StatusBadgeRendererProps extends ICellRendererParams {
  /** Custom status color configuration */
  statusConfig?: Record<string, StatusConfig>;
}

/**
 * Renders a colorful status badge
 */
export function StatusBadgeRenderer(props: StatusBadgeRendererProps): React.ReactElement {
  const { value, statusConfig = statusColors } = props;
  if (!value) return <span className="text-muted-foreground">--</span>;

  const normalizedValue = String(value).toLowerCase().replace(/\s+/g, '_');
  const config = statusConfig[normalizedValue] || {
    label: value,
    bgClass: 'bg-gray-200 dark:bg-gray-700',
    textClass: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bgClass,
        config.textClass,
      )}
    >
      {config.label}
    </span>
  );
}

// =============================================================================
// Engagement Score Renderer
// =============================================================================

/**
 * Get engagement score colors based on threshold
 */
function getEngagementScoreColors(score: number): { barColor: string; textColor: string } {
  if (score >= 70) return { barColor: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' };
  if (score >= 40) return { barColor: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' };
  if (score >= 20) return { barColor: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400' };
  return { barColor: 'bg-gray-400', textColor: 'text-gray-600 dark:text-gray-400' };
}

/**
 * Renders engagement score with color-coded progress bar
 */
export function EngagementScoreRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const score = Number(value);
  const percentage = Math.min(100, Math.max(0, score));
  const { barColor, textColor } = getEngagementScoreColors(score);

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-16 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-sm font-medium', textColor)}>{score}</span>
    </div>
  );
}

// =============================================================================
// Email Renderer
// =============================================================================

/**
 * Renders email with mailto link
 */
export function EmailRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (!value) return <span className="text-muted-foreground">--</span>;

  return (
    <a
      href={`mailto:${value}`}
      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span className="truncate">{value}</span>
    </a>
  );
}

// =============================================================================
// Phone Renderer
// =============================================================================

/**
 * Renders phone with click-to-call
 */
export function PhoneRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (!value) return <span className="text-muted-foreground">--</span>;

  const displayValue = formatPhoneDisplay(value);

  return (
    <a
      href={`tel:${value}`}
      className="inline-flex items-center gap-1.5 text-foreground hover:text-blue-600 dark:hover:text-blue-400"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="h-3 w-3 text-green-500 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span>{displayValue}</span>
    </a>
  );
}

// =============================================================================
// Link Renderers
// =============================================================================

/**
 * Renders a domain/website URL with icon
 */
export function DomainRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (!value) return <span className="text-muted-foreground">--</span>;

  const url = value.startsWith('http') ? value : `https://${value}`;
  const displayDomain = value.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
      <span className="truncate">{displayDomain}</span>
    </a>
  );
}

/**
 * Renders a LinkedIn URL with icon
 */
export function LinkedInRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (!value) return <span className="text-muted-foreground">--</span>;

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[#0A66C2] hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
      <span className="truncate text-sm">LinkedIn</span>
    </a>
  );
}

// =============================================================================
// Currency Renderer
// =============================================================================

/**
 * Renders currency with proper formatting
 */
export function CurrencyRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return <span className="font-medium tabular-nums text-foreground">{formatted}</span>;
}

// =============================================================================
// Number Renderer
// =============================================================================

/**
 * Renders number with comma formatting
 */
export function NumberRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const formatted = Number(value).toLocaleString();

  return <span className="tabular-nums text-foreground">{formatted}</span>;
}

// =============================================================================
// Date Renderer
// =============================================================================

export interface DateRendererProps extends ICellRendererParams {
  format?: 'short' | 'medium' | 'long' | 'relative' | 'datetime';
}

/**
 * Renders date with formatting options
 */
export function DateRenderer(props: DateRendererProps): React.ReactElement {
  const { value, format = 'medium' } = props;
  if (!value) return <span className="text-muted-foreground">--</span>;

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return <span className="text-muted-foreground">--</span>;
  }

  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let relativeText: string;
    if (days === 0) {
      relativeText = 'Today';
    } else if (days === 1) {
      relativeText = 'Yesterday';
    } else if (days < 7) {
      relativeText = `${days} days ago`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      relativeText = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      relativeText = `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(days / 365);
      relativeText = `${years} year${years > 1 ? 's' : ''} ago`;
    }

    return <span className="text-muted-foreground">{relativeText}</span>;
  }

  const dateOptions: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { month: 'numeric', day: 'numeric' }
      : format === 'long'
        ? { month: 'long', day: 'numeric', year: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };

  if (format === 'datetime') {
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return <span className="text-foreground">{formatted}</span>;
  }

  const formatted = date.toLocaleDateString('en-US', dateOptions);

  return <span className="text-foreground">{formatted}</span>;
}

// =============================================================================
// Boolean/Yes-No Renderer
// =============================================================================

/**
 * Renders boolean as styled Yes/No badge
 */
export function BooleanRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const isTrue = Boolean(value);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isTrue
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      )}
    >
      {isTrue ? (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {isTrue ? 'Yes' : 'No'}
    </span>
  );
}

// =============================================================================
// Company Renderer
// =============================================================================

interface CompanyRendererProps extends ICellRendererParams {
  companyIdField?: string;
  domainField?: string;
}

/**
 * Renders company name with favicon
 */
export function CompanyRenderer(props: CompanyRendererProps): React.ReactElement {
  const { data, value } = props;
  if (!value) return <span className="text-muted-foreground">--</span>;

  const domain =
    props.domainField && data
      ? (getNestedValue(data, props.domainField) as string | undefined)
      : data?.company?.domain || data?.domain;

  const faviconUrl = getFaviconUrl(domain);

  return (
    <div className="flex items-center gap-2 py-0.5">
      {faviconUrl ? (
        <img
          src={faviconUrl}
          alt={value}
          className="h-5 w-5 rounded object-contain bg-white"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const sibling = target.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30 text-[9px] font-semibold text-blue-600 dark:text-blue-400"
        style={{ display: faviconUrl ? 'none' : 'flex' }}
      >
        {getInitials(value)}
      </div>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

// =============================================================================
// Progress Renderer
// =============================================================================

export interface ProgressRendererProps extends ICellRendererParams {
  /** Color of the progress bar */
  barColor?: string;
  /** Maximum value (default 100) */
  max?: number;
}

/**
 * Renders a progress bar
 */
export function ProgressRenderer(props: ProgressRendererProps): React.ReactElement {
  const { value, barColor = 'bg-blue-500', max = 100 } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const percentage = Math.min(100, Math.max(0, (Number(value) / max) * 100));

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-20 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{Math.round(percentage)}%</span>
    </div>
  );
}

// =============================================================================
// Tags Renderer
// =============================================================================

/**
 * Renders an array of tags as badges
 */
export function TagsRenderer(props: ICellRendererParams): React.ReactElement {
  const { value } = props;
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {value.slice(0, 3).map((tag: string, index: number) => (
        <span
          key={index}
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          {tag}
        </span>
      ))}
      {value.length > 3 && (
        <span className="text-xs text-muted-foreground">+{value.length - 3}</span>
      )}
    </div>
  );
}

// =============================================================================
// Memoized Renderer Exports (for performance)
// =============================================================================

export const MemoizedAvatarNameRenderer = memo(AvatarNameRenderer, cellRendererPropsAreEqual);
export const MemoizedStatusBadgeRenderer = memo(StatusBadgeRenderer, cellRendererPropsAreEqual);
export const MemoizedEngagementScoreRenderer = memo(EngagementScoreRenderer, cellRendererPropsAreEqual);
export const MemoizedEmailRenderer = memo(EmailRenderer, cellRendererPropsAreEqual);
export const MemoizedPhoneRenderer = memo(PhoneRenderer, cellRendererPropsAreEqual);
export const MemoizedLinkedInRenderer = memo(LinkedInRenderer, cellRendererPropsAreEqual);
export const MemoizedDomainRenderer = memo(DomainRenderer, cellRendererPropsAreEqual);
export const MemoizedCurrencyRenderer = memo(CurrencyRenderer, cellRendererPropsAreEqual);
export const MemoizedNumberRenderer = memo(NumberRenderer, cellRendererPropsAreEqual);
export const MemoizedDateRenderer = memo(DateRenderer, cellRendererPropsAreEqual);
export const MemoizedBooleanRenderer = memo(BooleanRenderer, cellRendererPropsAreEqual);
export const MemoizedCompanyRenderer = memo(CompanyRenderer, cellRendererPropsAreEqual);
export const MemoizedProgressRenderer = memo(ProgressRenderer, cellRendererPropsAreEqual);
export const MemoizedTagsRenderer = memo(TagsRenderer, cellRendererPropsAreEqual);

// =============================================================================
// Default Export
// =============================================================================

export const CellRenderers = {
  // Original renderers
  AvatarNameRenderer,
  StatusBadgeRenderer,
  EngagementScoreRenderer,
  EmailRenderer,
  PhoneRenderer,
  LinkedInRenderer,
  DomainRenderer,
  CurrencyRenderer,
  NumberRenderer,
  DateRenderer,
  BooleanRenderer,
  CompanyRenderer,
  ProgressRenderer,
  TagsRenderer,

  // Memoized renderers (recommended for performance)
  MemoizedAvatarNameRenderer,
  MemoizedStatusBadgeRenderer,
  MemoizedEngagementScoreRenderer,
  MemoizedEmailRenderer,
  MemoizedPhoneRenderer,
  MemoizedLinkedInRenderer,
  MemoizedDomainRenderer,
  MemoizedCurrencyRenderer,
  MemoizedNumberRenderer,
  MemoizedDateRenderer,
  MemoizedBooleanRenderer,
  MemoizedCompanyRenderer,
  MemoizedProgressRenderer,
  MemoizedTagsRenderer,

  // Utility functions
  formatPhoneDisplay,
};

export default CellRenderers;
