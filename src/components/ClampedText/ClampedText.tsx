'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ClampedTextProps extends React.HTMLAttributes<HTMLElement> {
  /** The long text to clamp. */
  text: string;
  /** Lines visible while collapsed (2–8, default 6). */
  lines?: 2 | 3 | 4 | 5 | 6 | 7 | 8;
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

// Static map so Tailwind sees every clamp utility it must generate.
// 7/8 are beyond Tailwind 3's core 1–6 scale — the preset extends
// theme.lineClamp so TW3 consumers generate them too (TW4 accepts any
// integer as a bare value).
const LINE_CLAMP: Record<number, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
  7: 'line-clamp-7',
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
export const ClampedText = React.forwardRef<HTMLElement, ClampedTextProps>(
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
        <span
          ref={ref as React.ForwardedRef<HTMLSpanElement>}
          className={cn('break-words whitespace-pre-wrap', className)}
          {...props}
        >
          {text}
        </span>
      );
    }

    return (
      <div
        ref={ref as React.ForwardedRef<HTMLDivElement>}
        className={className}
        {...props}
      >
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
          className="text-primary-800 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-1 text-[11px] font-medium hover:underline"
        >
          {open ? showLessLabel : showMoreLabel}
        </button>
      </div>
    );
  }
);
