import * as React from 'react';
import { cn } from '../../utils/cn';
import { Animated, AnimatedPresence } from '../../motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

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

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controlled open state */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Callback fired when the open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Disables toggling */
  disabled?: boolean;
  /**
   * Persists the open state in `localStorage` under this key (uncontrolled
   * only). Restored after mount, so server and hydration renders use
   * `defaultOpen`.
   */
  storageKey?: string;
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
      storageKey,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const generatedId = React.useId();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const persists = Boolean(storageKey) && !isControlled;

    React.useEffect(() => {
      if (!persists || !storageKey) return;
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored === 'true' || stored === 'false') {
          setUncontrolledOpen(stored === 'true');
        }
      } catch {
        // Storage can be blocked (privacy mode, sandboxed iframe).
      }
    }, [persists, storageKey]);

    const toggle = React.useCallback(() => {
      if (disabled) return;
      const next = !open;
      if (!isControlled) setUncontrolledOpen(next);
      if (persists && storageKey) {
        try {
          window.localStorage.setItem(storageKey, String(next));
        } catch {
          // Storage can be blocked or full; state still updates in memory.
        }
      }
      onOpenChange?.(next);
    }, [disabled, open, isControlled, persists, storageKey, onOpenChange]);

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

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Keep content mounted when collapsed (hidden via CSS) */
  forceMount?: boolean;
}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, forceMount, children, ...props }, ref) => {
  const { open, contentId, triggerId } =
    useCollapsibleContext('CollapsibleContent');
  const prefersReducedMotion = usePrefersReducedMotion();

  const sharedProps = {
    id: contentId,
    role: 'region' as const,
    'aria-labelledby': triggerId,
    'data-slot': 'collapsible-content',
    'data-state': open ? ('open' as const) : ('closed' as const),
  };

  /*
   * `forceMount` keeps the old instant behaviour, deliberately.
   *
   * It exists so consumers can keep collapsed content in the DOM, and it relies
   * on `hidden` to keep that content out of the tab order and the accessibility
   * tree. `hidden` is `display: none`, which an animated height cannot run
   * through — and dropping it for the duration would leave keyboard users able
   * to tab into content that is visually collapsed. Sequencing `hidden` around
   * the animation is the real fix; until then, not animating is the safe
   * answer, and the default (unmounting) path below covers the common case.
   */
  if (forceMount) {
    return (
      <div
        ref={ref}
        {...sharedProps}
        hidden={!open}
        className={cn(className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <AnimatedPresence initial={false}>
      {open && (
        <Animated
          key="collapsible-content"
          ref={ref as React.Ref<HTMLElement>}
          preset="collapse"
          mode="presence"
          // `collapse` animates height, which `MotionConfig reducedMotion="user"`
          // does not treat as a transform or layout animation and so leaves
          // running. Honouring the preference is the component's job here.
          enabled={!prefersReducedMotion}
          {...sharedProps}
          // Content must be clipped or it spills past the box while the height
          // is still travelling.
          className={cn('overflow-hidden', className)}
          {...props}
        >
          {children}
        </Animated>
      )}
    </AnimatedPresence>
  );
});

CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
