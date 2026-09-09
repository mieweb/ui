'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '../Sheet';
import { Switch } from '../Switch';
import { Button } from '../Button';

// =============================================================================
// Types
// =============================================================================

/** Catalog metadata for a widget a user can show or hide on a dashboard. */
export interface WidgetDefinition {
  /** Matches the portlet's `PortletItem.id`. */
  id: string;
  title: string;
  description?: string;
  /** Small leading icon, e.g. `<Activity className="h-4 w-4" />`. */
  icon?: React.ReactNode;
  /** Widgets sharing a category are grouped under a heading. */
  category?: string;
}

export interface DashboardCustomizePanelProps {
  /** Whether the panel is open. */
  open: boolean;
  /** Callback when the panel should open or close. */
  onOpenChange: (open: boolean) => void;
  /** The full widget catalog for this dashboard. */
  widgets: WidgetDefinition[];
  /** Ids of widgets currently hidden. */
  hiddenIds: string[];
  /** Called when a widget is shown (`visible: true`) or hidden. */
  onToggleWidget: (id: string, visible: boolean) => void;
  /** When provided, renders a "Reset layout" action in the footer. */
  onReset?: () => void;
  /** Panel heading (default "Customize dashboard"). */
  title?: string;
  /** Supporting copy under the heading. */
  description?: string;
}

// =============================================================================
// DashboardCustomizePanel
// =============================================================================

/**
 * A slide-in panel listing a dashboard's widget catalog with show/hide
 * toggles, grouped by category, plus an optional layout reset.
 *
 * Used automatically by `CustomizableDashboard` when its `widgets` prop is
 * set, and exported standalone for hosts that render their own trigger or
 * persist visibility elsewhere.
 *
 * @example
 * ```tsx
 * <DashboardCustomizePanel
 *   open={open}
 *   onOpenChange={setOpen}
 *   widgets={WIDGETS}
 *   hiddenIds={hidden}
 *   onToggleWidget={(id, visible) =>
 *     setHidden((prev) =>
 *       visible ? prev.filter((h) => h !== id) : [...prev, id]
 *     )
 *   }
 * />
 * ```
 */
export function DashboardCustomizePanel({
  open,
  onOpenChange,
  widgets,
  hiddenIds,
  onToggleWidget,
  onReset,
  title = 'Customize dashboard',
  description = 'Choose which widgets appear on this dashboard. Drag a widget by its handle to rearrange it.',
}: DashboardCustomizePanelProps) {
  const hidden = React.useMemo(() => new Set(hiddenIds), [hiddenIds]);

  const groups = React.useMemo(() => {
    const map = new Map<string, WidgetDefinition[]>();
    for (const w of widgets) {
      const key = w.category ?? '';
      const list = map.get(key);
      if (list) list.push(w);
      else map.set(key, [w]);
    }
    return Array.from(map.entries());
  }, [widgets]);

  const visibleCount = widgets.length - hidden.size;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      aria-label={title}
    >
      <SheetHeader>
        <div className="flex flex-col gap-1.5">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </div>
      </SheetHeader>
      <SheetBody className="flex flex-col gap-5">
        <p className="text-muted-foreground text-xs font-medium">
          {visibleCount} of {widgets.length} widgets shown
        </p>
        {groups.map(([category, items]) => (
          <div key={category || 'general'} className="flex flex-col gap-1">
            {category && (
              <h3 className="text-muted-foreground pb-1 text-xs font-semibold tracking-wide uppercase">
                {category}
              </h3>
            )}
            <ul className="flex list-none flex-col gap-1 p-0">
              {items.map((widget) => {
                const isVisible = !hidden.has(widget.id);
                return (
                  <li
                    key={widget.id}
                    className={cn(
                      'border-border flex items-center gap-3 rounded-lg border p-3 transition-colors',
                      isVisible ? 'bg-card' : 'bg-muted/50'
                    )}
                  >
                    {widget.icon && (
                      <span
                        className={cn(
                          'shrink-0',
                          isVisible
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {widget.icon}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={cn(
                          'truncate text-sm font-medium',
                          isVisible
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {widget.title}
                      </span>
                      {widget.description && (
                        <span className="text-muted-foreground truncate text-xs">
                          {widget.description}
                        </span>
                      )}
                    </span>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(checked) =>
                        onToggleWidget(widget.id, checked)
                      }
                      aria-label={`Show ${widget.title}`}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </SheetBody>
      {onReset && (
        <SheetFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw aria-hidden="true" className="h-4 w-4" />}
          >
            Reset layout
          </Button>
        </SheetFooter>
      )}
    </Sheet>
  );
}
