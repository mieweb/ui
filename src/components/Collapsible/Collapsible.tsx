import * as React from 'react';
import { cn } from '../../utils/cn';

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
  disabled?: boolean;
  contentId: string;
  triggerId: string;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null
);

function useCollapsibleContext(component: string): CollapsibleContextValue {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) {
    throw new Error(`${component} must be used within a <Collapsible>`);
  }
  return ctx;
}

export interface CollapsibleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Controlled open state */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Callback fired when the open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Disables toggling */
  disabled?: boolean;
}

/**
 * An interactive component that expands and collapses its content.
 *
 * @example
 * ```tsx
 * <Collapsible>
 *   <CollapsibleTrigger>Toggle</CollapsibleTrigger>
 *   <CollapsibleContent>Hidden content</CollapsibleContent>
 * </Collapsible>
 * ```
 */
const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      className,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] =
      React.useState(defaultOpen);
    const generatedId = React.useId();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const toggle = React.useCallback(() => {
      if (disabled) return;
      const next = !open;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    }, [disabled, open, isControlled, onOpenChange]);

    const value = React.useMemo<CollapsibleContextValue>(
      () => ({
        open,
        toggle,
        disabled,
        contentId: `${generatedId}-content`,
        triggerId: `${generatedId}-trigger`,
      }),
      [open, toggle, disabled, generatedId]
    );

    return (
      <CollapsibleContext.Provider value={value}>
        <div
          ref={ref}
          data-slot="collapsible"
          data-state={open ? 'open' : 'closed'}
          className={cn(className)}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

Collapsible.displayName = 'Collapsible';

export type CollapsibleTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ className, onClick, children, ...props }, ref) => {
  const { open, toggle, disabled, contentId, triggerId } =
    useCollapsibleContext('CollapsibleTrigger');

  return (
    <button
      ref={ref}
      type="button"
      id={triggerId}
      data-slot="collapsible-trigger"
      aria-expanded={open}
      aria-controls={contentId}
      data-state={open ? 'open' : 'closed'}
      disabled={disabled}
      onClick={(e) => {
        toggle();
        onClick?.(e);
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  );
});

CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Keep content mounted when collapsed (hidden via CSS) */
  forceMount?: boolean;
}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, forceMount, children, ...props }, ref) => {
  const { open, contentId, triggerId } =
    useCollapsibleContext('CollapsibleContent');

  if (!open && !forceMount) return null;

  return (
    <div
      ref={ref}
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      data-slot="collapsible-content"
      data-state={open ? 'open' : 'closed'}
      hidden={!open}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  );
});

CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
