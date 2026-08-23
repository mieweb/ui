'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ClampedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The long text to clamp. */
  text: string;
  /** Lines visible while collapsed (2–8, default 6). */
  lines?: 2 | 3 | 4 | 5 | 6 | 8;
  /** Skip the clamp entirely below this character count (default 280). */
  threshold?: number;
  /** Toggle labels, overridable for i18n. */
  showMoreLabel?: string;
  showLessLabel?: string;
  /**
   * Gradient start for the fade at the clamp edge — match it to the
   * surface behind the text (default `from-card`).
   */
  fadeClassName?: string;
}

// Static map so Tailwind sees every clamp utility it must generate
const LINE_CLAMP: Record<number, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
  8: 'line-clamp-8',
};

/**
 * Clamps long text to N lines with a fade-out gradient and a
 * Show more / Show less toggle. Short text renders inline with no
 * toggle, so brief values stay flat. Pure presentation — ideal for
 * free-text fields (messages, notes, descriptions) inside detail
 * panels and modals.
 *
 * @example
 * ```tsx
 * <ClampedText text={note.body} lines={4} />
 * ```
 */
export const ClampedText = React.forwardRef<HTMLDivElement, ClampedTextProps>(
  function ClampedText(
    {
      text,
      lines = 6,
      threshold = 280,
      showMoreLabel = 'Show more',
      showLessLabel = 'Show less',
      fadeClassName = 'from-card',
      className,
      ...props
    },
    ref
  ) {
    const [open, setOpen] = React.useState(false);

    if (text.length <= threshold) {
      return (
        <span className={cn('break-words whitespace-pre-wrap', className)}>
          {text}
        </span>
      );
    }

    return (
      <div ref={ref} className={className} {...props}>
        <div
          className={cn(
            'relative break-words whitespace-pre-wrap',
            !open && (LINE_CLAMP[lines] ?? 'line-clamp-6')
          )}
        >
          {text}
          {!open && (
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t to-transparent',
                fadeClassName
              )}
            />
          )}
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="text-primary-600 dark:text-primary-400 mt-1 text-[11px] font-medium hover:underline"
        >
          {open ? showLessLabel : showMoreLabel}
        </button>
      </div>
    );
  }
);
