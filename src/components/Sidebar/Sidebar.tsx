import React, {
  type ReactNode,
  useRef,
  useCallback,
  useId,
  useState,
  useEffect,
} from 'react';
import { cn } from '../../utils/cn';
import { useDirection } from '../../hooks/useDirection';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Animated, AnimatedPresence } from '../../motion';
import { useSidebar } from './SidebarProvider';

// =============================================================================
// Icons
// =============================================================================

const ChevronLeftIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 rtl:-scale-x-100"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 rtl:-scale-x-100"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    aria-hidden="true"
    className="h-3 w-3"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const XIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

// =============================================================================
// Sidebar Component
// =============================================================================

export interface SidebarProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Width when expanded (default: '280px') */
  expandedWidth?: string;
  /** Width when collapsed (default: '80px') */
  collapsedWidth?: string;
  /** Custom styles object */
  style?: React.CSSProperties;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function Sidebar({
  children,
  className,
  expandedWidth = '280px',
  collapsedWidth = '80px',
  style,
  'data-testid': testId = 'sidebar',
}: SidebarProps): React.JSX.Element {
  const { isCollapsed, isMobileOpen, closeMobile, isMobileViewport } =
    useSidebar();

  // The off-canvas drawer slides along the inline axis, so its direction has to
  // be resolved in JS for the motion path — CSS logical properties cover the
  // fallback, but a transform value cannot be expressed logically.
  //
  // Resolved from the nav itself rather than `<html>`: the CSS fallback uses
  // `rtl:` variants, which follow the nearest inherited `dir`. Reading the
  // document would disagree with that under a local `dir="rtl"` subtree and
  // spring the drawer off the wrong edge — so the two paths must resolve
  // direction the same way.
  const navRef = useRef<HTMLElement>(null);
  const isRtl = useDirection(navRef) === 'rtl';

  // Determine effective width
  const width = isMobileViewport
    ? expandedWidth
    : isCollapsed
      ? collapsedWidth
      : expandedWidth;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileViewport && (
        <AnimatedPresence>
          {isMobileOpen && (
            <Animated
              key="sidebar-backdrop"
              preset="overlay"
              mode="presence"
              data-slot="sidebar-backdrop"
              // No `lg:hidden` here: this only renders when `isMobileViewport`
              // is true, which follows the provider's configurable
              // `mobileBreakpoint`. A hardcoded 1024px CSS gate on top of that
              // disagrees with any custom breakpoint and hides the backdrop
              // while the drawer is open, leaving no way to dismiss it.
              className="fixed inset-0 z-40 bg-black/50"
              onClick={closeMobile}
              aria-hidden="true"
            />
          )}
        </AnimatedPresence>
      )}

      {/* Sidebar */}
      <Animated
        ref={navRef}
        as="nav"
        preset="drawerStart"
        mode="toggle"
        // Only the mobile drawer slides. On desktop the sidebar sits in normal
        // flow, so it renders as a plain nav rather than being pinned at rest
        // by a transform that would capture `position: fixed` descendants.
        // Crossing the breakpoint therefore remounts the nav — deliberate; see
        // the render branches in `Animated` for why the alternative is worse.
        enabled={isMobileViewport}
        open={isMobileOpen}
        custom={isRtl}
        data-slot="sidebar"
        data-testid={testId}
        className={cn(
          'flex h-screen flex-col',
          'border-e border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
          // Mobile positioning (start-pinned; off-canvas direction flips in RTL)
          isMobileViewport && 'fixed start-0 top-0 z-50',
          // Desktop positioning. Collapsing animates `width`, which motion does
          // not drive, so this transition belongs on both paths — but scoped to
          // desktop, where width is the only thing that changes.
          !isMobileViewport &&
            'relative transition-[width,min-width] duration-300 ease-in-out',
          className
        )}
        // CSS path only, and only on mobile. `transition-transform` rather than
        // the `transition-all` this used to carry: `width` is set inline, and
        // animating it during the slide forces layout every frame, which is what
        // made the drawer stutter. Transforms alone stay on the compositor.
        fallbackClassName={cn(
          isMobileViewport && 'transition-transform duration-300 ease-in-out',
          isMobileViewport &&
            (isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full rtl:translate-x-full')
        )}
        style={{
          width,
          minWidth: width,
          ...style,
        }}
        aria-label="Main navigation"
      >
        {children}
      </Animated>
    </>
  );
}

// =============================================================================
// SidebarHeader Component
// =============================================================================

export interface SidebarHeaderProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show mobile close button (default: true) */
  showMobileClose?: boolean;
}

export function SidebarHeader({
  children,
  className,
  showMobileClose = true,
}: SidebarHeaderProps): React.JSX.Element {
  const { closeMobile, isMobileViewport, isCollapsed } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        'flex items-center border-b border-neutral-200 py-4 dark:border-neutral-700',
        showCollapsed ? 'justify-center px-2' : 'justify-between px-4',
        className
      )}
    >
      <div
        className={cn(
          'min-w-0',
          showCollapsed ? 'flex justify-center' : 'flex-1'
        )}
      >
        {children}
      </div>
      {showMobileClose && isMobileViewport && (
        <button
          onClick={closeMobile}
          // See the backdrop in `Sidebar`: `isMobileViewport` already gates
          // this, so a hardcoded `lg:hidden` would only ever contradict a
          // custom `mobileBreakpoint` and strip the drawer's close affordance.
          className="-me-2 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Close navigation"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// SidebarFooter Component
// =============================================================================

export interface SidebarFooterProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SidebarFooter({
  children,
  className,
}: SidebarFooterProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        'mt-auto border-t border-neutral-200 py-4 dark:border-neutral-700',
        showCollapsed ? 'flex justify-center px-2' : 'px-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// SidebarContent Component (scrollable area)
// =============================================================================

export interface SidebarContentProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SidebarContent({
  children,
  className,
}: SidebarContentProps): React.JSX.Element {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex-1 overflow-y-auto py-4', className)}
    >
      {children}
    </div>
  );
}

// =============================================================================
// SidebarNav Component
// =============================================================================

export interface SidebarNavProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SidebarNav({
  children,
  className,
}: SidebarNavProps): React.JSX.Element {
  return (
    <div data-slot="sidebar-nav" className={cn('space-y-1 px-2', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// SidebarNavGroup Component
// =============================================================================

export interface SidebarNavGroupProps {
  /** Group label */
  label: string;
  /** Group icon */
  icon?: ReactNode;
  /** Group items */
  children: ReactNode;
  /** Whether the group starts expanded (for controlled accordion) */
  defaultExpanded?: boolean;
  /** Group identifier for accordion behavior */
  groupId?: string;
  /** Additional CSS classes */
  className?: string;
  /**
   * Keep items mounted when the group is collapsed, hidden via `hidden`.
   *
   * For groups whose children own DOM state that a remount would destroy —
   * uncontrolled inputs, media playback position, an editor instance — or that
   * need to stay findable by in-page search.
   *
   * Mirrors `CollapsibleContent`'s prop of the same name, and carries the same
   * caveat: this path does **not** animate. `hidden` is `display: none`, which
   * an animated height cannot run through, and dropping it for the duration
   * would let keyboard users tab into content that is visually collapsed. Not
   * animating is the safe answer until `hidden` can be sequenced around the
   * animation.
   */
  forceMount?: boolean;
}

export function SidebarNavGroup({
  label,
  icon,
  children,
  defaultExpanded = false,
  groupId,
  className,
  forceMount,
}: SidebarNavGroupProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport, expandedGroup, toggleGroup } =
    useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;
  const prefersReducedMotion = usePrefersReducedMotion();

  const contentId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Determine if this group is expanded
  const isExpanded = groupId ? expandedGroup === groupId : defaultExpanded;

  // Local state for uncontrolled behavior
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const effectiveExpanded = groupId ? isExpanded : localExpanded;

  /*
   * Collapsing unmounts the panel, which destroys whatever inside it had focus.
   * Left alone, focus falls back to `<body>` and the next Tab restarts from the
   * top of the document — a silent loss of keyboard position.
   *
   * Reachable without the user doing anything unusual: in `groupId` accordion
   * mode, expanding one group collapses its siblings, so focus parked in a
   * sibling evaporates on a click the user made somewhere else entirely.
   *
   * Whether focus was inside has to be recorded *before* the collapse. By the
   * time an effect can observe it, React has already removed the focused node
   * and `activeElement` is `<body>`, so a check made there always answers "no"
   * and the restore never fires.
   *
   * Two recorders, because neither covers both cases:
   *
   * - `captureFocusInside()` runs synchronously in the toggle handler, before
   *   the state change. This is the common path and it depends on nothing but
   *   `document.activeElement`, so it still works where focus events do not
   *   fire at all — an unfocused window, which is also what most automated
   *   browsers run in.
   * - the `focusin` listener covers collapses this component did not initiate,
   *   where there is no handler to hook: an accordion sibling opening, or a
   *   controlled `groupId` changing underneath it.
   */
  const focusWasInsideRef = useRef(false);

  const captureFocusInside = useCallback(() => {
    const active = document.activeElement;
    focusWasInsideRef.current =
      active !== triggerRef.current &&
      groupRef.current?.contains(active) === true;
  }, []);

  useEffect(() => {
    if (!effectiveExpanded) return;

    function trackFocus(event: FocusEvent) {
      const target = event.target as Node | null;
      focusWasInsideRef.current =
        target !== triggerRef.current &&
        groupRef.current?.contains(target) === true;
    }

    document.addEventListener('focusin', trackFocus);
    return () => document.removeEventListener('focusin', trackFocus);
  }, [effectiveExpanded]);

  useEffect(() => {
    if (effectiveExpanded || forceMount) return;
    if (focusWasInsideRef.current) {
      focusWasInsideRef.current = false;
      triggerRef.current?.focus();
    }
  }, [effectiveExpanded, forceMount]);

  const handleToggle = useCallback(() => {
    captureFocusInside();
    if (groupId) {
      toggleGroup(groupId);
    } else {
      setLocalExpanded((prev) => !prev);
    }
  }, [captureFocusInside, groupId, toggleGroup]);

  const items = <div className="mt-1 ps-2">{children}</div>;

  return (
    <div
      ref={groupRef}
      data-slot="sidebar-nav-group"
      className={cn('mb-2', className)}
    >
      {/* Group Header */}
      <button
        ref={triggerRef}
        data-slot="sidebar-nav-group-button"
        onClick={handleToggle}
        aria-expanded={showCollapsed ? undefined : effectiveExpanded}
        aria-controls={showCollapsed ? undefined : contentId}
        className={cn(
          'flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold',
          'text-neutral-700 dark:text-neutral-300',
          'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
          showCollapsed && 'justify-center'
        )}
        title={showCollapsed ? label : undefined}
        aria-label={showCollapsed ? label : undefined}
      >
        {icon && (
          <span
            className={cn(
              'text-muted-foreground h-5 w-5 flex-shrink-0',
              !showCollapsed && 'me-3'
            )}
          >
            {icon}
          </span>
        )}
        <AnimatedPresence initial={false}>
          {!showCollapsed && (
            <Animated
              key="label"
              as="span"
              preset="sidebarLabel"
              mode="presence"
              className="flex-1 truncate text-start"
            >
              {label}
            </Animated>
          )}
          {!showCollapsed && (
            <Animated
              key="chevron"
              as="span"
              preset="sidebarLabel"
              mode="presence"
              className={cn(
                'ms-2 flex-shrink-0 transition-transform duration-200',
                effectiveExpanded && 'rotate-180'
              )}
            >
              <ChevronDownIcon />
            </Animated>
          )}
        </AnimatedPresence>
      </button>

      {/* Group Items */}
      {!showCollapsed &&
        (forceMount ? (
          <div
            id={contentId}
            data-slot="sidebar-nav-group-items"
            data-state={effectiveExpanded ? 'open' : 'closed'}
            hidden={!effectiveExpanded}
          >
            {items}
          </div>
        ) : (
          <AnimatedPresence initial={false}>
            {effectiveExpanded && (
              <Animated
                key="items"
                id={contentId}
                data-slot="sidebar-nav-group-items"
                data-state="open"
                preset="collapse"
                mode="presence"
                /*
                 * `collapse` animates height, which `MotionConfig
                 * reducedMotion="user"` does not treat as a transform or layout
                 * animation and so leaves running. Honouring the preference is
                 * the component's job here.
                 */
                enabled={!prefersReducedMotion}
                /*
                 * Required by the preset — without it the items spill past the
                 * box while its height is still travelling. The group's own
                 * `mt-1` lives on the inner wrapper so the margin collapses
                 * with the height instead of surviving it.
                 */
                className="overflow-hidden"
              >
                {items}
              </Animated>
            )}
          </AnimatedPresence>
        ))}
    </div>
  );
}

// =============================================================================
// SidebarNavItem Component
// =============================================================================

export interface SidebarNavItemProps {
  /** Item label */
  label: string;
  /** Item icon */
  icon?: ReactNode;
  /** Whether this item is currently active */
  isActive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Optional href for link items */
  href?: string;
  /** Badge content (number or text) */
  badge?: ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function SidebarNavItem({
  label,
  icon,
  isActive = false,
  onClick,
  href,
  badge,
  disabled = false,
  className,
  'data-testid': testId,
}: SidebarNavItemProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport, closeMobile } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
    // Close mobile sidebar on navigation
    if (isMobileViewport) {
      closeMobile();
    }
  }, [disabled, onClick, isMobileViewport, closeMobile]);

  const content = (
    <>
      {icon && (
        <span
          className={cn(
            'h-5 w-5 flex-shrink-0',
            isActive
              ? 'text-primary-800 dark:text-primary-400'
              : 'text-muted-foreground',
            !showCollapsed && 'me-3'
          )}
        >
          {icon}
        </span>
      )}
      {/*
        Labels fade out rather than vanishing on the frame the rail starts
        collapsing. The accessible name is unaffected: once collapsed the
        control carries `aria-label`, which takes precedence over text content,
        so a label still finishing its exit is never read twice.

        `initial={false}` because this animates a *state change*, not arrival.
        Without it every label fades up on first paint, which makes the whole
        sidebar look like it is loading and leaves the text mid-transparency
        while assistive tooling and contrast checks are reading it.
      */}
      <AnimatedPresence initial={false}>
        {!showCollapsed && (
          <Animated
            key="label"
            as="span"
            preset="sidebarLabel"
            mode="presence"
            className="flex-1 truncate text-start"
          >
            {label}
          </Animated>
        )}
        {!showCollapsed && badge && (
          <Animated
            key="badge"
            as="span"
            preset="sidebarLabel"
            mode="presence"
            className={cn(
              'ms-2 rounded-full px-2 py-0.5 text-xs font-medium',
              isActive
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
            )}
          >
            {badge}
          </Animated>
        )}
      </AnimatedPresence>
    </>
  );

  const baseClasses = cn(
    'flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors',
    isActive
      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 font-medium'
      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
    disabled && 'opacity-50 cursor-not-allowed',
    showCollapsed && 'justify-center',
    className
  );

  if (href && !disabled) {
    return (
      <a
        data-slot="sidebar-nav-item"
        href={href}
        onClick={handleClick}
        data-testid={testId}
        className={baseClasses}
        title={showCollapsed ? label : undefined}
        aria-label={showCollapsed ? label : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      data-slot="sidebar-nav-item"
      onClick={handleClick}
      disabled={disabled}
      data-testid={testId}
      className={baseClasses}
      title={showCollapsed ? label : undefined}
      aria-label={showCollapsed ? label : undefined}
    >
      {content}
    </button>
  );
}

// =============================================================================
// SidebarToggle Component
// =============================================================================

export interface SidebarToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Position of the toggle (default: 'inline') */
  position?: 'inline' | 'floating';
}

export function SidebarToggle({
  className,
  position = 'inline',
}: SidebarToggleProps): React.JSX.Element {
  const { isCollapsed, toggleCollapsed, isMobileViewport } = useSidebar();

  // Don't render on mobile
  if (isMobileViewport) return <></>;

  const button = (
    <button
      onClick={toggleCollapsed}
      className={cn(
        'text-muted-foreground rounded-lg p-2',
        'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'focus:ring-primary-500 focus:ring-2 focus:outline-none',
        className
      )}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </button>
  );

  if (position === 'floating') {
    return (
      <div className="absolute -end-3 top-6 z-10 rounded-full border border-neutral-200 bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-900">
        {button}
      </div>
    );
  }

  return button;
}

// =============================================================================
// SidebarMobileToggle Component
// =============================================================================

export interface SidebarMobileToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Custom icon */
  icon?: ReactNode;
}

export function SidebarMobileToggle({
  className,
  icon,
}: SidebarMobileToggleProps): React.JSX.Element {
  const { openMobile, isMobileViewport } = useSidebar();

  // Don't render on desktop
  if (!isMobileViewport) return <></>;

  return (
    <button
      onClick={openMobile}
      className={cn(
        'text-muted-foreground rounded-lg p-2',
        'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'focus:ring-primary-500 focus:ring-2 focus:outline-none',
        className
      )}
      aria-label="Open navigation"
    >
      {icon ?? <MenuIcon />}
    </button>
  );
}

// =============================================================================
// SidebarSearch Component
// =============================================================================

export interface SidebarSearchProps {
  /** Search query value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Keyboard shortcut hint */
  shortcutHint?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function SidebarSearch({
  value,
  onChange,
  placeholder = 'Search...',
  shortcutHint = '/',
  className,
  'data-testid': testId = 'sidebar-search',
}: SidebarSearchProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport, setCollapsed } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);
  const showCollapsed = !isMobileViewport && isCollapsed;

  // Global keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        // Expand sidebar if collapsed
        if (showCollapsed) {
          setCollapsed(false);
          setTimeout(() => inputRef.current?.focus(), 350);
        } else {
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCollapsed, setCollapsed]);

  // Don't render when collapsed
  if (showCollapsed) return <></>;

  return (
    <div data-slot="sidebar-search" className={cn('px-3 py-2', className)}>
      <div className="relative">
        <div className="absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${placeholder} (${shortcutHint})`}
          data-testid={testId}
          className={cn(
            'w-full rounded-lg py-2 ps-10 pe-4 text-sm',
            'border-transparent bg-neutral-100 dark:bg-neutral-800',
            'text-neutral-900 placeholder-neutral-400 dark:text-white dark:placeholder-neutral-500',
            'focus:ring-primary-500 focus:bg-white focus:ring-2 focus:outline-none dark:focus:bg-neutral-700',
            'transition-colors'
          )}
        />
      </div>
    </div>
  );
}
