import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '../Badge';
import { cn } from '../../utils/cn';

export interface ReferenceChipProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'children'
> {
  /** The chip's text, e.g. `@Ann Lee` or `TH-12: Fix login`. */
  label: string;
  /** Where the record lives. Without it the chip is plain text, not a link. */
  href?: string;
  /** The reference's kind (`person`, `ticket`, …), set as `data-reference-kind` for styling and tests. */
  kind?: string;
  /** Leading node: an avatar or an icon. Mark decorative icons `aria-hidden`. */
  icon?: React.ReactNode;
  /** Colour, as `Badge`. @default 'secondary' */
  variant?: VariantProps<typeof badgeVariants>['variant'];
  /** Density, as `Badge`. @default 'sm' */
  size?: VariantProps<typeof badgeVariants>['size'];
}

/**
 * A reference to a record — a teammate, a ticket — shown inline in text as a
 * compact chip. A link when `href` is given (route it with `onClick` in a
 * single-page app), plain text otherwise.
 */
const ReferenceChip = React.forwardRef<HTMLAnchorElement, ReferenceChipProps>(
  (
    {
      label,
      href,
      kind,
      icon,
      variant = 'secondary',
      size = 'sm',
      className,
      ...props
    },
    ref
  ) => (
    <a
      ref={ref}
      href={href}
      data-slot="reference-chip"
      data-reference-kind={kind}
      className={cn(
        badgeVariants({ variant, size }),
        'max-w-full align-baseline no-underline',
        href &&
          'focus-visible:ring-ring hover:underline focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
      {...props}
    >
      {icon && <span className="me-1 shrink-0">{icon}</span>}
      {/* Its own direction: "@Ann Lee" stays "@Ann Lee" in a right-to-left page. */}
      <span dir="auto" className="truncate">
        {label}
      </span>
    </a>
  )
);

ReferenceChip.displayName = 'ReferenceChip';

export { ReferenceChip };
