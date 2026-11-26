'use client';

/**
 * Start-side list of MedHistoryReconciliation: incoming records (and
 * repeat-fill groups) grouped into sections. A WAI-ARIA listbox with
 * roving focus — ↑/↓, Home/End move the selection; Enter/Space or click
 * "opens" an item (the detail sheet on narrow screens).
 */

import * as React from 'react';
import { useMessages } from '../../utils/messages';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';

export interface ReviewListItem {
  key: string;
  name: string;
  /** Second line, e.g. "→ dasatinib 70 mg tablet · 93%" or "3 fills". */
  detail?: string;
  /** Decision summary badge; omitted while undecided. */
  status?: string;
  decided: boolean;
}

export interface ReviewListSection {
  key: string;
  label: string;
  items: ReviewListItem[];
}

export interface ReviewListProps {
  label: string;
  sections: ReviewListSection[];
  selectedKey: string | undefined;
  onSelect: (key: string) => void;
  onOpen: (key: string) => void;
  /** Registers each option element so the host can move focus to it. */
  optionRef: (key: string, element: HTMLElement | null) => void;
}

export function ReviewList({
  label,
  sections,
  selectedKey,
  onSelect,
  onOpen,
  optionRef,
}: ReviewListProps) {
  const m = useMessages();
  const baseId = React.useId();
  const keys = sections.flatMap((s) => s.items.map((i) => i.key));
  const elements = React.useRef(new Map<string, HTMLElement>());

  const move = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = selectedKey ? keys.indexOf(selectedKey) : -1;
    let next: number | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(keys.length - 1, index + 1);
        break;
      case 'ArrowUp':
        next = Math.max(0, index - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = keys.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const key = keys[next];
    if (key !== undefined) {
      onSelect(key);
      elements.current.get(key)?.focus();
    }
  };

  return (
    <div role="listbox" aria-label={label} tabIndex={-1} onKeyDown={move}>
      {sections.map((section) => (
        <div
          key={section.key}
          role="group"
          aria-labelledby={`${baseId}-${section.key}`}
        >
          <div
            id={`${baseId}-${section.key}`}
            className="bg-muted/40 border-border text-muted-foreground border-b px-3 py-1.5 text-xs font-semibold"
          >
            {section.label}
          </div>
          {section.items.map((item) => {
            const selected = item.key === selectedKey;
            return (
              <div
                key={item.key}
                ref={(element) => {
                  if (element) elements.current.set(item.key, element);
                  else elements.current.delete(item.key);
                  optionRef(item.key, element);
                }}
                role="option"
                aria-selected={selected}
                data-key={item.key}
                tabIndex={
                  selected || (!selectedKey && item.key === keys[0]) ? 0 : -1
                }
                onClick={() => {
                  onSelect(item.key);
                  onOpen(item.key);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  onSelect(item.key);
                  onOpen(item.key);
                }}
                className={cn(
                  'border-border grid cursor-pointer grid-cols-[0.75rem_minmax(0,1fr)_auto] items-start gap-2 border-b px-3 py-2 text-sm',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                  selected
                    ? 'bg-primary-50 border-s-primary-800 border-s-4 ps-2 dark:bg-white/5'
                    : 'hover:bg-muted'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1 h-2.5 w-2.5 rounded-full border-2',
                    item.decided
                      ? 'border-primary-800 bg-primary-800'
                      : 'border-muted-foreground'
                  )}
                />
                <span className="min-w-0">
                  <span className="block font-medium break-words">
                    <bdi>{item.name}</bdi>
                  </span>
                  {item.detail && (
                    <span className="text-muted-foreground block text-xs break-words">
                      <bdi>{item.detail}</bdi>
                    </span>
                  )}
                </span>
                {item.status ? (
                  <Badge variant="default" size="sm">
                    {item.status}
                  </Badge>
                ) : (
                  <span className="sr-only">{m('Not reviewed')}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
