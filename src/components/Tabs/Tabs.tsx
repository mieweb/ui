import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Tabs Context
// ============================================================================

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  variant: 'underline' | 'pills' | 'enclosed';
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

// ============================================================================
// Tabs Root
// ============================================================================

export interface TabsProps {
  /** The controlled value of the selected tab */
  value?: string;
  /** The default value of the selected tab (uncontrolled) */
  defaultValue?: string;
  /** Callback when the selected tab changes */
  onValueChange?: (value: string) => void;
  /** Visual variant of the tabs */
  variant?: 'underline' | 'pills' | 'enclosed';
  /** Tab content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Accessible tabs component with keyboard navigation.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * ```
 */
function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = 'underline',
  children,
  className,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ''
  );

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider
      value={{ value, onValueChange: handleValueChange, variant }}
    >
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.displayName = 'Tabs';

// ============================================================================
// Tabs List
// ============================================================================

const tabsListVariants = cva(['flex items-center'], {
  variants: {
    variant: {
      underline: 'border-b border-border gap-0',
      pills: 'gap-1 p-1 rounded-lg bg-muted',
      enclosed: 'gap-0 border-b border-border',
    },
  },
  defaultVariants: {
    variant: 'underline',
  },
});

export type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Container for tab triggers.
 */
const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    const { variant } = useTabsContext();
    const listRef = React.useRef<HTMLDivElement>(null);

    // Keyboard navigation
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const list = listRef.current;
        if (!list) return;

        const triggers = Array.from(
          list.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]:not([disabled])'
          )
        );
        const currentIndex = triggers.findIndex(
          (trigger) => trigger === document.activeElement
        );

        let nextIndex: number;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            nextIndex =
              currentIndex === triggers.length - 1 ? 0 : currentIndex + 1;
            triggers[nextIndex]?.focus();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            nextIndex =
              currentIndex === 0 ? triggers.length - 1 : currentIndex - 1;
            triggers[nextIndex]?.focus();
            break;
          case 'Home':
            e.preventDefault();
            triggers[0]?.focus();
            break;
          case 'End':
            e.preventDefault();
            triggers[triggers.length - 1]?.focus();
            break;
        }
      },
      []
    );

    return (
      <div
        ref={(node) => {
          // Combine refs
          (listRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        role="tablist"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

TabsList.displayName = 'TabsList';

// ============================================================================
// Tabs Trigger
// ============================================================================

const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'whitespace-nowrap',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        underline: [
          'px-4 py-2 -mb-px',
          'border-b-2 border-transparent',
          'text-muted-foreground hover:text-foreground',
          'data-[state=active]:border-primary-700 data-[state=active]:text-primary-800',
        ],
        pills: [
          'px-3 py-1.5 rounded-md text-sm',
          'text-muted-foreground hover:text-foreground',
          'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        ],
        enclosed: [
          'px-4 py-2 -mb-px',
          'border border-transparent rounded-t-lg',
          'text-muted-foreground hover:text-foreground',
          'data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground',
        ],
      },
    },
    defaultVariants: {
      variant: 'underline',
    },
  }
);

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The value that identifies this tab */
  value: string;
  /** Icon to show before the label */
  icon?: React.ReactNode;
}

/**
 * A tab trigger button.
 */
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, icon, children, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant } = useTabsContext();
    const isSelected = selectedValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        aria-controls={`tabpanel-${value}`}
        id={`tab-${value}`}
        tabIndex={isSelected ? 0 : -1}
        data-state={isSelected ? 'active' : 'inactive'}
        disabled={disabled}
        onClick={() => onValueChange(value)}
        className={cn(tabsTriggerVariants({ variant }), className)}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

// ============================================================================
// Tabs Content
// ============================================================================

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The value that identifies this content panel */
  value: string;
  /** Force mount the content (useful for animations) */
  forceMount?: boolean;
}

/**
 * Content panel for a tab.
 */
const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, forceMount = false, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isSelected = selectedValue === value;

    if (!isSelected && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        tabIndex={0}
        hidden={!isSelected}
        data-state={isSelected ? 'active' : 'inactive'}
        className={cn(
          'focus-visible:ring-ring mt-4 rounded-lg focus-visible:ring-2 focus-visible:outline-none',
          !isSelected && 'hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
};
