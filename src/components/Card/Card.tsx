import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  [
    'rounded-xl bg-card text-card-foreground',
    'border border-border',
    'shadow-card',
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
      interactive: {
        true: [
          'transition-all duration-200',
          'hover:shadow-md hover:border-primary-200',
          'dark:hover:border-primary-800',
          'cursor-pointer',
        ],
        false: '',
      },
    },
    defaultVariants: {
      padding: 'md',
      interactive: false,
    },
  }
);

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Semantic HTML element to render as */
  as?: 'div' | 'article' | 'section' | 'aside';
}

/**
 * A card container component for grouping related content.
 *
 * @example
 * ```tsx
 * <Card padding="lg">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Card content goes here</CardContent>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, padding, interactive, as: Component = 'div', ...props },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(cardVariants({ padding, interactive }), className)}
        {...props}
      />
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

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
