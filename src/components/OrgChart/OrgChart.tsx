'use client';

import * as React from 'react';
import {
  ExternalLink,
  FoldVertical,
  Map as MapIcon,
  Maximize,
  Minimize,
  Network,
  List,
  Scan,
  Search,
  UnfoldVertical,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Spinner } from '../Spinner';
import { OrgChartCanvas, GroupPill } from './OrgChartCanvas';
import { OrgChartTree } from './OrgChartTree';
import type { OrgChartDirection } from './layout';
import {
  defaultOrgChartLabels,
  ORG_CHART_GROUP_ACCENTS,
  type OrgChartAccent,
  type OrgChartClassNames,
  type OrgChartDetailContext,
  type OrgChartLabels,
  type OrgChartNodeContext,
  type OrgChartNodeVariant,
  type OrgChartRenderSlots,
  type OrgChartView,
} from './shared';
import {
  allExpandable,
  ancestorsOf,
  buildOrgForest,
  childrenOf,
  distinctGroups,
  initialExpanded,
  matchesQuery,
  visibleNodes,
  type OrgChartNode,
  type OrgForest,
  type VisibleNode,
} from './tree';

export interface OrgChartProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'>,
    OrgChartRenderSlots {
  /** The collection. The caller owns fetching it; order sets sibling order. */
  nodes: readonly OrgChartNode[];
  loading?: boolean;
  error?: Error | null;
  /** Retries a failed load. The retry action renders only when given. */
  onRetry?: () => void;
  /** `person`: avatar + name + title. `location`: icon + name + subtitle. */
  nodeVariant?: OrgChartNodeVariant;
  /** Layout direction of the chart. */
  direction?: OrgChartDirection;
  /** Levels shown on first render, counted from each root. */
  initialDepth?: number;
  /** Expanded into view and framed (e.g. the record the page is about). */
  focusId?: string | null;
  /** Expanded into view and marked (e.g. the signed-in user). */
  highlightedId?: string | null;
  /** Initial search text. */
  defaultQuery?: string;
  /** Initial group filter. */
  defaultGroup?: string;
  /** Controlled view. */
  view?: OrgChartView;
  /** Uncontrolled initial view. Defaults to `list` below 640px, else `chart`. */
  defaultView?: OrgChartView;
  onViewChange?: (view: OrgChartView) => void;
  defaultShowMinimap?: boolean;
  /** Colour per group as a token name. Defaults to `ORG_CHART_GROUP_ACCENTS`. */
  getGroupAccent?: (group: string, index: number) => OrgChartAccent;
  /** Called when a node is selected (details opened) or deselected. */
  onSelect?: (id: string | null, node: OrgChartNode | null) => void;
  /** Called by the detail panel's Open action. */
  onOpen?: (id: string, node: OrgChartNode) => void;
  /** Renders the Open action as a real link. */
  getHref?: (id: string, node: OrgChartNode) => string;
  /** Replaces the detail panel's body. */
  renderDetail?: (
    node: OrgChartNode,
    ctx: OrgChartDetailContext
  ) => React.ReactNode;
  /** Replaces the built-in empty state. */
  emptyState?: React.ReactNode;
  labels?: Partial<OrgChartLabels>;
  classNames?: OrgChartClassNames;
}

const isNarrow = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(max-width: 639px)').matches;

const union = (a: ReadonlySet<string>, ids: Iterable<string>) => {
  let out: Set<string> | null = null;
  for (const id of ids) {
    if (a.has(id)) continue;
    out ??= new Set(a);
    out.add(id);
  }
  return out ?? a;
};

const ancestorsOfAll = (forest: OrgForest, ids: Iterable<string>) => {
  const out: string[] = [];
  for (const id of ids) out.push(...ancestorsOf(forest, id));
  return out;
};

/**
 * Declared `parameters.catalog.collection` — loading, empty and error are part
 * of the API.
 */
export const OrgChart = React.forwardRef<HTMLDivElement, OrgChartProps>(
  function OrgChart(
    {
      nodes,
      loading = false,
      error = null,
      onRetry,
      nodeVariant = 'person',
      direction = 'DOWN',
      initialDepth = 2,
      focusId = null,
      highlightedId = null,
      defaultQuery = '',
      defaultGroup = '',
      view: viewProp,
      defaultView,
      onViewChange,
      defaultShowMinimap = false,
      getGroupAccent,
      onSelect,
      onOpen,
      getHref,
      renderNode,
      renderBadges,
      renderDetail,
      emptyState,
      labels: labelsProp,
      classNames,
      className,
      ...rest
    },
    ref
  ) {
    const labels = React.useMemo(
      () => ({ ...defaultOrgChartLabels, ...labelsProp }),
      [labelsProp]
    );
    const rootRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);
    const searchId = React.useId();

    const forest = React.useMemo(() => buildOrgForest(nodes), [nodes]);
    const groups = React.useMemo(() => distinctGroups(nodes), [nodes]);
    const accentOf = React.useMemo(() => {
      const map = new Map<string, OrgChartAccent>();
      groups.forEach((g, i) =>
        map.set(
          g,
          getGroupAccent?.(g, i) ??
            ORG_CHART_GROUP_ACCENTS[i % ORG_CHART_GROUP_ACCENTS.length]
        )
      );
      return map;
    }, [groups, getGroupAccent]);

    // --- state -------------------------------------------------------------
    const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(() =>
      union(
        initialExpanded(forest, initialDepth),
        ancestorsOfAll(
          forest,
          [focusId, highlightedId].filter((id): id is string => !!id)
        )
      )
    );
    const seeded = React.useRef(forest.byId.size > 0);
    const [query, setQuery] = React.useState(defaultQuery);
    const [groupState, setGroup] = React.useState(defaultGroup);
    // A group that isn't in `nodes` (stale default, removed on refresh) means no filter.
    const group = groupState && groups.includes(groupState) ? groupState : '';
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [viewState, setViewState] = React.useState<OrgChartView>(
      () => defaultView ?? (isNarrow() ? 'list' : 'chart')
    );
    const view = viewProp ?? viewState;
    const [showMinimap, setShowMinimap] = React.useState(defaultShowMinimap);
    const [nativeFull, setNativeFull] = React.useState(false);
    const [pseudoFull, setPseudoFull] = React.useState(false);
    const fullscreen = nativeFull || pseudoFull;
    const [fitRequest, setFitRequest] = React.useState(0);
    const returnFocus = React.useRef<HTMLElement | null>(null);

    // Seed once data arrives, so a loading → loaded transition still opens
    // `initialDepth` levels.
    React.useEffect(() => {
      if (seeded.current || forest.byId.size === 0) return;
      seeded.current = true;
      setExpanded((prev) => union(prev, initialExpanded(forest, initialDepth)));
    }, [forest, initialDepth]);

    React.useEffect(() => {
      const ids = [focusId, highlightedId].filter(
        (id): id is string => !!id && forest.byId.has(id)
      );
      if (ids.length)
        setExpanded((prev) => union(prev, ancestorsOfAll(forest, ids)));
    }, [forest, focusId, highlightedId]);

    const matches = React.useMemo(() => {
      if (!query.trim()) return null;
      const out: string[] = [];
      for (const n of forest.byId.values())
        if (matchesQuery(n, query)) out.push(n.id);
      return out;
    }, [forest, query]);

    const groupMembers = React.useMemo(() => {
      if (!group) return null;
      const out: string[] = [];
      for (const n of forest.byId.values())
        if (n.group === group) out.push(n.id);
      return out;
    }, [forest, group]);

    const revealKey = JSON.stringify([matches, groupMembers]);
    React.useEffect(() => {
      const ids = [...(matches ?? []), ...(groupMembers ?? [])];
      if (ids.length)
        setExpanded((prev) => union(prev, ancestorsOfAll(forest, ids)));
      // revealKey stands in for the two arrays.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealKey, forest]);

    React.useEffect(() => {
      const onChange = () =>
        setNativeFull(
          !!rootRef.current && document.fullscreenElement === rootRef.current
        );
      document.addEventListener('fullscreenchange', onChange);
      return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    React.useEffect(() => {
      if (!pseudoFull) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPseudoFull(false);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [pseudoFull]);

    // --- derived -----------------------------------------------------------
    const visible = React.useMemo(
      () => visibleNodes(forest, expanded),
      [forest, expanded]
    );
    const matchSet = React.useMemo(() => new Set(matches ?? []), [matches]);
    const groupSet = React.useMemo(
      () => (groupMembers ? new Set(groupMembers) : null),
      [groupMembers]
    );

    const nodeContext = React.useCallback(
      (v: VisibleNode): OrgChartNodeContext => ({
        variant: nodeVariant,
        depth: v.depth,
        directReports: childrenOf(forest, v.node.id).length,
        expanded: expanded.has(v.node.id),
        highlighted: v.node.id === highlightedId,
        matched: matchSet.has(v.node.id),
        dimmed: !!groupSet && !groupSet.has(v.node.id),
        accent: v.node.group ? accentOf.get(v.node.group) : undefined,
      }),
      [
        nodeVariant,
        forest,
        expanded,
        highlightedId,
        matchSet,
        groupSet,
        accentOf,
      ]
    );

    const fitTargets = React.useMemo(() => {
      if (matches?.length) return matches;
      if (groupMembers?.length) return groupMembers;
      if (focusId && forest.byId.has(focusId)) return [focusId];
      return null;
    }, [matches, groupMembers, focusId, forest]);

    // --- actions -----------------------------------------------------------
    const toggle = React.useCallback((id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);

    const select = React.useCallback(
      (id: string | null) => {
        if (id && typeof document !== 'undefined')
          returnFocus.current = document.activeElement as HTMLElement | null;
        setSelectedId(id);
        onSelect?.(id, id ? (forest.byId.get(id) ?? null) : null);
      },
      [forest, onSelect]
    );

    const closeDetail = React.useCallback(() => {
      select(null);
      const el = returnFocus.current;
      if (el?.isConnected) el.focus();
    }, [select]);

    const setView = (v: OrgChartView) => {
      setViewState(v);
      onViewChange?.(v);
    };

    const toggleFullscreen = async () => {
      const el = rootRef.current;
      if (!el) return;
      if (fullscreen) {
        setPseudoFull(false);
        if (document.fullscreenElement) await document.exitFullscreen?.();
        return;
      }
      try {
        if (!el.requestFullscreen) throw new Error('unsupported');
        await el.requestFullscreen();
      } catch {
        setPseudoFull(true);
      }
    };

    // --- render ------------------------------------------------------------
    const stateBox = (content: React.ReactNode) => (
      <div
        data-slot="org-chart-state"
        className={cn(
          'text-muted-foreground flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm',
          classNames?.state
        )}
      >
        {content}
      </div>
    );

    let body: React.ReactNode;
    if (error) {
      body = stateBox(
        <>
          <p role="alert" className="text-destructive">
            {labels.error}
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              {labels.retry}
            </Button>
          )}
        </>
      );
    } else if (loading) {
      body = stateBox(
        <div role="status" className="flex items-center gap-2">
          <Spinner size="sm" />
          <span>{labels.loading}</span>
        </div>
      );
    } else if (forest.byId.size === 0) {
      body = stateBox(emptyState ?? <p>{labels.empty}</p>);
    }

    const selected = selectedId ? (forest.byId.get(selectedId) ?? null) : null;
    const detail = selected && (
      <DetailPanel
        key={selected.id}
        node={selected}
        forest={forest}
        variant={nodeVariant}
        accent={selected.group ? accentOf.get(selected.group) : undefined}
        labels={labels}
        className={classNames?.detail}
        onClose={closeDetail}
        onOpen={onOpen}
        getHref={getHref}
        renderDetail={renderDetail}
        renderBadges={renderBadges}
      />
    );

    const iconButton = (
      label: string,
      icon: React.ReactNode,
      onClick: () => void,
      pressed?: boolean
    ) => (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        aria-pressed={pressed}
        onClick={onClick}
        className={cn(pressed && 'bg-primary-500/10')}
      >
        {icon}
      </Button>
    );

    return (
      <div
        ref={rootRef}
        data-slot="org-chart"
        data-view={view}
        className={cn(
          'bg-card text-foreground border-border relative flex flex-col overflow-hidden rounded-lg border',
          fullscreen && 'bg-background',
          pseudoFull && 'fixed inset-0 z-50 rounded-none',
          className,
          classNames?.root
        )}
        {...rest}
      >
        {body ?? (
          <>
            <div
              role="toolbar"
              aria-label={labels.toolbar}
              data-slot="org-chart-toolbar"
              className={cn(
                'border-border flex flex-wrap items-center gap-2 border-b p-2',
                classNames?.toolbar
              )}
            >
              <div className="relative min-w-40 flex-1">
                <label htmlFor={searchId} className="sr-only">
                  {labels.search}
                </label>
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                />
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  placeholder={labels.searchPlaceholder}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border ps-8 pe-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
              </div>
              <p
                role="status"
                aria-live="polite"
                className="text-muted-foreground min-w-0 text-xs empty:hidden"
              >
                {matches ? labels.results(matches.length) : ''}
              </p>
              {groups.length > 0 && (
                <select
                  aria-label={labels.groupFilter}
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="border-border bg-background text-foreground focus-visible:ring-ring h-9 max-w-48 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  <option value="">{labels.allGroups}</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}
              <div className="ms-auto flex flex-wrap items-center gap-1">
                {iconButton(
                  labels.expandAll,
                  <UnfoldVertical aria-hidden="true" className="size-4" />,
                  () => setExpanded(allExpandable(forest))
                )}
                {iconButton(
                  labels.collapseAll,
                  <FoldVertical aria-hidden="true" className="size-4" />,
                  () => setExpanded(new Set())
                )}
                {view === 'chart' && (
                  <>
                    {iconButton(
                      labels.fitView,
                      <Scan aria-hidden="true" className="size-4" />,
                      () => setFitRequest((n) => n + 1)
                    )}
                    {iconButton(
                      labels.minimap,
                      <MapIcon aria-hidden="true" className="size-4" />,
                      () => setShowMinimap((v) => !v),
                      showMinimap
                    )}
                  </>
                )}
                {iconButton(
                  labels.fullscreen,
                  fullscreen ? (
                    <Minimize aria-hidden="true" className="size-4" />
                  ) : (
                    <Maximize aria-hidden="true" className="size-4" />
                  ),
                  () => void toggleFullscreen(),
                  fullscreen
                )}
                <div
                  role="group"
                  aria-label={labels.viewToggle}
                  className="border-border ms-1 flex rounded-md border p-0.5"
                >
                  {(
                    [
                      ['chart', labels.chartView, Network],
                      ['list', labels.listView, List],
                    ] as const
                  ).map(([v, label, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={cn(
                        'focus-visible:ring-ring flex h-7 items-center gap-1 rounded px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none',
                        view === v
                          ? 'bg-primary-500/10 text-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <Icon aria-hidden="true" className="size-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {view === 'chart' ? (
              <OrgChartCanvas
                forest={forest}
                visible={visible}
                nodeContext={nodeContext}
                focusId={focusId}
                direction={direction}
                variant={nodeVariant}
                showMinimap={showMinimap}
                fitTargets={fitTargets}
                fitRequest={fitRequest}
                labels={labels}
                classNames={
                  fullscreen
                    ? {
                        ...classNames,
                        canvas: cn(classNames?.canvas, 'h-auto flex-1'),
                      }
                    : classNames
                }
                renderNode={renderNode}
                renderBadges={renderBadges}
                onToggle={toggle}
                onSelect={select}
              >
                {detail}
              </OrgChartCanvas>
            ) : (
              <div className={cn('relative', fullscreen && 'flex-1')}>
                <OrgChartTree
                  forest={forest}
                  visible={visible}
                  nodeContext={nodeContext}
                  selectedId={selectedId}
                  labels={labels}
                  classNames={classNames}
                  renderBadges={renderBadges}
                  onToggle={toggle}
                  onSelect={select}
                />
                {detail}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

// =============================================================================
// Detail panel
// =============================================================================

interface DetailPanelProps extends Pick<OrgChartRenderSlots, 'renderBadges'> {
  node: OrgChartNode;
  forest: OrgForest;
  variant: OrgChartNodeVariant;
  accent?: OrgChartAccent;
  labels: OrgChartLabels;
  className?: string;
  onClose: () => void;
  onOpen?: OrgChartProps['onOpen'];
  getHref?: OrgChartProps['getHref'];
  renderDetail?: OrgChartProps['renderDetail'];
}

function DetailPanel({
  node,
  forest,
  variant,
  accent,
  labels,
  className,
  onClose,
  onOpen,
  getHref,
  renderDetail,
  renderBadges,
}: DetailPanelProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);
  React.useEffect(() => {
    closeRef.current = onClose;
  });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeRef.current();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  const directReports = childrenOf(forest, node.id).length;
  const orgSize = forest.orgSize.get(node.id) ?? 0;
  const parentId = forest.parentOf.get(node.id);
  const parent = parentId ? (forest.byId.get(parentId) ?? null) : null;
  const secondary = variant === 'person' ? node.title : node.subtitle;
  const href = getHref?.(node.id, node);

  const actionClass =
    'bg-primary-600 hover:bg-primary-700 focus-visible:ring-ring inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={node.name}
      tabIndex={-1}
      data-slot="org-chart-detail"
      className={cn(
        'bg-card text-foreground border-border absolute end-3 top-3 z-10 w-72 max-w-[calc(100%-1.5rem)] rounded-lg border p-4 shadow-lg focus:outline-none',
        className
      )}
    >
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        className="text-muted-foreground hover:bg-muted focus-visible:ring-ring absolute end-2 top-2 rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
      {renderDetail ? (
        renderDetail(node, { directReports, orgSize, parent, close: onClose })
      ) : (
        <div className="flex flex-col gap-3 pe-6">
          <div className="flex items-center gap-3">
            {variant === 'person' && (
              <Avatar src={node.avatarUrl} name={node.name} alt="" size="lg" />
            )}
            <div className="min-w-0">
              <p className="text-foreground font-semibold">{node.name}</p>
              {secondary && (
                <p className="text-muted-foreground text-sm">{secondary}</p>
              )}
            </div>
          </div>
          {(node.group || renderBadges) && (
            <div className="flex flex-wrap gap-1.5">
              {node.group && <GroupPill group={node.group} accent={accent} />}
              {renderBadges?.(node)}
            </div>
          )}
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            {parent && <li>{labels.reportsTo(parent.name)}</li>}
            <li>{labels.directReports(directReports)}</li>
            {orgSize > directReports && <li>{labels.orgSize(orgSize)}</li>}
          </ul>
          {href ? (
            <a
              href={href}
              className={cn(actionClass, 'self-start')}
              onClick={(e) => {
                if (
                  !onOpen ||
                  e.button !== 0 ||
                  e.metaKey ||
                  e.ctrlKey ||
                  e.shiftKey ||
                  e.altKey
                )
                  return;
                e.preventDefault();
                onOpen(node.id, node);
              }}
            >
              {labels.open}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          ) : (
            onOpen && (
              <button
                type="button"
                className={cn(actionClass, 'self-start')}
                onClick={() => onOpen(node.id, node)}
              >
                {labels.open}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
