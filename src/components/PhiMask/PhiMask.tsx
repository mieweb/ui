import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PhiMaskLabels {
  /** Accessible text while fully masked. */
  masked: string;
  /** Accessible text while masked with `keepLast`. */
  maskedEnding: (visible: string) => string;
  /** Toggle name while masked. */
  reveal: string;
  /** Toggle name while revealed. */
  hide: string;
}

export const defaultPhiMaskLabels: PhiMaskLabels = {
  masked: 'Hidden sensitive value',
  maskedEnding: (visible) => `Hidden sensitive value ending in ${visible}`,
  reveal: 'Show value',
  hide: 'Hide value',
};

export interface PhiMaskProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  /** The sensitive text. */
  value: string;
  /** Characters left visible at the end while masked, e.g. 4 for an SSN. */
  keepLast?: number;
  /** Controlled revealed state. */
  revealed?: boolean;
  /** Initial revealed state when uncontrolled. */
  defaultRevealed?: boolean;
  /** Called whenever the revealed state changes (toggle or auto-hide). */
  onRevealedChange?: (revealed: boolean) => void;
  /** Called each time the user reveals the value — hook audit logging here. */
  onReveal?: () => void;
  /** Set false to hide the toggle; the value then stays masked. */
  canReveal?: boolean;
  /** Re-mask this many milliseconds after a reveal. */
  autoHideMs?: number;
  /** Overrides for any user-facing string. */
  labels?: Partial<PhiMaskLabels>;
}

const BULLETS = '••••••••';

/**
 * Masks a sensitive value (PHI/PII) behind bullets with an optional reveal
 * toggle. While masked, the value is absent from the DOM and accessible name.
 *
 * @example
 * ```tsx
 * <PhiMask value="123-45-6789" keepLast={4} autoHideMs={10000} onReveal={audit} />
 * ```
 */
export const PhiMask = React.forwardRef<HTMLSpanElement, PhiMaskProps>(
  function PhiMask(
    {
      value,
      keepLast = 0,
      revealed: revealedProp,
      defaultRevealed = false,
      onRevealedChange,
      onReveal,
      canReveal = true,
      autoHideMs,
      labels: labelOverrides,
      className,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultPhiMaskLabels, ...labelOverrides };
    const [internal, setInternal] = React.useState(defaultRevealed);
    const revealed = revealedProp ?? internal;

    const setRevealed = React.useCallback(
      (next: boolean) => {
        if (revealedProp === undefined) setInternal(next);
        onRevealedChange?.(next);
      },
      [revealedProp, onRevealedChange]
    );

    React.useEffect(() => {
      if (!revealed || !autoHideMs) return;
      const timer = window.setTimeout(() => setRevealed(false), autoHideMs);
      return () => window.clearTimeout(timer);
    }, [revealed, autoHideMs, setRevealed]);

    const visible = keepLast > 0 ? value.slice(-keepLast) : '';
    const shown = revealed && canReveal;

    return (
      <span
        ref={ref}
        data-slot="phi-mask"
        data-revealed={shown || undefined}
        className={cn(
          'inline-flex items-center gap-1 align-baseline',
          className
        )}
        {...props}
      >
        {shown ? (
          <span data-slot="phi-mask-value">{value}</span>
        ) : (
          <span data-slot="phi-mask-value" className="tabular-nums">
            <span aria-hidden="true" className="text-muted-foreground">
              {BULLETS}
              {visible && <span className="text-foreground">{visible}</span>}
            </span>
            <span className="sr-only">
              {visible ? labels.maskedEnding(visible) : labels.masked}
            </span>
          </span>
        )}
        {canReveal && (
          <button
            type="button"
            aria-pressed={shown}
            aria-label={shown ? labels.hide : labels.reveal}
            title={shown ? labels.hide : labels.reveal}
            data-slot="phi-mask-toggle"
            onClick={() => {
              setRevealed(!shown);
              if (!shown) onReveal?.();
            }}
            className={cn(
              'text-muted-foreground hover:text-foreground inline-flex rounded p-0.5',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
            )}
          >
            {shown ? (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </span>
    );
  }
);
