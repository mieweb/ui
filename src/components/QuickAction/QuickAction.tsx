import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const quickActionIconVariants = cva(
  ['flex items-center justify-center rounded-xl', 'h-10 w-10'],
  {
    variants: {
      color: {
        primary:
          'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400',
        green:
          'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
        purple:
          'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/50 dark:text-secondary-400',
        orange:
          'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
        blue: 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
        amber:
          'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
        neutral:
          'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
      },
    },
    defaultVariants: {
      color: 'primary',
    },
  }
);

const quickActionVariants = cva(
  [
    'flex items-center gap-3 rounded-xl border p-4 text-left',
    'transition-colors duration-200',
    'border-neutral-200 bg-white',
    'hover:border-primary-300 hover:bg-primary-50',
    'dark:border-neutral-700 dark:bg-neutral-800',
    'dark:hover:border-primary-700 dark:hover:bg-primary-900/20',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'dark:focus-visible:ring-offset-neutral-900',
  ],
  {
    variants: {
      disabled: {
        true: [
          'opacity-50 cursor-not-allowed',
          'hover:border-neutral-200 hover:bg-white',
          'dark:hover:border-neutral-700 dark:hover:bg-neutral-800',
        ],
        false: 'cursor-pointer',
      },
    },
    defaultVariants: {
      disabled: false,
    },
  }
);

export type QuickActionColor =
  | 'primary'
  | 'green'
  | 'purple'
  | 'orange'
  | 'blue'
  | 'red'
  | 'amber'
  | 'neutral';

export interface QuickActionProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'color' | 'disabled'
> {
  /** The main title text */
  title: string;
  /** The subtitle/description text */
  subtitle: string;
  /** Icon to display in the colored background */
  icon: React.ReactNode;
  /** Color theme for the icon background */
  color?: QuickActionColor;
  /** Render as a different element (e.g., 'a' for links) */
  as?: 'button' | 'a';
  /** URL when rendered as a link */
  href?: string;
  /** Whether the action is disabled */
  disabled?: boolean;
}

/**
 * A quick action card component for dashboard navigation.
 * Displays an icon, title, and subtitle in a compact, clickable card.
 *
 * @example
 * ```tsx
 * <QuickAction
 *   title="Schedule Exam"
 *   subtitle="Find providers nearby"
 *   color="primary"
 *   icon={<CalendarIcon className="h-5 w-5" />}
 *   onClick={() => navigate('/schedule')}
 * />
 * ```
 */
const QuickAction = React.forwardRef<HTMLButtonElement, QuickActionProps>(
  (
    {
      className,
      title,
      subtitle,
      icon,
      color = 'primary',
      disabled,
      as = 'button',
      href,
      ...props
    },
    ref
  ) => {
    const content = (
      <>
        <div className={cn(quickActionIconVariants({ color }))}>{icon}</div>
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">
            {title}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </div>
        </div>
      </>
    );

    if (as === 'a' && href) {
      return (
        <a
          href={href}
          className={cn(quickActionVariants({ disabled }), className)}
          aria-disabled={disabled}
          {...(props as React.AnchorHTMLAttributes<globalThis.HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled ?? undefined}
        className={cn(quickActionVariants({ disabled }), className)}
        {...props}
      >
        {content}
      </button>
    );
  }
);

QuickAction.displayName = 'QuickAction';

// Predefined icons for common quick actions
export const QuickActionIcons = {
  Calendar: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  Clipboard: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  User: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Document: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  Settings: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Help: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Search: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  Bell: (props: React.SVGProps<globalThis.SVGSVGElement>) => (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
};

/**
 * A group/container component for displaying multiple QuickAction cards in a grid.
 *
 * @example
 * ```tsx
 * <QuickActionGroup title="Quick Actions">
 *   <QuickAction title="Action 1" ... />
 *   <QuickAction title="Action 2" ... />
 * </QuickActionGroup>
 * ```
 */
export interface QuickActionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional title to display above the quick actions */
  title?: string;
  /** Number of columns on different screen sizes */
  columns?: {
    base?: 1 | 2;
    sm?: 1 | 2;
    md?: 2 | 3 | 4;
    lg?: 2 | 3 | 4;
  };
}

const QuickActionGroup = React.forwardRef<
  HTMLDivElement,
  QuickActionGroupProps
>(
  (
    {
      className,
      title,
      columns = { base: 1, sm: 2, md: 2, lg: 4 },
      children,
      ...props
    },
    ref
  ) => {
    const gridCols = cn(
      'grid gap-4',
      // Base (mobile)
      columns.base === 1 ? 'grid-cols-1' : 'grid-cols-2',
      // Small screens
      columns.sm === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2',
      // Medium screens
      columns.md === 2
        ? 'md:grid-cols-2'
        : columns.md === 3
          ? 'md:grid-cols-3'
          : columns.md === 4
            ? 'md:grid-cols-4'
            : '',
      // Large screens
      columns.lg === 2
        ? 'lg:grid-cols-2'
        : columns.lg === 3
          ? 'lg:grid-cols-3'
          : 'lg:grid-cols-4'
    );

    return (
      <div ref={ref} className={className} {...props}>
        {title && (
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
            {title}
          </h2>
        )}
        <div className={gridCols}>{children}</div>
      </div>
    );
  }
);

QuickActionGroup.displayName = 'QuickActionGroup';

export {
  QuickAction,
  QuickActionGroup,
  quickActionVariants,
  quickActionIconVariants,
};
