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
import {
  MailIcon,
  PhoneIcon,
  GlobeIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../Icons';
import { Linkedin } from 'lucide-react';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get a nested value from an object using dot notation (e.g., 'company.domain')
 */
function getNestedValue(
  obj: Record<string, unknown> | undefined | null,
  path: string
): unknown {
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
    'bg-primary-600',
    'bg-green-600',
    'bg-orange-600',
    'bg-secondary-600',
    'bg-pink-600',
    'bg-primary-700',
    'bg-teal-600',
    'bg-amber-600',
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
  nextProps: ICellRendererParams
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
    bgClass: 'bg-primary-100 dark:bg-primary-900/30',
    textClass: 'text-primary-600 dark:text-primary-400',
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
export function AvatarNameRenderer(
  props: AvatarNameRendererProps
): React.ReactElement {
  const { data, value } = props;
  if (!data && !value) return <span className="text-muted-foreground">--</span>;

  const displayName = typeof value === 'string' && value ? value : 'Unknown';
  const isSystemValue = ['Unknown', 'Unassigned', 'System'].includes(
    displayName
  );

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
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-400 dark:bg-gray-700 dark:text-gray-500">
          {displayName === 'Unassigned' ? '—' : '??'}
        </div>
        <span className="truncate text-gray-400 italic dark:text-gray-500">
          {displayName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className="h-7 w-7 rounded-full bg-white object-cover ring-2 ring-white dark:ring-gray-700"
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
          getAvatarColor(displayName)
        )}
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        {initials}
      </div>
      <span className="text-foreground truncate font-medium">
        {displayName}
      </span>
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
export function StatusBadgeRenderer(
  props: StatusBadgeRendererProps
): React.ReactElement {
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
        config.textClass
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
function getEngagementScoreColors(score: number): {
  barColor: string;
  textColor: string;
} {
  if (score >= 70)
    return {
      barColor: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
    };
  if (score >= 40)
    return {
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
    };
  if (score >= 20)
    return {
      barColor: 'bg-orange-500',
      textColor: 'text-orange-600 dark:text-orange-400',
    };
  return {
    barColor: 'bg-gray-400',
    textColor: 'text-gray-600 dark:text-gray-400',
  };
}

/**
 * Renders engagement score with color-coded progress bar
 */
export function EngagementScoreRenderer(
  props: ICellRendererParams
): React.ReactElement {
  const { value } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const score = Number(value);
  const percentage = Math.min(100, Math.max(0, score));
  const { barColor, textColor } = getEngagementScoreColors(score);

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
      className="text-primary-600 dark:text-primary-400 inline-flex items-center gap-1.5 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <MailIcon className="h-3 w-3 opacity-60" />
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
      className="text-foreground hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <PhoneIcon className="h-3 w-3 text-green-500 opacity-70" />
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
      className="text-primary-600 dark:text-primary-400 inline-flex items-center gap-1.5 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <GlobeIcon className="h-3 w-3 opacity-60" />
      <span className="truncate">{displayDomain}</span>
    </a>
  );
}

/**
 * Renders a LinkedIn URL with icon
 */
export function LinkedInRenderer(
  props: ICellRendererParams
): React.ReactElement {
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
      <Linkedin className="h-4 w-4" />
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
export function CurrencyRenderer(
  props: ICellRendererParams
): React.ReactElement {
  const { value } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <span className="text-foreground font-medium tabular-nums">
      {formatted}
    </span>
  );
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

  return <span className="text-foreground tabular-nums">{formatted}</span>;
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
export function BooleanRenderer(
  props: ICellRendererParams
): React.ReactElement {
  const { value } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const isTrue = Boolean(value);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isTrue
          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      )}
    >
      {isTrue ? (
        <CheckCircleIcon className="h-3 w-3" />
      ) : (
        <ClockIcon className="h-3 w-3" />
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
export function CompanyRenderer(
  props: CompanyRendererProps
): React.ReactElement {
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
          className="h-5 w-5 rounded bg-white object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const sibling = target.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-5 w-5 items-center justify-center rounded text-[9px] font-semibold"
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
export function ProgressRenderer(
  props: ProgressRendererProps
): React.ReactElement {
  const { value, barColor = 'bg-primary-500', max = 100 } = props;
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const percentage = Math.min(100, Math.max(0, (Number(value) / max) * 100));

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs font-medium">
        {Math.round(percentage)}%
      </span>
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
          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        >
          {tag}
        </span>
      ))}
      {value.length > 3 && (
        <span className="text-muted-foreground text-xs">
          +{value.length - 3}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Memoized Renderer Exports (for performance)
// =============================================================================

export const MemoizedAvatarNameRenderer = memo(
  AvatarNameRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedStatusBadgeRenderer = memo(
  StatusBadgeRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedEngagementScoreRenderer = memo(
  EngagementScoreRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedEmailRenderer = memo(
  EmailRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedPhoneRenderer = memo(
  PhoneRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedLinkedInRenderer = memo(
  LinkedInRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedDomainRenderer = memo(
  DomainRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedCurrencyRenderer = memo(
  CurrencyRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedNumberRenderer = memo(
  NumberRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedDateRenderer = memo(
  DateRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedBooleanRenderer = memo(
  BooleanRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedCompanyRenderer = memo(
  CompanyRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedProgressRenderer = memo(
  ProgressRenderer,
  cellRendererPropsAreEqual
);
export const MemoizedTagsRenderer = memo(
  TagsRenderer,
  cellRendererPropsAreEqual
);

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
