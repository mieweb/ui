import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  useScrollSpy,
  type UseScrollSpyOptions,
} from '../../hooks/useScrollSpy';

// =============================================================================
// Types
// =============================================================================

export interface TocItem {
  /** Element ID to scroll to */
  id: string;
  /** Display title */
  title: string;
  /** Heading depth (1–6). Controls indentation. */
  level: number;
  /** Nested children (for tree rendering) */
  children?: TocItem[];
}

export interface TableOfContentsProps {
  /** Manual list of TOC items. If omitted, auto-generates from headings. */
  items?: TocItem[];
  /**
   * CSS selector for headings to auto-discover (e.g. 'h2, h3, h4').
   * Only used when `items` is not provided.
   * @default 'h2, h3'
   */
  selector?: string;
  /**
   * Ref to the scrollable content container.
   * Used for both auto-discovery and scroll-spy observation.
   */
  contentRef?: React.RefObject<HTMLElement | null>;
  /** Controlled active item ID. Overrides internal scroll-spy. */
  activeId?: string;
  /** Callback when the active item changes via scroll-spy */
  onActiveChange?: (id: string | null) => void;
  /**
   * Maximum heading depth to include (1–6).
   * @default 3
   */
  maxDepth?: number;
  /**
   * Pixel offset from top when scrolling to a section.
   * Useful for fixed headers.
   * @default 0
   */
  scrollOffset?: number;
  /** Use smooth scrolling when clicking links. @default true */
  smooth?: boolean;
  /** Title rendered above the TOC list */
  title?: string;
  /** Whether to show indentation lines connecting nested items. @default true */
  indentLines?: boolean;
  /** Hide the component when there are no items. @default true */
  hideWhenEmpty?: boolean;
  /** Additional scroll-spy options forwarded to useScrollSpy */
  scrollSpyOptions?: Omit<
    UseScrollSpyOptions,
    'selectors' | 'ids' | 'root' | 'enabled'
  >;
  /** Additional class name for the root element */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Auto-discover headings from a container element and build a flat TocItem list.
 */
function discoverHeadings(
  container: HTMLElement | Document,
  selector: string,
  maxDepth: number
): TocItem[] {
  const elements = Array.from(container.querySelectorAll(selector));
  const items: TocItem[] = [];

  for (const el of elements) {
    if (!el.id) continue;
    const tagLevel = parseInt(el.tagName.charAt(1), 10);
    if (isNaN(tagLevel) || tagLevel > maxDepth) continue;

    items.push({
      id: el.id,
      title: el.textContent?.trim() || el.id,
      level: tagLevel,
    });
  }

  return items;
}

/**
 * Nest a flat list of TocItems into a tree based on heading level.
 */
function nestItems(flat: TocItem[]): TocItem[] {
  if (flat.length === 0) return [];

  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const item of flat) {
    const node: TocItem = { ...item, children: [] };

    // Pop stack until we find a parent with a lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }

    stack.push(node);
  }

  return root;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Table of Contents with integrated scroll-spy.
 * Auto-discovers headings from the page or accepts manual items.
 * Highlights the currently visible section as the user scrolls.
 *
 * @example
 * ```tsx
 * // Auto-discover headings from the page
 * <TableOfContents title="On this page" />
 *
 * // With a specific content container
 * const ref = useRef<HTMLDivElement>(null);
 * <div ref={ref}><article>...</article></div>
 * <TableOfContents contentRef={ref} />
 *
 * // Manual items
 * <TableOfContents
 *   items={[
 *     { id: 'intro', title: 'Introduction', level: 2 },
 *     { id: 'setup', title: 'Setup', level: 2 },
 *     { id: 'install', title: 'Installation', level: 3 },
 *   ]}
 * />
 * ```
 */
export function TableOfContents({
  items: manualItems,
  selector = 'h2, h3',
  contentRef,
  activeId: controlledActiveId,
  onActiveChange,
  maxDepth = 3,
  scrollOffset = 0,
  smooth = true,
  title,
  indentLines = true,
  hideWhenEmpty = true,
  scrollSpyOptions,
  className,
}: TableOfContentsProps) {
  // -------------------------------------------------------------------------
  // Auto-discover headings
  // -------------------------------------------------------------------------
  const [discoveredItems, setDiscoveredItems] = React.useState<TocItem[]>([]);

  const flatItems = manualItems ?? discoveredItems;

  // Track contentRef.current so the effect re-runs when the ref attaches
  const contentEl = contentRef?.current ?? null;

  React.useEffect(() => {
    if (manualItems) return; // skip when items are provided manually

    const container = contentEl ?? document;

    function discover() {
      setDiscoveredItems(discoverHeadings(container, selector, maxDepth));
    }

    // Initial discovery
    discover();

    // Re-discover on DOM mutations (handles dynamically rendered content)
    const observer = new MutationObserver(discover);
    const target = container instanceof HTMLElement ? container : document.body;
    observer.observe(target, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [manualItems, selector, maxDepth, contentEl]);

  // -------------------------------------------------------------------------
  // Scroll spy
  // -------------------------------------------------------------------------
  const ids = React.useMemo(() => flatItems.map((i) => i.id), [flatItems]);
  const isControlled = controlledActiveId !== undefined;

  const { activeId: spyActiveId } = useScrollSpy({
    ids,
    root: contentRef,
    enabled: !isControlled && ids.length > 0,
    ...scrollSpyOptions,
  });

  const activeId = isControlled ? controlledActiveId : spyActiveId;

  // Notify parent of active changes from spy
  React.useEffect(() => {
    if (!isControlled && onActiveChange) {
      onActiveChange(spyActiveId);
    }
  }, [spyActiveId, isControlled, onActiveChange]);

  // -------------------------------------------------------------------------
  // Click handler
  // -------------------------------------------------------------------------
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      // Allow Cmd/Ctrl+Click and other modified clicks to behave normally
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      e.preventDefault();
      const target = document.getElementById(id);
      if (!target) return;

      const scrollContainer = contentEl;
      const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';

      if (scrollContainer) {
        const top =
          target.getBoundingClientRect().top -
          scrollContainer.getBoundingClientRect().top +
          scrollContainer.scrollTop -
          scrollOffset;

        scrollContainer.scrollTo({ top, behavior });
      } else {
        const top =
          target.getBoundingClientRect().top + window.scrollY - scrollOffset;

        window.scrollTo({ top, behavior });
      }

      // Update URL hash without scrolling again
      window.history.pushState(null, '', `#${id}`);
    },
    [contentEl, scrollOffset, smooth]
  );

  // -------------------------------------------------------------------------
  // Build tree
  // -------------------------------------------------------------------------
  const tree = React.useMemo(() => nestItems(flatItems), [flatItems]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (hideWhenEmpty && tree.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className={cn('text-sm', className)}>
      {title && <p className="text-foreground mb-3 font-semibold">{title}</p>}
      <TocList
        items={tree}
        activeId={activeId}
        onClickItem={handleClick}
        depth={0}
        indentLines={indentLines}
      />
    </nav>
  );
}

// =============================================================================
// TocList (recursive renderer)
// =============================================================================

interface TocListProps {
  items: TocItem[];
  activeId: string | null;
  onClickItem: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
  depth: number;
  indentLines: boolean;
}

function TocList({
  items,
  activeId,
  onClickItem,
  depth,
  indentLines,
}: TocListProps) {
  return (
    <ul
      className={cn(
        'space-y-1',
        depth > 0 && indentLines && 'border-border ml-3 border-l pl-3',
        depth > 0 && !indentLines && 'ml-4'
      )}
    >
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => onClickItem(e, item.id)}
            aria-current={activeId === item.id ? 'location' : undefined}
            className={cn(
              'block rounded-sm px-2 py-1 transition-colors duration-150',
              'hover:text-foreground',
              activeId === item.id
                ? 'text-primary font-medium'
                : 'text-muted-foreground'
            )}
          >
            {item.title}
          </a>
          {item.children && item.children.length > 0 && (
            <TocList
              items={item.children}
              activeId={activeId}
              onClickItem={onClickItem}
              depth={depth + 1}
              indentLines={indentLines}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
