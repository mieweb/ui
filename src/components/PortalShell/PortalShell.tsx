'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';
import { AppHeader, AppHeaderSection } from '../AppHeader/AppHeader';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMobileToggle,
  SidebarNav,
  SidebarNavGroup,
  SidebarNavItem,
  type SidebarNavItemProps,
  SidebarToggle,
} from '../Sidebar/Sidebar';
import { SidebarProvider } from '../Sidebar/SidebarProvider';

// =============================================================================
// Types
// =============================================================================

export interface PortalNavItem {
  /** Unique key (used for active-match and React key). */
  key: string;
  /** Display label. */
  label: string;
  /** Icon (rendered 20x20). */
  icon?: React.ReactNode;
  /** Destination (href). */
  href: string;
  /** Optional badge (count or label). */
  badge?: string | number;
  /** Called when clicked instead of following href (e.g. SPA navigation). */
  onClick?: () => void;
  /** Hide this item conditionally (e.g. missing permission). */
  hidden?: boolean;
  /** Sub-nav items (renders the item as a group). */
  children?: PortalNavItem[];
}

export interface PortalNavGroup {
  /** Optional group label; when omitted, items render flat. */
  label?: string;
  /** Optional icon rendered beside the group label (and used as the rail
   *  affordance when the sidebar is collapsed). Size 20x20 recommended. */
  icon?: React.ReactNode;
  items: PortalNavItem[];
}

export interface PortalShellProps {
  /** Sidebar brand slot (logo). Rendered inside `SidebarHeader`. */
  brand: React.ReactNode;
  /** Nav groups for the sidebar. */
  navGroups: PortalNavGroup[];
  /**
   * Determines whether a nav item is active. Receives the item; by default
   * items are active when `window.location.pathname === item.href`.
   */
  isItemActive?: (item: PortalNavItem) => boolean;
  /** Called when a nav item is activated (click or keyboard). */
  onNavigate?: (item: PortalNavItem) => void;
  /** Content rendered in the top bar, left side (after mobile toggle). */
  topBarLeft?: React.ReactNode;
  /** Content rendered in the top bar, right side. */
  topBarRight?: React.ReactNode;
  /** Optional content rendered centered in the top bar (e.g. breadcrumbs). */
  topBarCenter?: React.ReactNode;
  /**
   * Optional content rendered in a secondary bar directly below the top
   * `AppHeader`. Ideal for page-level context such as breadcrumbs, tab
   * strips, or filter controls that should persist across the whole page
   * but are distinct from the app-wide top bar.
   */
  subHeader?: React.ReactNode;
  /** Optional footer content rendered inside the sidebar (above default toggle). */
  sidebarFooter?: React.ReactNode;
  /** When true, hide the default `SidebarToggle` in the footer. */
  hideDefaultSidebarToggle?: boolean;
  /** Storage key for the sidebar collapsed state. */
  storageKey?: string;
  /** Content area. */
  children: React.ReactNode;
  /** Optional className for the main content wrapper. */
  contentClassName?: string;
  /** If provided, content renders inside a max-width wrapper; default `'7xl'`. Pass `null` to disable. */
  contentMaxWidth?:
    | 'none'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | null;
}

// =============================================================================
// Helpers
// =============================================================================

const MAX_WIDTH_CLASS: Record<string, string> = {
  none: 'max-w-none',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

function defaultIsActive(item: PortalNavItem): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === item.href;
}

// =============================================================================
// Component
// =============================================================================

/**
 * PortalShell — shared authenticated-portal chrome.
 *
 * Composes `AppHeader` + `Sidebar` + a scrolling content area. Consumers
 * supply nav groups, brand, and top-bar slots; PortalShell handles the
 * responsive wiring, persistence, and layout.
 */
export function PortalShell({
  brand,
  navGroups,
  isItemActive = defaultIsActive,
  onNavigate,
  topBarLeft,
  topBarRight,
  topBarCenter,
  subHeader,
  sidebarFooter,
  hideDefaultSidebarToggle = false,
  storageKey,
  children,
  contentClassName,
  contentMaxWidth = '7xl',
}: PortalShellProps): React.JSX.Element {
  const handleActivate = (item: PortalNavItem) => {
    if (item.onClick) item.onClick();
    else if (onNavigate) onNavigate(item);
  };

  const renderItem = (item: PortalNavItem): React.ReactNode => {
    if (item.hidden) return null;
    const active = isItemActive(item);
    const props: SidebarNavItemProps = {
      label: item.label,
      icon: item.icon,
      href: item.href,
      isActive: active,
      badge: item.badge,
      onClick: () => handleActivate(item),
    };
    return <SidebarNavItem key={item.key} {...props} />;
  };

  return (
    <SidebarProvider storageKey={storageKey}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar>
          <SidebarHeader>{brand}</SidebarHeader>
          <SidebarContent>
            <SidebarNav>
              {navGroups.map((group, gi) => {
                const visibleItems = group.items.filter((it) => !it.hidden);
                if (visibleItems.length === 0) return null;
                if (!group.label) {
                  return (
                    <React.Fragment key={`g-${gi}`}>
                      {visibleItems.map(renderItem)}
                    </React.Fragment>
                  );
                }
                return (
                  <SidebarNavGroup
                    key={group.label}
                    label={group.label}
                    icon={group.icon}
                  >
                    {visibleItems.map(renderItem)}
                  </SidebarNavGroup>
                );
              })}
            </SidebarNav>
          </SidebarContent>

          {(sidebarFooter || !hideDefaultSidebarToggle) && (
            <SidebarFooter>
              {sidebarFooter}
              {!hideDefaultSidebarToggle && <SidebarToggle />}
            </SidebarFooter>
          )}
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader>
            <AppHeaderSection align="left">
              <SidebarMobileToggle className="lg:hidden" />
              {topBarLeft}
            </AppHeaderSection>
            {topBarCenter && (
              <AppHeaderSection align="center" className="hidden md:flex">
                {topBarCenter}
              </AppHeaderSection>
            )}
            {topBarRight && (
              <AppHeaderSection align="right">{topBarRight}</AppHeaderSection>
            )}
          </AppHeader>

          {subHeader && (
            <div className="bg-background/60 supports-[backdrop-filter]:bg-background/60 border-b border-border backdrop-blur">
              <div
                className={cn(
                  'mx-auto flex w-full items-center gap-3 px-4 py-2 sm:px-6',
                  contentMaxWidth && MAX_WIDTH_CLASS[contentMaxWidth]
                )}
              >
                {subHeader}
              </div>
            </div>
          )}

          <main
            className="bg-muted/30 flex-1 overflow-y-auto"
            id="portal-main-content"
          >
            <div
              className={cn(
                'mx-auto w-full p-4 sm:p-6',
                contentMaxWidth && MAX_WIDTH_CLASS[contentMaxWidth],
                contentClassName
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
