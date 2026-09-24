/**
 * Jump-to-bottom — shared scroll-anchoring affordance for chat threads.
 *
 * Lives in the ChatComposer module (the shared chat infrastructure) so both
 * SuperChat and AIChat — and eventually Messaging — can use it without
 * reaching into another module's internals. Pairs with the
 * `useStickToBottom` hook (`src/hooks/useStickToBottom.ts`).
 */

import * as React from 'react';
import { ArrowDown as ArrowDownIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface JumpToBottomButtonProps {
  /** Show the "New messages" hint — unseen messages arrived below. */
  hasNewMessages: boolean;
  onClick: () => void;
  /**
   * `data-slot` attribute — each chat surface keeps its own slot namespace
   * (e.g. `superchat-jump-to-bottom`, `ai-chat-jump-to-bottom`).
   */
  dataSlot: string;
}

/**
 * Floating control shown over the thread whenever the user has scrolled up:
 * more content exists below (possibly still streaming in), and activating the
 * button returns to the newest message and resumes bottom-pinning. Absolutely
 * positioned within the thread viewport wrapper — never `fixed`, so it stays
 * inside embedded layouts.
 */
export function JumpToBottomButton({
  hasNewMessages,
  onClick,
  dataSlot,
}: JumpToBottomButtonProps) {
  return (
    <button
      type="button"
      data-slot={dataSlot}
      onClick={onClick}
      aria-label={
        hasNewMessages ? 'New messages — scroll to bottom' : 'Scroll to bottom'
      }
      className={cn(
        'absolute bottom-3 left-1/2 z-20 -translate-x-1/2',
        'flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white p-2 text-xs font-medium text-neutral-600 shadow-lg',
        'hover:bg-neutral-50 hover:text-neutral-800',
        'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2',
        'dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
        hasNewMessages && 'ps-3'
      )}
    >
      {hasNewMessages && <span>New messages</span>}
      <ArrowDownIcon size={16} aria-hidden="true" />
    </button>
  );
}
