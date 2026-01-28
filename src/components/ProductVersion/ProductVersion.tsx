import * as React from 'react';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface ProductVersionProps {
  /** Product name */
  name: string;
  /** Version string (e.g., "1.2.3", "v2.0.0-beta") */
  version: string;
  /** Build number or commit hash (optional) */
  build?: string;
  /** Environment label (optional) */
  environment?: 'development' | 'staging' | 'production' | string;
  /** Additional copyright text */
  copyright?: string;
  /** Year for copyright (defaults to current year) */
  year?: number | string;
  /** Company or author name for copyright */
  author?: string;
  /** Link to changelog or release notes */
  changelogUrl?: string;
  /** Display variant */
  variant?: 'inline' | 'stacked' | 'minimal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================================
// ProductVersion Component
// ============================================================================

/**
 * Displays product version information, typically used in footers or settings pages.
 *
 * @example
 * ```tsx
 * // Minimal display
 * <ProductVersion name="BlueHive" version="2.1.0" variant="minimal" />
 *
 * // Full display with all details
 * <ProductVersion
 *   name="BlueHive"
 *   version="2.1.0"
 *   build="abc1234"
 *   environment="production"
 *   author="MIE"
 *   year={2024}
 * />
 * ```
 */
export function ProductVersion({
  name,
  version,
  build,
  environment,
  copyright,
  year = new Date().getFullYear(),
  author,
  changelogUrl,
  variant = 'inline',
  size = 'md',
  className,
  onClick,
}: ProductVersionProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const environmentColors = {
    development:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    staging: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    production:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const getEnvironmentColor = (env: string) => {
    if (env in environmentColors) {
      return environmentColors[env as keyof typeof environmentColors];
    }
    return 'bg-muted text-muted-foreground';
  };

  const versionDisplay = version.startsWith('v') ? version : `v${version}`;

  const copyrightText =
    copyright || (author ? `© ${year} ${author}` : `© ${year}`);

  const VersionContent = () => {
    if (variant === 'minimal') {
      return (
        <span className="text-muted-foreground">
          {name} {versionDisplay}
          {build && <span className="ml-1 opacity-60">({build})</span>}
        </span>
      );
    }

    if (variant === 'stacked') {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{name}</span>
            <span className="text-muted-foreground">{versionDisplay}</span>
            {environment && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-xs font-medium uppercase',
                  getEnvironmentColor(environment)
                )}
              >
                {environment}
              </span>
            )}
          </div>
          {build && (
            <span className="text-muted-foreground opacity-60">
              Build: {build}
            </span>
          )}
          {(author || copyright) && (
            <span className="text-muted-foreground">{copyrightText}</span>
          )}
        </div>
      );
    }

    // Default: inline
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">{versionDisplay}</span>
        {build && (
          <span className="text-muted-foreground opacity-60">({build})</span>
        )}
        {environment && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-xs font-medium uppercase',
              getEnvironmentColor(environment)
            )}
          >
            {environment}
          </span>
        )}
        {(author || copyright) && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-muted-foreground">{copyrightText}</span>
          </>
        )}
      </div>
    );
  };

  const content = <VersionContent />;

  const wrapperClasses = cn(
    sizeClasses[size],
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );

  if (changelogUrl) {
    return (
      <a
        href={changelogUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(wrapperClasses, 'underline-offset-2 hover:underline')}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={wrapperClasses}>
        {content}
      </button>
    );
  }

  return <div className={wrapperClasses}>{content}</div>;
}

// ============================================================================
// ProductVersionBadge - Compact Badge Variant
// ============================================================================

export interface ProductVersionBadgeProps {
  /** Version string */
  version: string;
  /** Build number or commit hash */
  build?: string;
  /** Environment label */
  environment?: 'development' | 'staging' | 'production' | string;
  /** Custom className */
  className?: string;
}

/**
 * Compact badge showing version and optional environment.
 *
 * @example
 * ```tsx
 * <ProductVersionBadge version="2.1.0" environment="staging" />
 * ```
 */
export function ProductVersionBadge({
  version,
  build,
  environment,
  className,
}: ProductVersionBadgeProps) {
  const versionDisplay = version.startsWith('v') ? version : `v${version}`;

  const environmentColors = {
    development: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20',
    staging: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20',
    production: 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
  };

  const getEnvironmentStyle = (env?: string) => {
    if (!env) return 'border-border bg-muted';
    if (env in environmentColors) {
      return environmentColors[env as keyof typeof environmentColors];
    }
    return 'border-border bg-muted';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
        getEnvironmentStyle(environment),
        className
      )}
    >
      <span className="font-mono font-medium">{versionDisplay}</span>
      {build && (
        <span className="text-muted-foreground font-mono opacity-70">
          {build.substring(0, 7)}
        </span>
      )}
      {environment && (
        <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          {environment.substring(0, 3)}
        </span>
      )}
    </div>
  );
}

export default ProductVersion;
