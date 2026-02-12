import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// ServiceBadge Component
// =============================================================================

const serviceBadgeVariants = cva(
  'inline-flex items-center font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
        secondary:
          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        success:
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        outline:
          'border border-gray-300 text-gray-700 bg-transparent dark:border-gray-600 dark:text-gray-300',
        ghost:
          'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      },
      size: {
        xs: 'text-xs px-1.5 py-0.5 rounded',
        sm: 'text-xs px-2 py-1 rounded-md',
        md: 'text-sm px-2.5 py-1.5 rounded-md',
        lg: 'text-sm px-3 py-2 rounded-lg',
        xl: 'text-base px-4 py-2.5 rounded-lg',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        interactive: true,
        className:
          'hover:bg-primary-200 dark:hover:bg-primary-900/50 focus:ring-primary-500',
      },
      {
        variant: 'secondary',
        interactive: true,
        className:
          'hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-500',
      },
      {
        variant: 'success',
        interactive: true,
        className:
          'hover:bg-green-200 dark:hover:bg-green-900/50 focus:ring-green-500',
      },
      {
        variant: 'warning',
        interactive: true,
        className:
          'hover:bg-yellow-200 dark:hover:bg-yellow-900/50 focus:ring-yellow-500',
      },
      {
        variant: 'danger',
        interactive: true,
        className:
          'hover:bg-red-200 dark:hover:bg-red-900/50 focus:ring-red-500',
      },
      {
        variant: 'info',
        interactive: true,
        className:
          'hover:bg-blue-200 dark:hover:bg-blue-900/50 focus:ring-blue-500',
      },
      {
        variant: 'outline',
        interactive: true,
        className:
          'hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

export interface ServiceBadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'onClick'>,
    VariantProps<typeof serviceBadgeVariants> {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  onRemove?: () => void;
  removable?: boolean;
}

export function ServiceBadge({
  children,
  variant,
  size,
  interactive,
  href,
  onClick,
  icon,
  onRemove,
  removable = false,
  className,
  ...props
}: ServiceBadgeProps) {
  const isClickable = Boolean(href || onClick);
  const isInteractive = interactive ?? isClickable;

  const content = (
    <>
      {icon && <span className="mr-1 flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 flex-shrink-0 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove ${children}`}
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      )}
    </>
  );

  const classes = cn(
    serviceBadgeVariants({
      variant: variant ?? 'default',
      size: size ?? 'md',
      interactive: isInteractive,
    }),
    className
  );

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} {...props}>
      {content}
    </span>
  );
}

// =============================================================================
// ServiceBadgeGroup Component
// =============================================================================

export interface ServiceBadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onShowMore?: () => void;
}

export function ServiceBadgeGroup({
  children,
  className,
  maxVisible,
  size = 'md',
  onShowMore,
}: ServiceBadgeGroupProps) {
  const badges = React.Children.toArray(children);
  const visibleBadges = maxVisible ? badges.slice(0, maxVisible) : badges;
  const hiddenCount = maxVisible ? badges.length - maxVisible : 0;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleBadges}
      {hiddenCount > 0 && (
        <ServiceBadge
          variant="secondary"
          size={size}
          interactive={Boolean(onShowMore)}
          onClick={onShowMore}
        >
          +{hiddenCount} more
        </ServiceBadge>
      )}
    </div>
  );
}

// =============================================================================
// ServiceCategoryBadge (with category icon)
// =============================================================================

export interface ServiceCategoryBadgeProps extends Omit<
  ServiceBadgeProps,
  'icon'
> {
  category?:
    | 'drug-testing'
    | 'medical'
    | 'occupational'
    | 'wellness'
    | 'lab'
    | 'other';
}

export function ServiceCategoryBadge({
  category = 'other',
  children,
  ...props
}: ServiceCategoryBadgeProps) {
  const icons: Record<string, React.ReactNode> = {
    'drug-testing': <TestTubeIcon className="h-3.5 w-3.5" />,
    medical: <MedicalIcon className="h-3.5 w-3.5" />,
    occupational: <BriefcaseIcon className="h-3.5 w-3.5" />,
    wellness: <HeartIcon className="h-3.5 w-3.5" />,
    lab: <LabIcon className="h-3.5 w-3.5" />,
    other: <TagIcon className="h-3.5 w-3.5" />,
  };

  return (
    <ServiceBadge icon={icons[category]} {...props}>
      {children}
    </ServiceBadge>
  );
}

// =============================================================================
// ServiceTagCloud (stylized cloud layout)
// =============================================================================

export interface ServiceTagCloudProps {
  services: Array<{
    id: string;
    name: string;
    slug: string;
    count?: number;
  }>;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onServiceClick?: (slug: string) => void;
  maxVisible?: number;
  showCounts?: boolean;
  className?: string;
}

export function ServiceTagCloudBadges({
  services,
  variant = 'default',
  size = 'md',
  onServiceClick,
  maxVisible,
  showCounts = false,
  className,
}: ServiceTagCloudProps) {
  const visibleServices = maxVisible ? services.slice(0, maxVisible) : services;
  const hiddenCount = maxVisible ? services.length - maxVisible : 0;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleServices.map((service) => (
        <ServiceBadge
          key={service.id}
          variant={variant}
          size={size}
          onClick={
            onServiceClick ? () => onServiceClick(service.slug) : undefined
          }
          href={onServiceClick ? undefined : `/service/${service.slug}`}
        >
          {service.name}
          {showCounts && service.count !== undefined && (
            <span className="ml-1 opacity-70">({service.count})</span>
          )}
        </ServiceBadge>
      ))}
      {hiddenCount > 0 && (
        <ServiceBadge variant="secondary" size={size}>
          +{hiddenCount} more
        </ServiceBadge>
      )}
    </div>
  );
}

// =============================================================================
// SelectedServicesBadges (with removal)
// =============================================================================

export interface SelectedServicesBadgesProps {
  services: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  onRemove: (slug: string) => void;
  onClearAll?: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function SelectedServicesBadges({
  services,
  onRemove,
  onClearAll,
  variant = 'default',
  size = 'sm',
  className,
}: SelectedServicesBadgesProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {services.map((service) => (
        <ServiceBadge
          key={service.id}
          variant={variant}
          size={size}
          removable
          onRemove={() => onRemove(service.slug)}
        >
          {service.name}
        </ServiceBadge>
      ))}
      {onClearAll && services.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-1 text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// =============================================================================
// DOT-specific Badge Variants
// =============================================================================

export interface DOTBadgeProps extends Omit<
  ServiceBadgeProps,
  'variant' | 'children'
> {
  type:
    | 'dot-certified'
    | 'non-dot'
    | 'fmcsa'
    | 'faa'
    | 'uscg'
    | 'phmsa'
    | 'fra';
  children?: React.ReactNode;
}

const dotVariants: Record<string, { label: string; className: string }> = {
  'dot-certified': {
    label: 'DOT Certified',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  'non-dot': {
    label: 'Non-DOT',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  fmcsa: {
    label: 'FMCSA',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  faa: {
    label: 'FAA',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  uscg: {
    label: 'USCG',
    className:
      'bg-navy-100 text-navy-700 dark:bg-navy-900/30 dark:text-navy-400 bg-blue-900 text-white dark:bg-blue-800',
  },
  phmsa: {
    label: 'PHMSA',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  fra: {
    label: 'FRA',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function DOTBadge({
  type,
  children,
  className,
  size,
  ...props
}: DOTBadgeProps) {
  const config = dotVariants[type] || dotVariants['non-dot'];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium',
        config.className,
        size === 'xs' && 'px-1.5 py-0.5 text-xs',
        size === 'sm' && 'px-2 py-1 text-xs',
        (size === 'md' || !size) && 'px-2.5 py-1.5 text-sm',
        size === 'lg' && 'px-3 py-2 text-sm',
        size === 'xl' && 'px-4 py-2.5 text-base',
        className
      )}
      {...props}
    >
      <DOTIcon className="mr-1 h-3.5 w-3.5" />
      {children || config.label}
    </span>
  );
}

// =============================================================================
// Icons
// =============================================================================

function CloseIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function TestTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M7 2v2h1v14a4 4 0 0 0 8 0V4h1V2H7zm6 2v6h-2V4h2zm-2 8h2v6a2 2 0 1 1-4 0v-2.5l2-1.5V12z" />
    </svg>
  );
}

function MedicalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function LabIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
    </svg>
  );
}

function DOTIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
  );
}

export default ServiceBadge;
