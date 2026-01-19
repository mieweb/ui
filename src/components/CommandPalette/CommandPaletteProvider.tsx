import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useCommandK } from '../../hooks/useKeyboardShortcut';

// =============================================================================
// Types
// =============================================================================

export interface CommandPaletteItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional description text */
  description?: string;
  /** Category/group for grouping items */
  category?: string;
  /** Custom icon element */
  icon?: ReactNode;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Additional metadata for filtering/display */
  metadata?: Record<string, unknown>;
}

export interface CommandPaletteCategory {
  /** Unique identifier for the category */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional color class for styling */
  colorClass?: string;
}

export interface CommandPaletteContextValue {
  /** Whether the palette is currently open */
  isOpen: boolean;
  /** Open the command palette */
  open: () => void;
  /** Close the command palette */
  close: () => void;
  /** Toggle the command palette */
  toggle: () => void;
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Currently selected item index */
  selectedIndex: number;
  /** Set the selected item index */
  setSelectedIndex: (index: number) => void;
  /** Active category filter */
  activeCategory: string | null;
  /** Set the active category filter */
  setActiveCategory: (category: string | null) => void;
  /** Register items (used by consumers) */
  items: CommandPaletteItem[];
  /** Register categories (used by consumers) */
  categories: CommandPaletteCategory[];
  /** Set items */
  setItems: (items: CommandPaletteItem[]) => void;
  /** Set categories */
  setCategories: (categories: CommandPaletteCategory[]) => void;
}

// =============================================================================
// Context
// =============================================================================

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
);

// =============================================================================
// Provider
// =============================================================================

export interface CommandPaletteProviderProps {
  children: ReactNode;
  /** Whether to enable the Cmd/Ctrl+K shortcut (default: true) */
  enableShortcut?: boolean;
  /** Custom event name for opening (for integration with other systems) */
  customEventName?: string;
}

export function CommandPaletteProvider({
  children,
  enableShortcut = true,
  customEventName,
}: CommandPaletteProviderProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [items, setItems] = useState<CommandPaletteItem[]>([]);
  const [categories, setCategories] = useState<CommandPaletteCategory[]>([]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(-1);
    setActiveCategory(null);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Register Cmd/Ctrl+K shortcut
  useCommandK(toggle, enableShortcut);

  // Listen for custom event (for integration with other systems)
  React.useEffect(() => {
    if (!customEventName) return;

    const handler = () => open();
    document.addEventListener(customEventName, handler);
    return () => document.removeEventListener(customEventName, handler);
  }, [customEventName, open]);

  const contextValue = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      query,
      setQuery,
      selectedIndex,
      setSelectedIndex,
      activeCategory,
      setActiveCategory,
      items,
      categories,
      setItems,
      setCategories,
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      query,
      selectedIndex,
      activeCategory,
      items,
      categories,
    ]
  );

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access the command palette context.
 * Must be used within a CommandPaletteProvider.
 *
 * @example
 * ```tsx
 * function SearchButton() {
 *   const { open } = useCommandPalette();
 *   return <button onClick={open}>Search (⌘K)</button>;
 * }
 * ```
 */
export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      'useCommandPalette must be used within a CommandPaletteProvider'
    );
  }
  return context;
}
