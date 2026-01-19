import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// =============================================================================
// Types
// =============================================================================

export interface SidebarContextValue {
  /** Whether the sidebar is collapsed (desktop) */
  isCollapsed: boolean;
  /** Toggle collapsed state */
  toggleCollapsed: () => void;
  /** Set collapsed state */
  setCollapsed: (collapsed: boolean) => void;
  /** Whether the mobile sidebar is open */
  isMobileOpen: boolean;
  /** Open mobile sidebar */
  openMobile: () => void;
  /** Close mobile sidebar */
  closeMobile: () => void;
  /** Toggle mobile sidebar */
  toggleMobile: () => void;
  /** Whether we're on a mobile/tablet viewport */
  isMobileViewport: boolean;
  /** Currently expanded group (for accordion behavior) */
  expandedGroup: string | null;
  /** Set the expanded group */
  setExpandedGroup: (group: string | null) => void;
  /** Toggle a group's expanded state */
  toggleGroup: (group: string) => void;
}

// =============================================================================
// Context
// =============================================================================

const SidebarContext = createContext<SidebarContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export interface SidebarProviderProps {
  children: ReactNode;
  /** Default collapsed state (default: false) */
  defaultCollapsed?: boolean;
  /** Storage key for persisting collapsed state (default: 'sidebar-collapsed') */
  storageKey?: string;
  /** Whether to persist collapsed state to localStorage (default: true) */
  persistCollapsed?: boolean;
  /** Default expanded group */
  defaultExpandedGroup?: string | null;
  /** Breakpoint for mobile detection (default: 1024px) */
  mobileBreakpoint?: string;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  storageKey = 'sidebar-collapsed',
  persistCollapsed = true,
  defaultExpandedGroup = null,
  mobileBreakpoint = '(max-width: 1023px)',
}: SidebarProviderProps): React.JSX.Element {
  // Check if mobile viewport
  const isMobileViewport = useMediaQuery(mobileBreakpoint);

  // Initialize collapsed state from localStorage or default
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && persistCollapsed) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultCollapsed;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    defaultExpandedGroup
  );

  // Persist collapsed state
  useEffect(() => {
    if (persistCollapsed && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(isCollapsed));
    }
  }, [isCollapsed, persistCollapsed, storageKey]);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    if (!isMobileViewport && isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [isMobileViewport, isMobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroup((prev) => (prev === group ? null : group));
  }, []);

  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      isCollapsed,
      toggleCollapsed,
      setCollapsed,
      isMobileOpen,
      openMobile,
      closeMobile,
      toggleMobile,
      isMobileViewport,
      expandedGroup,
      setExpandedGroup,
      toggleGroup,
    }),
    [
      isCollapsed,
      toggleCollapsed,
      setCollapsed,
      isMobileOpen,
      openMobile,
      closeMobile,
      toggleMobile,
      isMobileViewport,
      expandedGroup,
      toggleGroup,
    ]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access the sidebar context.
 * Must be used within a SidebarProvider.
 *
 * @example
 * ```tsx
 * function MenuButton() {
 *   const { isMobileViewport, openMobile, toggleCollapsed } = useSidebar();
 *
 *   return (
 *     <button onClick={isMobileViewport ? openMobile : toggleCollapsed}>
 *       Menu
 *     </button>
 *   );
 * }
 * ```
 */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
