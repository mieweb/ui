'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Slider } from '../Slider';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

// =============================================================================
// Types
// =============================================================================

export type CalculatorFormat =
  | 'number'
  | 'currency'
  | 'compactCurrency'
  | 'percent'
  | 'hours'
  | ((value: number) => string);

export interface CalculatorInput {
  /** Key in the values object passed to `compute`. */
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  /** Starting value. */
  defaultValue: number;
  /** How the current value renders next to the label. Default `number`. */
  format?: CalculatorFormat;
  description?: string;
}

export interface CalculatorBreakdown {
  label: string;
  value: number;
}

export interface CalculatorMathRow {
  label: string;
  value: string;
}

export interface CalculatorResult {
  /** The headline number. */
  total: number;
  /** One-line context under the headline, e.g. "42% of today's spend · 1,200 hours returned". */
  summary?: string;
  /** Horizontal bars showing what makes up `total`. */
  breakdown?: CalculatorBreakdown[];
  /** Rows revealed by "Show the math". */
  math?: CalculatorMathRow[];
  /** Free-text assumptions listed under the math. */
  assumptions?: string[];
}

export interface SliderCalculatorProps {
  inputs: CalculatorInput[];
  /** Pure function from current values to a result. Runs on every change. */
  compute: (values: Record<string, number>) => CalculatorResult;
  /** Copy for the controls column. */
  eyebrow?: string;
  heading?: string;
  description?: string;
  headingLevel?: 'h2' | 'h3';
  /** Label above the headline number. Default "Estimated annual value". */
  resultLabel?: string;
  /** Format for the headline. Default `compactCurrency`. */
  resultFormat?: CalculatorFormat;
  /** Format for breakdown values. Default `currency`. */
  breakdownFormat?: CalculatorFormat;
  /** Actions under the result (Buttons, links). */
  actions?: React.ReactNode;
  /** Small print under the actions. */
  footnote?: string;
  /** Labels for the math toggle. */
  mathLabels?: { show?: string; hide?: string };
  /** Currency for the built-in formatters. Default `USD`. */
  currency?: string;
  locale?: string;
  /** Fires with the latest values and result on every change. */
  onChange?: (values: Record<string, number>, result: CalculatorResult) => void;
  className?: string;
}

// =============================================================================
// Formatting
// =============================================================================

function makeFormatter(
  format: CalculatorFormat | undefined,
  locale: string,
  currency: string
): (v: number) => string {
  if (typeof format === 'function') return format;
  switch (format) {
    case 'currency':
      return (v) =>
        v.toLocaleString(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        });
    case 'compactCurrency':
      return (v) =>
        v.toLocaleString(locale, {
          style: 'currency',
          currency,
          notation: 'compact',
          maximumFractionDigits: v >= 1_000_000 ? 2 : 0,
        });
    case 'percent':
      return (v) => `${v.toLocaleString(locale)}%`;
    case 'hours':
      return (v) => `${v.toLocaleString(locale)} hr`;
    default:
      return (v) => v.toLocaleString(locale);
  }
}

// =============================================================================
// AnimatedNumber
// =============================================================================

export interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  /** Tween length in ms. Default 480. */
  duration?: number;
  className?: string;
}

/** Tweens between numeric values with an ease-out; snaps under reduced motion. */
export function AnimatedNumber({
  value,
  format = (v) => v.toLocaleString(),
  duration = 480,
  className,
}: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = React.useState(value);
  const shownRef = React.useRef(value);

  React.useEffect(() => {
    if (reduced || typeof window === 'undefined') {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const from = shownRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (value - from) * eased;
      shownRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return (
    <span className={cn('tabular-nums', className)} data-slot="animated-number">
      {format(shown)}
    </span>
  );
}

// =============================================================================
// SliderCalculator
// =============================================================================

/**
 * A two-column interactive calculator: labelled sliders on the left, a live
 * result panel on the right with an animated headline number, a one-line
 * summary, proportional breakdown bars, a "Show the math" disclosure and an
 * actions slot. Bring your own `compute` — the component owns only the
 * interaction. Ported from the Enterprise Health ROI calculator.
 *
 * @example
 * ```tsx
 * <SliderCalculator
 *   heading="What is consolidation worth?"
 *   inputs={[
 *     { id: 'people', label: 'People covered', min: 500, max: 60000, step: 500, defaultValue: 8000 },
 *     { id: 'cost', label: 'Cost per exam', min: 20, max: 400, step: 5, defaultValue: 120, format: 'currency' },
 *   ]}
 *   compute={({ people, cost }) => ({ total: people * cost * 0.18 })}
 *   actions={<Button effect="sheen">Request a demo</Button>}
 * />
 * ```
 */
export function SliderCalculator({
  inputs,
  compute,
  eyebrow,
  heading,
  description,
  headingLevel: Heading = 'h2',
  resultLabel = 'Estimated annual value',
  resultFormat = 'compactCurrency',
  breakdownFormat = 'currency',
  actions,
  footnote,
  mathLabels,
  currency = 'USD',
  locale = 'en-US',
  onChange,
  className,
}: SliderCalculatorProps) {
  const [values, setValues] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(inputs.map((i) => [i.id, i.defaultValue]))
  );
  const [showMath, setShowMath] = React.useState(false);
  const id = React.useId();

  const result = React.useMemo(() => compute(values), [compute, values]);

  const fmtResult = makeFormatter(resultFormat, locale, currency);
  const fmtBreakdown = makeFormatter(breakdownFormat, locale, currency);
  const labels = {
    show: 'Show the math',
    hide: 'Hide the math',
    ...mathLabels,
  };

  const set = (key: string, v: number) => {
    const next = { ...values, [key]: v };
    setValues(next);
    onChange?.(next, compute(next));
  };

  return (
    <div
      data-slot="slider-calculator"
      className={cn(
        'border-border bg-card text-card-foreground grid overflow-hidden rounded-2xl border shadow-md',
        'lg:grid-cols-[1.1fr_1fr]',
        className
      )}
    >
      {/* Controls */}
      <div className="p-6 sm:p-8">
        {eyebrow && (
          <p className="text-primary-700 dark:text-primary-300 mb-2 text-[11px] font-bold tracking-[0.14em] uppercase">
            {eyebrow}
          </p>
        )}
        {heading && (
          <Heading className="text-foreground text-2xl leading-tight font-semibold sm:text-3xl">
            {heading}
          </Heading>
        )}
        {description && (
          <p className="text-muted-foreground mt-3 text-sm">{description}</p>
        )}

        <div className={cn('space-y-5', (heading || description) && 'mt-7')}>
          {inputs.map((input) => (
            <Slider
              key={input.id}
              id={`${id}-${input.id}`}
              label={input.label}
              description={input.description}
              min={input.min}
              max={input.max}
              step={input.step}
              value={values[input.id]}
              onValueChange={(v) => set(input.id, v)}
              showValue
              formatValue={makeFormatter(input.format, locale, currency)}
            />
          ))}
        </div>
      </div>

      {/* Result */}
      <div
        data-slot="slider-calculator-result"
        aria-live="polite"
        className="bg-primary-950 flex flex-col gap-6 p-6 text-white [background:radial-gradient(120%_120%_at_100%_0%,var(--mieweb-primary-800),var(--mieweb-primary-950)_70%)] sm:p-8"
      >
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-white/70 uppercase">
            {resultLabel}
          </p>
          <p className="mt-2 text-5xl leading-none font-semibold tracking-tight sm:text-6xl">
            <AnimatedNumber value={result.total} format={fmtResult} />
          </p>
          {result.summary && (
            <p className="mt-3 text-sm text-white/80">{result.summary}</p>
          )}
        </div>

        {result.breakdown && result.breakdown.length > 0 && (
          <div className="space-y-3">
            {result.breakdown.map((b) => {
              const pct =
                result.total > 0
                  ? Math.max(2, Math.min(100, (b.value / result.total) * 100))
                  : 0;
              return (
                <div key={b.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-white/80">{b.label}</span>
                    <b className="tabular-nums">
                      <AnimatedNumber
                        value={Math.max(b.value, 0)}
                        format={fmtBreakdown}
                      />
                    </b>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                    <span
                      className="block h-full rounded-full transition-[width] duration-500 ease-out [background:linear-gradient(90deg,var(--mieweb-accent,var(--mieweb-primary-300)),var(--mieweb-primary-300))]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(result.math?.length || result.assumptions?.length) && (
          <div>
            <button
              type="button"
              onClick={() => setShowMath((v) => !v)}
              aria-expanded={showMath}
              aria-controls={`${id}-math`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              {showMath ? labels.hide : labels.show}
              {showMath ? (
                <ChevronUp size={14} aria-hidden />
              ) : (
                <ChevronDown size={14} aria-hidden />
              )}
            </button>
            {showMath && (
              <div
                id={`${id}-math`}
                className="mt-3 rounded-xl border border-white/15 bg-white/5 p-4 text-sm"
              >
                {result.math?.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-4 border-b border-white/10 py-1.5 last:border-0"
                  >
                    <span className="text-white/75">{row.label}</span>
                    <b className="tabular-nums">{row.value}</b>
                  </div>
                ))}
                {result.assumptions && result.assumptions.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 ps-5 text-xs text-white/70">
                    {result.assumptions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {actions && (
          <div className="mt-auto flex flex-wrap gap-3">{actions}</div>
        )}
        {footnote && <p className="text-xs text-white/60">{footnote}</p>}
      </div>
    </div>
  );
}
