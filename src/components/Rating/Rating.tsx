import * as React from 'react';
import { cva } from 'class-variance-authority';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface RatingLabels {
  /** Accessible text of the read-only display, e.g. `4.5 out of 5`. */
  value: (value: number, max: number) => string;
  /** Accessible name of the interactive radio group. */
  group: string;
  /** Accessible name of one option, e.g. `3 stars`. */
  option: (value: number, max: number) => string;
}

export const defaultRatingLabels: RatingLabels = {
  value: (value, max) => `${value} out of ${max}`,
  group: 'Rating',
  option: (value) => `${value} ${value === 1 ? 'star' : 'stars'}`,
};

const starVariants = cva('shrink-0', {
  variants: {
    size: { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' },
  },
  defaultVariants: { size: 'md' },
});

export interface RatingProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  /** Current rating; read-only displays round to the nearest half. */
  value: number;
  /** Number of stars. */
  max?: number;
  /** Star size. */
  size?: 'sm' | 'md' | 'lg';
  /** Makes the rating editable as a radio group of whole stars. */
  onChange?: (value: number) => void;
  /** Disables the interactive mode. */
  disabled?: boolean;
  /** Overrides for any user-facing string. */
  labels?: Partial<RatingLabels>;
}

function StarIcon({ fill, size }: { fill: number; size: RatingProps['size'] }) {
  return (
    <span className="relative inline-flex" aria-hidden="true">
      <Star
        className={cn(starVariants({ size }), 'text-muted-foreground/40')}
      />
      {fill > 0 && (
        <span
          className="absolute inset-y-0 start-0 overflow-hidden"
          style={{ width: `${fill * 100}%` }}
        >
          <Star
            className={cn(starVariants({ size }), 'text-warning-500')}
            fill="currentColor"
          />
        </span>
      )}
    </span>
  );
}

/**
 * Star rating: a read-only display with half-star precision, or — with
 * `onChange` — a keyboard-operable radio group.
 *
 * @example
 * ```tsx
 * <Rating value={4.5} />
 * <Rating value={stars} onChange={setStars} />
 * ```
 */
export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  function Rating(
    {
      value,
      max = 5,
      size = 'md',
      onChange,
      disabled = false,
      labels: labelOverrides,
      className,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultRatingLabels, ...labelOverrides };
    const radios = React.useRef<(HTMLButtonElement | null)[]>([]);
    const stars = Array.from({ length: max }, (_, i) => i + 1);

    if (!onChange) {
      const rounded = Math.round(value * 2) / 2;
      return (
        <div
          ref={ref}
          role="img"
          aria-label={labels.value(rounded, max)}
          data-slot="rating"
          className={cn('inline-flex items-center gap-0.5', className)}
          {...props}
        >
          {stars.map((n) => (
            <StarIcon
              key={n}
              size={size}
              fill={Math.min(1, Math.max(0, rounded - n + 1))}
            />
          ))}
        </div>
      );
    }

    const current = Math.round(value);
    const select = (next: number) => {
      const clamped = Math.min(max, Math.max(1, next));
      onChange(clamped);
      radios.current[clamped - 1]?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
      const step: Record<string, number> = {
        ArrowUp: 1,
        ArrowDown: -1,
        ArrowRight: rtl ? -1 : 1,
        ArrowLeft: rtl ? 1 : -1,
      };
      if (e.key === 'Home') select(1);
      else if (e.key === 'End') select(max);
      else if (step[e.key]) select((current || 0) + step[e.key]);
      else return;
      e.preventDefault();
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={labels.group}
        aria-disabled={disabled || undefined}
        data-slot="rating"
        className={cn('inline-flex items-center gap-0.5', className)}
        {...props}
      >
        {stars.map((n) => (
          <button
            key={n}
            ref={(el) => {
              radios.current[n - 1] = el;
            }}
            type="button"
            role="radio"
            aria-checked={n === current}
            aria-label={labels.option(n, max)}
            tabIndex={n === (current || 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => select(n)}
            onKeyDown={disabled ? undefined : onKeyDown}
            className={cn(
              'rounded-sm disabled:cursor-not-allowed disabled:opacity-50',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              'motion-safe:transition-transform motion-safe:enabled:hover:scale-110'
            )}
          >
            <StarIcon size={size} fill={n <= current ? 1 : 0} />
          </button>
        ))}
      </div>
    );
  }
);
