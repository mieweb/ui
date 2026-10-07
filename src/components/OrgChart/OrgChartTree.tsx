'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { GroupPill } from './OrgChartCanvas';
import type {
  OrgChartClassNames,
  OrgChartLabels,
  OrgChartNodeContext,
  OrgChartRenderSlots,
} from './shared';
import { childrenOf, type OrgForest, type VisibleNode } from './tree';

export interface OrgChartTreeProps extends Pick<
  OrgChartRenderSlots,
  'renderBadges'
> {
  forest: OrgForest;
  visible: VisibleNode[];
  nodeContext: (v: VisibleNode) => OrgChartNodeContext;
  selectedId: string | null;
  labels: OrgChartLabels;
  classNames?: OrgChartClassNames;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

/**
 * The chart as a WAI-ARIA tree: a flat list of treeitems carrying
 * `aria-level` / `aria-setsize` / `aria-posinset`, with one roving tab stop.
 */
export function OrgChartTree({
  forest,
  visible,
  nodeContext,
  selectedId,
  labels,
  classNames,
  renderBadges,
  onToggle,
  onSelect,
}: OrgChartTreeProps) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const items = React.useRef(new Map<string, HTMLElement>());
  const [activeId, setActiveId] = React.useState<string | null>(selectedId);
  const active =
    activeId && visible.some((v) => v.node.id === activeId)
      ? activeId
      : (visible[0]?.node.id ?? null);

  const move = (id: string | undefined) => {
    if (!id) return;
    setActiveId(id);
    items.current.get(id)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const index = visible.findIndex((v) => v.node.id === active);
    if (index < 0) return;
    const current = visible[index];
    const id = current.node.id;
    const hasKids = childrenOf(forest, id).length > 0;
    const expanded = nodeContext(current).expanded;
    const rtl =
      !!listRef.current &&
      getComputedStyle(listRef.current).direction === 'rtl';
    let key = e.key;
    if (rtl && key === 'ArrowLeft') key = 'ArrowRight';
    else if (rtl && key === 'ArrowRight') key = 'ArrowLeft';

    switch (key) {
      case 'ArrowDown':
        move(visible[index + 1]?.node.id);
        break;
      case 'ArrowUp':
        move(visible[index - 1]?.node.id);
        break;
      case 'Home':
        move(visible[0]?.node.id);
        break;
      case 'End':
        move(visible[visible.length - 1]?.node.id);
        break;
      case 'ArrowRight':
        if (hasKids && !expanded) onToggle(id);
        else if (hasKids) move(childrenOf(forest, id)[0]?.id);
        break;
      case 'ArrowLeft':
        if (hasKids && expanded) onToggle(id);
        else move(forest.parentOf.get(id) ?? undefined);
        break;
      case 'Enter':
      case ' ':
        onSelect(id);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <ul
      ref={listRef}
      role="tree"
      aria-label={labels.tree}
      data-slot="org-chart-tree"
      className={cn('max-h-[560px] overflow-auto p-2', classNames?.tree)}
    >
      {visible.map((v) => {
        const { node } = v;
        const ctx = nodeContext(v);
        const parent = forest.parentOf.get(node.id);
        const siblings =
          parent != null ? childrenOf(forest, parent) : forest.roots;
        const Chevron = ctx.expanded ? ChevronDown : ChevronRight;
        const secondary = ctx.variant === 'person' ? node.title : node.subtitle;
        return (
          <li
            key={node.id}
            ref={(el) => {
              if (el) items.current.set(node.id, el);
              else items.current.delete(node.id);
            }}
            role="treeitem"
            aria-level={v.depth + 1}
            aria-setsize={siblings.length}
            aria-posinset={siblings.indexOf(node) + 1}
            aria-expanded={ctx.directReports > 0 ? ctx.expanded : undefined}
            aria-selected={node.id === selectedId}
            aria-current={ctx.highlighted || undefined}
            tabIndex={node.id === active ? 0 : -1}
            data-slot="org-chart-tree-item"
            data-matched={ctx.matched || undefined}
            onFocus={() => setActiveId(node.id)}
            onKeyDown={onKeyDown}
            onClick={(e) => {
              setActiveId(node.id);
              const onChevron = (e.target as HTMLElement).closest(
                '[data-slot="org-chart-tree-toggle"]'
              );
              if (onChevron && ctx.directReports > 0) onToggle(node.id);
              else onSelect(node.id);
            }}
            style={{ paddingInlineStart: `${v.depth * 1.25 + 0.25}rem` }}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md py-1.5 pe-2 text-sm',
              'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              node.id === selectedId && 'bg-primary-500/10',
              ctx.matched && 'ring-ring ring-1',
              ctx.dimmed && 'opacity-50',
              classNames?.treeItem
            )}
          >
            <span
              aria-hidden="true"
              data-slot="org-chart-tree-toggle"
              className="text-muted-foreground flex size-5 shrink-0 items-center justify-center"
            >
              {ctx.directReports > 0 && (
                <Chevron className="size-4 rtl:-scale-x-100" />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
              <span className="text-foreground font-medium">{node.name}</span>
              {secondary && (
                <span className="text-muted-foreground text-xs">
                  {secondary}
                </span>
              )}
            </span>
            {ctx.highlighted && (
              <span className="bg-primary-600 rounded-full px-1.5 text-[10px] font-bold text-white uppercase">
                {labels.highlighted}
              </span>
            )}
            {renderBadges?.(node)}
            {node.group && <GroupPill group={node.group} accent={ctx.accent} />}
            {ctx.directReports > 0 && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {ctx.directReports}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
