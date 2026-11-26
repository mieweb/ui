'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';
import { HelpCircleIcon } from '../Icons';
import { Tooltip } from '../Tooltip';

export interface PharmacyHelpProps {
  /** What the help explains, for the button's accessible name. */
  topic: string;
  /** Help text. */
  children: string;
  className?: string;
}

/** Focusable help button that shows its text on hover, focus or tap. */
export function PharmacyHelp({
  topic,
  children,
  className,
}: PharmacyHelpProps) {
  const m = useMessages();
  return (
    <Tooltip content={children} maxWidth={320}>
      <button
        type="button"
        data-slot="pharmacy-help"
        aria-label={m('Help: {topic}', { topic })}
        className={cn(
          'text-muted-foreground hover:text-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          className
        )}
      >
        <HelpCircleIcon size={14} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
