import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { isStorybookDocsMode } from '../../utils/environment';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';

/**
 * Modal scroll lock state manager.
 * Uses a singleton pattern with ref-like storage to track open modals
 * and manage body scroll locking across multiple modal instances.
 * Includes reset capability for testing environments.
 */
const scrollLockState = {
  count: 0,
  originalOverflow: null as string | null,
  reset() {
    this.count = 0;
    this.originalOverflow = null;
  },
};

// Export for testing environments
export const __resetScrollLockState = () => scrollLockState.reset();

const modalOverlayVariants = cva(
  [
    'fixed inset-0',
    'bg-black/50 backdrop-blur-sm',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
  ],
  {
    variants: {},
    defaultVariants: {},
  }
);

const modalContentVariants = cva(
  [
    'relative w-full bg-card text-card-foreground',
    'border border-border shadow-lg',
    // Full-screen on mobile, rounded on larger screens
    'rounded-none sm:rounded-xl',
    'flex flex-col',
    // Full viewport height on mobile, constrained on larger screens
    'max-h-dvh sm:max-h-[calc(100dvh-2rem)]',
    'min-h-dvh sm:min-h-0',
    // If a <form> is used as a direct child (wrapping ModalBody + ModalFooter),
    // make it participate in the flex column layout so overflow constraints work.
    '[&>form]:flex [&>form]:flex-col [&>form]:flex-1 [&>form]:min-h-0',
    'focus:outline-none',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'duration-200',
  ],
  {
    variants: {
      size: {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        full: 'max-w-[calc(100vw-2rem)]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ModalProps extends VariantProps<typeof modalContentVariants> {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onOpenChange: (open: boolean) => void;
  /** Modal content */
  children: React.ReactNode;
  /** Whether to close when clicking the overlay */
  closeOnOverlayClick?: boolean;
  /** Whether to close when pressing Escape */
  closeOnEscape?: boolean;
  /** Additional class name for the modal content */
  className?: string;
  /** ID for the modal, used for accessibility */
  id?: string;
  /** Accessible label for the modal */
  'aria-label'?: string;
  /** ID of the element that labels the modal */
  'aria-labelledby'?: string;
  /** ID of the element that describes the modal */
  'aria-describedby'?: string;
}

/**
 * An accessible modal/dialog component.
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onOpenChange={setIsOpen} size="lg">
 *   <ModalHeader>
 *     <ModalTitle>Confirm Action</ModalTitle>
 *     <ModalClose />
 *   </ModalHeader>
 *   <ModalBody>
 *     Are you sure you want to continue?
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
function Modal({
  open,
  onOpenChange,
  children,
  size,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const generatedId = React.useId();
  const modalId = id || generatedId;

  // Focus trap (only active when modal is open)
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open);

  // Handle escape key
  useEscapeKey(() => {
    if (closeOnEscape && open) {
      onOpenChange(false);
    }
  }, open);

  // Handle overlay click
  const handleOverlayClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [closeOnOverlayClick, onOpenChange]
  );

  // Prevent body scroll when modal is open (handles multiple modals)
  // Skip scroll lock in Storybook docs mode where multiple stories render inline
  React.useEffect(() => {
    // Skip scroll lock entirely in Storybook docs mode
    if (!open || isStorybookDocsMode()) {
      return undefined;
    }

    scrollLockState.count++;
    // Only capture and set overflow when first modal opens
    if (scrollLockState.count === 1) {
      scrollLockState.originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      scrollLockState.count--;
      // Only restore overflow when last modal closes
      if (
        scrollLockState.count === 0 &&
        scrollLockState.originalOverflow !== null
      ) {
        document.body.style.overflow = scrollLockState.originalOverflow;
        scrollLockState.originalOverflow = null;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalContext.Provider
      value={{ onClose: () => onOpenChange(false), modalId }}
    >
      {/* Portal to body */}
      <div className="fixed inset-0 z-50">
        {/* Overlay backdrop */}
        <div
          className={cn(modalOverlayVariants())}
          data-state={open ? 'open' : 'closed'}
          aria-hidden="true"
        />
        {/* Scrollable centering container — click outside to close */}
        <div className="fixed inset-0 overflow-y-auto">
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="flex min-h-full items-center justify-center p-0 sm:p-4"
            onClick={handleOverlayClick}
          >
            {/* Content */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
            <div
              ref={focusTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy || `${modalId}-title`}
              aria-describedby={ariaDescribedBy}
              id={modalId}
              tabIndex={-1}
              data-state={open ? 'open' : 'closed'}
              data-slot="modal"
              className={cn(modalContentVariants({ size }), className)}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </ModalContext.Provider>
  );
}

Modal.displayName = 'Modal';

// ============================================================================
// Modal Context
// ============================================================================

interface ModalContextValue {
  onClose: () => void;
  modalId: string;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(
  undefined
);

function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within a Modal');
  }
  return context;
}

// ============================================================================
// Modal Header
// ============================================================================

export type ModalHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Header section of a Modal.
 */
const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="modal-header"
      className={cn(
        'flex shrink-0 items-center justify-between',
        'border-border border-b px-6 py-4',
        className
      )}
      {...props}
    />
  )
);

ModalHeader.displayName = 'ModalHeader';

// ============================================================================
// Modal Title
// ============================================================================

export type ModalTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

/**
 * Title for a Modal.
 */
const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, children, ...props }, ref) => {
    const { modalId } = useModalContext();
    return (
      <h2
        ref={ref}
        id={`${modalId}-title`}
        data-slot="modal-title"
        className={cn(
          'text-lg leading-none font-semibold tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </h2>
    );
  }
);

ModalTitle.displayName = 'ModalTitle';

// ============================================================================
// Modal Close Button
// ============================================================================

export type ModalCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Close button for a Modal.
 */
const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { onClose } = useModalContext();

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onClose();
        }
      },
      [onClick, onClose]
    );

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        data-slot="modal-close"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-muted transition-colors',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          className
        )}
        aria-label="Close"
        {...props}
      >
        {children || <CloseIcon />}
      </button>
    );
  }
);

ModalClose.displayName = 'ModalClose';

// ============================================================================
// Modal Body
// ============================================================================

export type ModalBodyProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Main content area of a Modal.
 */
const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="modal-body"
      className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-4', className)}
      {...props}
    />
  )
);

ModalBody.displayName = 'ModalBody';

// ============================================================================
// Modal Footer
// ============================================================================

export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Footer section of a Modal, typically for action buttons.
 */
const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="modal-footer"
      className={cn(
        'flex shrink-0 items-center justify-end gap-3',
        'border-border border-t px-6 py-4',
        className
      )}
      {...props}
    />
  )
);

ModalFooter.displayName = 'ModalFooter';

// ============================================================================
// Close Icon
// ============================================================================

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  modalContentVariants,
  modalOverlayVariants,
};
