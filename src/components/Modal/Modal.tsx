import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// Track number of open modals to manage body scroll lock
let openModalCount = 0;
let originalBodyOverflow: string | null = null;

// Check if we're in Storybook docs mode (multiple stories rendered inline)
function isStorybookDocsMode(): boolean {
  if (typeof window === 'undefined') return false;
  // Storybook docs mode renders in an iframe with viewMode=docs in the URL
  return window.location.search.includes('viewMode=docs');
}

const modalOverlayVariants = cva(
  [
    'fixed inset-0 z-50',
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
    'fixed left-1/2 top-1/2 z-50',
    '-translate-x-1/2 -translate-y-1/2',
    'w-full bg-card text-card-foreground',
    'border border-border rounded-xl shadow-lg',
    'focus:outline-none',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'duration-200',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
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
    if (open && !isStorybookDocsMode()) {
      openModalCount++;
      // Only capture and set overflow when first modal opens
      if (openModalCount === 1) {
        originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      return () => {
        openModalCount--;
        // Only restore overflow when last modal closes
        if (openModalCount === 0 && originalBodyOverflow !== null) {
          document.body.style.overflow = originalBodyOverflow;
          originalBodyOverflow = null;
        }
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <ModalContext.Provider
      value={{ onClose: () => onOpenChange(false), modalId }}
    >
      {/* Portal to body */}
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <div
          className={cn(modalOverlayVariants())}
          data-state={open ? 'open' : 'closed'}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
        {/* Content */}
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
          className={cn(modalContentVariants({ size }), className)}
        >
          {children}
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
      className={cn(
        'flex items-center justify-between',
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
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
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
      className={cn(
        'flex items-center justify-end gap-3',
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
