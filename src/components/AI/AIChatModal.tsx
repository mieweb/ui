/**
 * AI Chat Modal Component
 *
 * A floating chat window that can be triggered with a button.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { AIChatProps } from './AIChat';
import { AIChat } from './AIChat';
import { SparklesIcon } from './icons';

// ============================================================================
// AI Chat Trigger Button
// ============================================================================

export interface AIChatTriggerProps {
  /** Whether the chat is open */
  isOpen?: boolean;
  /** Callback when clicked */
  onClick?: () => void;
  /** Pulse animation to draw attention */
  pulse?: boolean;
  /** Badge count for notifications */
  badge?: number;
  /** Position of the button */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Additional class name */
  className?: string;
}

export function AIChatTrigger({
  isOpen = false,
  onClick,
  pulse = false,
  badge,
  position = 'bottom-right',
  className,
}: AIChatTriggerProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg',
        'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
        'hover:from-violet-600 hover:to-purple-700',
        'focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none',
        'dark:focus:ring-offset-neutral-900',
        'transition-all duration-200',
        isOpen && 'scale-0 opacity-0',
        positionClasses[position],
        className
      )}
      aria-label="Open AI Assistant"
    >
      {/* Pulse effect */}
      {pulse && !isOpen && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
      )}

      {/* Badge */}
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}

      {/* AI Icon */}
      <SparklesIcon size="lg" />
    </button>
  );
}

// ============================================================================
// AI Chat Modal
// ============================================================================

export interface AIChatModalProps extends Omit<
  AIChatProps,
  'variant' | 'size'
> {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onOpenChange: (open: boolean) => void;
  /** Position of the modal */
  position?: 'bottom-right' | 'bottom-left' | 'center';
  /** Width of the modal */
  width?: string | number;
  /** Height of the modal */
  height?: string | number;
  /** Additional class name for the modal */
  modalClassName?: string;
}

/**
 * A modal chat window that can be positioned in the corner or center.
 */
export function AIChatModal({
  open,
  onOpenChange,
  position = 'bottom-right',
  width = 400,
  height = 600,
  modalClassName,
  ...chatProps
}: AIChatModalProps) {
  // Focus trap when open
  const modalRef = useFocusTrap<HTMLDivElement>(open);

  // Close on escape
  useEscapeKey(() => {
    if (open) onOpenChange(false);
  });

  if (!open) return null;

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <>
      {/* Backdrop for center position */}
      {position === 'center' && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          onKeyDown={(e) => e.key === 'Escape' && onOpenChange(false)}
          role="button"
          tabIndex={0}
          aria-label="Close dialog"
        />
      )}

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'fixed z-50',
          'animate-in fade-in-0 zoom-in-95',
          positionClasses[position],
          modalClassName
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          maxHeight: 'calc(100vh - 6rem)',
          maxWidth: 'calc(100vw - 2rem)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant Chat"
      >
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
          <AIChat
            {...chatProps}
            variant="embedded"
            height="100%"
            className="h-full"
            onClose={() => onOpenChange(false)}
          />
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Floating AI Chat (Combined Trigger + Modal)
// ============================================================================

export interface FloatingAIChatProps extends Omit<
  AIChatModalProps,
  'open' | 'onOpenChange'
> {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Button position */
  buttonPosition?: AIChatTriggerProps['position'];
  /** Show pulse animation */
  pulse?: boolean;
}

/**
 * A complete floating AI chat with trigger button and modal.
 */
export function FloatingAIChat({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  buttonPosition = 'bottom-right',
  position = 'bottom-right',
  pulse = false,
  ...chatProps
}: FloatingAIChatProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    controlledOnOpenChange?.(open);
  };

  return (
    <>
      <AIChatTrigger
        isOpen={isOpen}
        onClick={() => handleOpenChange(true)}
        position={buttonPosition}
        pulse={pulse && !isOpen}
      />
      <AIChatModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        position={position}
        {...chatProps}
      />
    </>
  );
}
