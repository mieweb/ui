'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CopyButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> {
  /** Text written to the clipboard. */
  value: string;
  /** Accessible label / tooltip (default "Copy"). */
  label?: string;
  /** Label while the copied state shows (default "Copied"). */
  copiedLabel?: string;
  /** How long the copied state shows, in ms (default 1200). */
  timeout?: number;
  /** Called after a successful copy. */
  onCopied?: (value: string) => void;
}

/**
 * An inline copy-to-clipboard icon button with a brief success check.
 * Stateless across instances — safe to drop into table rows, ID chips,
 * and detail fields.
 *
 * @example
 * ```tsx
 * <span className="flex items-center gap-1">
 *   MRN WC-10382 <CopyButton value="WC-10382" label="Copy MRN" />
 * </span>
 * ```
 */
export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  function CopyButton(
    {
      value,
      label = 'Copy',
      copiedLabel = 'Copied',
      timeout = 1200,
      onCopied,
      className,
      onClick,
      ...props
    },
    ref
  ) {
    const [copied, setCopied] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(
      () => () => {
        if (timer.current) clearTimeout(timer.current);
      },
      []
    );

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      // Inside clickable rows/links the copy must not trigger the row action
      e.stopPropagation();
      e.preventDefault();
      onClick?.(e);
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        onCopied?.(value);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), timeout);
      } catch {
        /* clipboard access denied — silent */
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        title={copied ? copiedLabel : label}
        aria-label={copied ? copiedLabel : label}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded p-1 transition-colors',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          copied
            ? 'text-success'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          className
        )}
        {...props}
      >
        {copied ? (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }
);
