import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  [
    'rounded-xl bg-card text-card-foreground',
    'border border-border',
    'relative overflow-hidden',
  ],
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      variant: {
        default: 'shadow-card',
        elevated: 'shadow-lg border-0',
        outlined: 'shadow-none border-2',
        ghost: 'shadow-none border-0 bg-transparent',
        filled: 'shadow-none border-0 bg-muted',
      },
      interactive: {
        true: [
          'transition-all duration-200',
          'hover:shadow-md hover:border-primary-200',
          'dark:hover:border-primary-800',
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        ],
        false: '',
      },
      selected: {
        true: 'ring-2 ring-primary-500 border-primary-500',
        false: '',
      },
      orientation: {
        vertical: 'flex flex-col',
        horizontal: 'flex flex-row',
      },
    },
    defaultVariants: {
      padding: 'md',
      variant: 'default',
      interactive: false,
      selected: false,
      orientation: 'vertical',
    },
  }
);

const cardAccentVariants = cva('absolute left-0 top-0 bottom-0 w-1', {
  variants: {
    color: {
      primary: 'bg-primary-500',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
      info: 'bg-primary-200',
    },
  },
});

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Semantic HTML element to render as */
  as?: 'div' | 'article' | 'section' | 'aside';
  /** Accent color bar on the left side */
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  /** Loading state - shows skeleton overlay */
  loading?: boolean;
}

/**
 * A card container component for grouping related content.
 *
 * @example
 * ```tsx
 * <Card padding="lg" variant="elevated">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Card content goes here</CardContent>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      padding,
      variant,
      interactive,
      selected,
      orientation,
      accent,
      loading,
      as: Component = 'div',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({
            padding,
            variant,
            interactive,
            selected,
            orientation,
          }),
          accent && 'pl-4',
          className
        )}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {accent && (
          <div
            className={cn(cardAccentVariants({ color: accent }))}
            aria-hidden="true"
          />
        )}
        {loading && (
          <div className="bg-card/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="flex gap-1">
              <div className="bg-primary-500 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
              <div className="bg-primary-500 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
              <div className="bg-primary-500 h-2 w-2 animate-bounce rounded-full" />
            </div>
          </div>
        )}
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * Header section of a Card
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 pb-4', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

/**
 * Title for a Card
 */
const CardTitle = React.forwardRef<
  globalThis.HTMLHeadingElement,
  React.HTMLAttributes<globalThis.HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg leading-none font-semibold tracking-tight',
      className
    )}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

/**
 * Description text for a Card
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

/**
 * Main content area of a Card
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));

CardContent.displayName = 'CardContent';

/**
 * Footer section of a Card
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

/**
 * Image/Media section for a Card - typically used at the top
 */
export interface CardMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Aspect ratio of the media */
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  /** Optional overlay content */
  overlay?: React.ReactNode;
}

const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, aspectRatio = 'video', overlay, src, alt, ...props }, ref) => {
    const aspectClasses = {
      video: 'aspect-video',
      square: 'aspect-square',
      wide: 'aspect-[21/9]',
      auto: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative -mx-4 -mt-4 overflow-hidden first:rounded-t-xl',
          className
        )}
      >
        <img
          src={src}
          alt={alt}
          className={cn('w-full object-cover', aspectClasses[aspectRatio])}
          {...props}
        />
        {overlay && (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-neutral-900/60 to-transparent p-4">
            {overlay}
          </div>
        )}
      </div>
    );
  }
);

CardMedia.displayName = 'CardMedia';

/**
 * Badge/Label component for Cards
 */
export interface CardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge color variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  /** Position of the badge */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const CardBadge = React.forwardRef<HTMLSpanElement, CardBadgeProps>(
  (
    {
      className,
      variant = 'default',
      position = 'top-right',
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary-500 text-white',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
    };

    const positionClasses = {
      'top-left': 'top-2 left-2',
      'top-right': 'top-2 right-2',
      'bottom-left': 'bottom-2 left-2',
      'bottom-right': 'bottom-2 right-2',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'absolute z-10 rounded-md px-2 py-1 text-xs font-medium',
          variantClasses[variant],
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

CardBadge.displayName = 'CardBadge';

/**
 * Actions area for Card buttons/links
 */
export interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment of actions */
  align?: 'left' | 'center' | 'right' | 'between' | 'around';
}

const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  ({ className, align = 'right', children, ...props }, ref) => {
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 pt-4',
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardActions.displayName = 'CardActions';

/**
 * Divider line within a Card
 */
const CardDivider = React.forwardRef<
  globalThis.HTMLHRElement,
  React.HTMLAttributes<globalThis.HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn('border-border -mx-4 my-4', className)}
    {...props}
  />
));

CardDivider.displayName = 'CardDivider';

/**
 * Collapsible content section for Cards
 */
export interface CardCollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the content is expanded */
  expanded?: boolean;
  /** Callback when expand state changes */
  onExpandChange?: (expanded: boolean) => void;
  /** Trigger element/text for expanding */
  trigger?: React.ReactNode;
}

const CardCollapsible = React.forwardRef<HTMLDivElement, CardCollapsibleProps>(
  (
    {
      className,
      expanded: controlledExpanded,
      onExpandChange,
      trigger = 'Show more',
      children,
      ...props
    },
    ref
  ) => {
    const [internalExpanded, setInternalExpanded] = React.useState(false);
    const isControlled = controlledExpanded !== undefined;
    const expanded = isControlled ? controlledExpanded : internalExpanded;

    const handleToggle = () => {
      if (isControlled) {
        onExpandChange?.(!expanded);
      } else {
        setInternalExpanded(!expanded);
      }
    };

    return (
      <div ref={ref} className={cn('', className)} {...props}>
        <button
          type="button"
          onClick={handleToggle}
          className="text-primary-600 focus-visible:ring-primary-500 flex items-center gap-1 rounded text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-expanded={expanded}
        >
          {typeof trigger === 'string' ? (
            <>
              {expanded ? 'Show less' : trigger}
              <svg
                className={cn(
                  'h-4 w-4 transition-transform',
                  expanded && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          ) : (
            trigger
          )}
        </button>
        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            expanded
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">{children}</div>
        </div>
      </div>
    );
  }
);

CardCollapsible.displayName = 'CardCollapsible';

/**
 * Stat/Metric display for Cards
 */
export interface CardStatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The main value/number */
  value: React.ReactNode;
  /** Label describing the stat */
  label: string;
  /** Trend indicator */
  trend?: { value: number; label?: string };
  /** Icon to display */
  icon?: React.ReactNode;
}

const CardStat = React.forwardRef<HTMLDivElement, CardStatProps>(
  ({ className, value, label, trend, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start gap-3', className)}
        {...props}
      >
        {icon && (
          <div className="bg-primary-500/10 text-primary-600 rounded-lg p-2">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="text-muted-foreground text-sm">{label}</div>
          {trend && (
            <div
              className={cn(
                'mt-1 flex items-center gap-1 text-sm',
                trend.value >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              <svg
                className={cn('h-4 w-4', trend.value < 0 && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && (
                <span className="text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

CardStat.displayName = 'CardStat';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMedia,
  CardBadge,
  CardActions,
  CardDivider,
  CardCollapsible,
  CardStat,
  cardVariants,
  cardAccentVariants,
};
