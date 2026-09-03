'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';
import { Button, type ButtonProps } from '../Button/Button';

// =============================================================================
// Types
// =============================================================================

export interface HeroAction {
  /** Label for the action button. */
  label: string;
  /** Click handler. */
  onClick?: () => void;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
  /** Disable the action. */
  disabled?: boolean;
  /** Override button variant (default: primary for primaryAction, outline for secondaryActions). */
  variant?: ButtonProps['variant'];
}

export interface HeroActionCardProps {
  /** Eyebrow text rendered above the title. */
  eyebrow?: string;
  /** Main title. */
  title: string;
  /** Supporting description. */
  description?: string;
  /** Primary call-to-action (rendered as the prominent button). */
  primaryAction: HeroAction;
  /** Optional secondary actions rendered as outline buttons. */
  secondaryActions?: HeroAction[];
  /** Optional illustration node (svg / image) rendered on the right. */
  illustration?: React.ReactNode;
  /** Additional CSS classes. */
  className?: string;
  /** Optional children rendered below the actions (e.g. inline helper). */
  children?: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

/**
 * HeroActionCard — full-width primary-workflow card for dashboards.
 *
 * Pairs a prominent headline + primary CTA with optional secondary actions
 * and illustration. Uses brand gradients from CSS variables so it respects
 * the active ThemeProvider brand.
 */
export function HeroActionCard({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
  illustration,
  className,
  children,
}: HeroActionCardProps): React.JSX.Element {
  return (
    <section
      className={cn(
        'border-primary-200/60 relative overflow-hidden rounded-2xl border',
        'to-primary-100/40 bg-gradient-to-br from-primary-50 via-white',
        'dark:border-primary-800/60 dark:to-primary-900/20 dark:from-primary-950 dark:via-neutral-900',
        'shadow-sm',
        className
      )}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="bg-primary-200/40 dark:bg-primary-700/20 pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-primary-300/30 dark:bg-primary-500/10 pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full blur-3xl"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              {eyebrow}
            </p>
          )}
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant={primaryAction.variant ?? 'primary'}
              size="lg"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.icon && (
                <span className="h-5 w-5" aria-hidden="true">
                  {primaryAction.icon}
                </span>
              )}
              {primaryAction.label}
            </Button>
            {secondaryActions?.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'outline'}
                size="md"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && (
                  <span className="h-4 w-4" aria-hidden="true">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </Button>
            ))}
          </div>

          {children && <div className="mt-4">{children}</div>}
        </div>

        {illustration && (
          <div className="relative hidden flex-shrink-0 md:block md:max-w-[220px] lg:max-w-[280px]">
            {illustration}
          </div>
        )}
      </div>
    </section>
  );
}
