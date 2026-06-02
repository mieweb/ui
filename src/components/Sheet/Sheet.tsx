import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const sheetOverlayVariants = cva([
  'fixed inset-0 z-50',
  'bg-black/50 backdrop-blur-sm',
  'data-[state=open]:animate-in data-[state=open]:fade-in-0',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
]);

const sheetContentVariants = cva(
  [
    'fixed z-50 flex flex-col gap-4',
    'bg-card text-card-foreground shadow-lg',
    'border-border',
    'focus:outline-none',
    'transition ease-in-out duration-200',
  ],
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b max-h-dvh',
        bottom: 'inset-x-0 bottom-0 border-t max-h-dvh',
        left: 'inset-y-0 left-0 h-full border-r w-3/4 sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full border-l w-3/4 sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

export interface SheetProps
  extends VariantProps<typeof sheetContentVariants> {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when the sheet should close */
  onOpenChange: (open: boolean) => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Close when clicking the overlay (default true) */
  closeOnOverlayClick?: boolean;
  /** Close when pressing Escape (default true) */
  closeOnEscape?: boolean;
  /** Additional class name for the sheet content */
  className?: string;
  /** ID for the sheet, used for accessibility */
  id?: string;
  /** Accessible label for the sheet */
  'aria-label'?: string;
  /** ID of the element that labels the sheet */
  'aria-labelledby'?: string;
  /** ID of the element that describes the sheet */
  'aria-describedby'?: string;
}

/**
 * A panel that slides in from an edge of the screen.
 *
 * @example
 * ```tsx
 * <Sheet open={open} onOpenChange={setOpen} side="right">
 *   <SheetHeader>
 *     <SheetTitle>Filters</SheetTitle>
 *   </SheetHeader>
 *   <SheetBody>...</SheetBody>
 * </Sheet>
 * ```
 */
function Sheet({
  open,
  onOpenChange,
  children,
  side,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: SheetProps) {
  const generatedId = React.useId();
  const sheetId = id || generatedId;

  const focusTrapRef = useFocusTrap<HTMLDivElement>(open);

  useEscapeKey(() => {
    if (closeOnEscape && open) onOpenChange(false);
  }, open);

  const handleOverlayClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [closeOnOverlayClick, onOpenChange]
  );

  if (!open) return null;

  return (
    <SheetContext.Provider
      value={{ onClose: () => onOpenChange(false), sheetId }}
    >
      <div className="fixed inset-0 z-50">
        <div
          className={cn(sheetOverlayVariants())}
          data-state="open"
          aria-hidden="true"
          onClick={handleOverlayClick}
        />
        <div
          ref={focusTrapRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy || `${sheetId}-title`}
          aria-describedby={ariaDescribedBy}
          id={sheetId}
          tabIndex={-1}
          data-state="open"
          data-slot="sheet"
          className={cn(sheetContentVariants({ side }), className)}
        >
          {children}
        </div>
      </div>
    </SheetContext.Provider>
  );
}

Sheet.displayName = 'Sheet';

interface SheetContextValue {
  onClose: () => void;
  sheetId: string;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(
  undefined
);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet');
  }
  return context;
}

export type SheetHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sheet-header"
      className={cn(
        'flex shrink-0 items-center justify-between',
        'border-border border-b px-6 py-4',
        className
      )}
      {...props}
    />
  )
);

SheetHeader.displayName = 'SheetHeader';

export type SheetTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, children, ...props }, ref) => {
    const { sheetId } = useSheetContext();
    return (
      <h2
        ref={ref}
        id={`${sheetId}-title`}
        data-slot="sheet-title"
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

SheetTitle.displayName = 'SheetTitle';

export type SheetDescriptionProps =
  React.HTMLAttributes<HTMLParagraphElement>;

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  SheetDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="sheet-description"
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));

SheetDescription.displayName = 'SheetDescription';

export type SheetBodyProps = React.HTMLAttributes<HTMLDivElement>;

const SheetBody = React.forwardRef<HTMLDivElement, SheetBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sheet-body"
      className={cn('flex-1 overflow-y-auto px-6 py-4', className)}
      {...props}
    />
  )
);

SheetBody.displayName = 'SheetBody';

export type SheetFooterProps = React.HTMLAttributes<HTMLDivElement>;

const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sheet-footer"
      className={cn(
        'flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        'border-border border-t px-6 py-4',
        className
      )}
      {...props}
    />
  )
);

SheetFooter.displayName = 'SheetFooter';

export type SheetCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { onClose } = useSheetContext();
    return (
      <button
        ref={ref}
        type="button"
        data-slot="sheet-close"
        aria-label="Close"
        onClick={(e) => {
          onClose();
          onClick?.(e);
        }}
        className={cn(
          'text-muted-foreground hover:text-foreground rounded-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'transition-colors',
          className
        )}
        {...props}
      >
        {children ?? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        )}
      </button>
    );
  }
);

SheetClose.displayName = 'SheetClose';

export {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
  sheetContentVariants,
  sheetOverlayVariants,
};
