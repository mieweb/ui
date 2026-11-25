'use client';

/**
 * Docked toolbar of capture actions, grouped `Record: … Capture: …`.
 * Extracted from the ChatComposer Action Ribbon POC (mieweb/ui#733); markup
 * and classes are unchanged so the POC renders pixel-identically. Strings go
 * through `useMessages`, so hosts translate via `MessagesProvider`.
 */
import * as React from 'react';
import { PinOff } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';
import type { CaptureAction, CaptureGroup } from './captureCore';

const groupOrder: CaptureGroup[] = ['record', 'capture'];
const groupLabels: Record<CaptureGroup, string> = {
  record: 'Record:',
  capture: 'Capture:',
};

export interface CaptureRibbonProps extends React.HTMLAttributes<HTMLDivElement> {
  captures: CaptureAction[];
  /** Renders an undock pin at the ribbon's end. Omit for a fixed ribbon. */
  onUndock?: () => void;
}

export function CaptureRibbon({
  captures,
  onUndock,
  className,
  ...rest
}: CaptureRibbonProps) {
  const m = useMessages();
  return (
    <div
      role="toolbar"
      aria-label={m('Record and capture')}
      data-slot="capture-ribbon"
      {...rest}
      className={cn(
        'mx-4 -mb-px flex items-center gap-1 overflow-x-auto rounded-t-xl border border-b-0 px-1.5 py-1',
        'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800',
        className
      )}
    >
      {groupOrder.map((group, index) => {
        const items = captures.filter((c) => (c.group ?? 'capture') === group);
        if (!items.length) return null;
        return (
          <div
            key={group}
            role="group"
            aria-label={m(groupLabels[group].replace(':', ''))}
            className={cn(
              'flex shrink-0 items-center gap-0.5',
              index > 0 &&
                'ms-1 border-s border-neutral-200 ps-2 dark:border-neutral-700'
            )}
          >
            <span
              aria-hidden="true"
              // dir="auto" keeps the colon after the label text in RTL pages.
              dir="auto"
              className="pe-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400"
            >
              {m(groupLabels[group])}
            </span>
            {items.map((c) => (
              <Tooltip key={c.id} content={c.label} placement="top">
                <button
                  type="button"
                  onClick={c.run}
                  aria-label={c.label}
                  aria-pressed={c.active}
                  className={cn(
                    'flex h-7 min-w-7 shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-xs font-medium tabular-nums',
                    'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
                    c.active
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  )}
                >
                  {c.icon}
                  {c.badge && <span aria-hidden="true">{c.badge}</span>}
                </button>
              </Tooltip>
            ))}
          </div>
        );
      })}
      {onUndock && (
        <button
          type="button"
          onClick={onUndock}
          aria-label={m('Undock capture ribbon')}
          title={m('Undock capture ribbon')}
          className="focus-visible:ring-primary-500 ms-auto shrink-0 rounded-lg p-1 text-neutral-500 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-neutral-700"
        >
          <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
