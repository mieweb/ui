import * as React from 'react';
import { cn } from '../../utils/cn';
import { Progress } from '../Progress';

export interface CompletenessField {
  /** Stable key, passed back to `onFieldClick`. */
  key: string;
  /** Display name of the field. */
  label: string;
  /** Whether the field has a value. */
  complete: boolean;
  /** Relative importance; defaults to 1. */
  weight?: number;
}

export interface CompletenessMeterLabels {
  /** Heading of the full variant. */
  title: string;
  /** Accessible name of the progress bar. */
  progress: string;
  /** Visible percentage and `aria-valuetext`. */
  percent: (percent: number) => string;
  /** Heading of the missing-fields list. */
  missing: (count: number) => string;
  /** Shown when nothing is missing. */
  allComplete: string;
}

export const defaultCompletenessMeterLabels: CompletenessMeterLabels = {
  title: 'Data completeness',
  progress: 'Data completeness',
  percent: (percent) => `${percent}%`,
  missing: (count) => `Missing (${count})`,
  allComplete: 'All fields complete',
};

/** Weighted completion percentage (0–100) and the incomplete fields. */
export function getCompleteness(fields: CompletenessField[]) {
  let total = 0;
  let done = 0;
  for (const f of fields) {
    const w =
      f.weight === undefined
        ? 1
        : Number.isFinite(f.weight)
          ? Math.max(0, f.weight)
          : 0;
    total += w;
    if (f.complete) done += w;
  }
  return {
    percent: total > 0 ? Math.round((done / total) * 100) : 100,
    missing: fields.filter((f) => !f.complete),
  };
}

function tone(percent: number) {
  if (percent >= 80) return 'bg-success-500';
  if (percent >= 50) return 'bg-warning-500';
  return 'bg-destructive-500';
}

export interface CompletenessMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fields that make up the record. */
  fields: CompletenessField[];
  /** `compact` shows the bar and percentage only. */
  variant?: 'default' | 'compact';
  /** Makes each missing field a button, e.g. to focus its input. */
  onFieldClick?: (key: string) => void;
  /** Overrides for any user-facing string. */
  labels?: Partial<CompletenessMeterLabels>;
}

/**
 * How complete a record is: a weighted percentage, a progress bar and the
 * list of missing fields.
 *
 * @example
 * ```tsx
 * <CompletenessMeter fields={fields} onFieldClick={(key) => focusField(key)} />
 * ```
 */
export const CompletenessMeter = React.forwardRef<
  HTMLDivElement,
  CompletenessMeterProps
>(function CompletenessMeter(
  {
    fields,
    variant = 'default',
    onFieldClick,
    labels: labelOverrides,
    className,
    ...props
  },
  ref
) {
  const labels = { ...defaultCompletenessMeterLabels, ...labelOverrides };
  const { percent, missing } = getCompleteness(fields);
  const titleId = React.useId();
  const compact = variant === 'compact';

  const bar = (
    <div className="flex items-center gap-2">
      <Progress
        value={percent}
        srLabel={labels.progress}
        valueText={labels.percent(percent)}
        fillClassName={tone(percent)}
        className={compact ? 'w-24' : 'flex-1'}
      />
      <span className="text-muted-foreground text-xs font-medium tabular-nums">
        {labels.percent(percent)}
      </span>
    </div>
  );

  if (compact) {
    return (
      <div
        ref={ref}
        data-slot="completeness-meter"
        className={cn('inline-flex', className)}
        {...props}
      >
        {bar}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={titleId}
      data-slot="completeness-meter"
      className={cn('flex flex-col gap-2 text-sm', className)}
      {...props}
    >
      <h3 id={titleId} className="text-foreground text-sm font-semibold">
        {labels.title}
      </h3>
      {bar}
      {missing.length === 0 ? (
        <p className="text-success-700 dark:text-success-400 text-xs">
          {labels.allComplete}
        </p>
      ) : (
        <div>
          <p className="text-muted-foreground mb-1 text-xs">
            {labels.missing(missing.length)}
          </p>
          <ul
            className="flex flex-col gap-1"
            data-slot="completeness-meter-missing"
          >
            {missing.map((f) => (
              <li key={f.key} className="flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className="bg-destructive-500 h-1.5 w-1.5 shrink-0 rounded-full"
                />
                {onFieldClick ? (
                  <button
                    type="button"
                    onClick={() => onFieldClick(f.key)}
                    className="text-foreground decoration-primary-500 focus-visible:ring-ring rounded-sm text-start underline underline-offset-2 hover:decoration-2 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {f.label}
                  </button>
                ) : (
                  <span className="text-foreground">{f.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
