'use client';

import * as React from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import {
  layoutOrgChart,
  type LayoutBox,
  type OrgChartDirection,
} from './layout';
import {
  accentClassesFor,
  type OrgChartAccent,
  type OrgChartClassNames,
  type OrgChartLabels,
  type OrgChartNodeContext,
  type OrgChartNodeVariant,
  type OrgChartRenderSlots,
} from './shared';
import type { OrgChartNode, OrgForest, VisibleNode } from './tree';

export const ORG_CHART_NODE_SIZE: Record<
  OrgChartNodeVariant,
  { width: number; height: number }
> = {
  person: { width: 248, height: 92 },
  location: { width: 248, height: 76 },
};

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

// =============================================================================
// Card body (shared with the detail panel)
// =============================================================================

export function GroupPill({
  group,
  accent,
}: {
  group: string;
  accent?: OrgChartAccent;
}) {
  const a = accentClassesFor(accent);
  return (
    <span
      className={cn(
        'text-foreground inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        a?.tint ?? 'bg-muted'
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-full', a?.marker)}
      />
      <span className="truncate">{group}</span>
    </span>
  );
}

export function NodeBody({
  node,
  variant,
  accent,
}: {
  node: OrgChartNode;
  variant: OrgChartNodeVariant;
  accent?: OrgChartAccent;
}) {
  const secondary = variant === 'person' ? node.title : node.subtitle;
  return (
    <>
      {variant === 'person' ? (
        <Avatar src={node.avatarUrl} name={node.name} alt="" size="md" />
      ) : (
        <span
          aria-hidden="true"
          className="bg-primary-500/10 text-primary-700 dark:text-primary-300 flex size-10 shrink-0 items-center justify-center rounded-md"
        >
          <Building2 className="size-5" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-foreground truncate text-sm font-semibold">
          {node.name}
        </span>
        {secondary && (
          <span className="text-muted-foreground truncate text-xs">
            {secondary}
          </span>
        )}
        {node.group && (
          <span className="mt-0.5 flex">
            <GroupPill group={node.group} accent={accent} />
          </span>
        )}
      </span>
    </>
  );
}

// =============================================================================
// Flow node
// =============================================================================

interface OrgFlowData extends Record<string, unknown> {
  node: OrgChartNode;
  ctx: OrgChartNodeContext;
  focused: boolean;
}

type OrgFlowNode = Node<OrgFlowData, 'org'>;

interface CanvasContextValue extends OrgChartRenderSlots {
  labels: OrgChartLabels;
  classNames?: OrgChartClassNames;
  horizontal: boolean;
  rtl: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

const CanvasContext = React.createContext<CanvasContextValue | null>(null);

const hiddenHandle: React.CSSProperties = { opacity: 0, pointerEvents: 'none' };

function OrgFlowNodeView({ data }: NodeProps<OrgFlowNode>) {
  const c = React.useContext(CanvasContext)!;
  const { node, ctx, focused } = data;
  const accent = accentClassesFor(ctx.accent);
  const start = c.horizontal
    ? c.rtl
      ? Position.Right
      : Position.Left
    : Position.Top;
  const end = c.horizontal
    ? c.rtl
      ? Position.Left
      : Position.Right
    : Position.Bottom;
  const Chevron = ctx.expanded ? ChevronDown : ChevronRight;

  return (
    <div
      data-slot="org-chart-node"
      data-highlighted={ctx.highlighted || undefined}
      data-matched={ctx.matched || undefined}
      // React Flow disables pointer events on unselectable, undraggable nodes.
      style={{ pointerEvents: 'auto' }}
      className={cn(
        'bg-card text-foreground relative h-full w-full rounded-lg border border-s-4 shadow-sm',
        'motion-safe:transition-[opacity,box-shadow]',
        accent?.border ?? 'border-border',
        (ctx.highlighted || focused) &&
          'ring-primary-500 ring-offset-background ring-2 ring-offset-2',
        ctx.matched && 'ring-ring ring-2',
        ctx.dimmed && 'opacity-40',
        c.classNames?.node
      )}
    >
      <Handle
        type="target"
        position={start}
        isConnectable={false}
        style={hiddenHandle}
      />
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => c.onSelect(node.id)}
        className="nodrag nopan focus-visible:ring-ring flex h-full w-full items-center gap-3 rounded-md px-3 text-start focus-visible:ring-2 focus-visible:outline-none"
      >
        {c.renderNode ? (
          c.renderNode(node, ctx)
        ) : (
          <NodeBody node={node} variant={ctx.variant} accent={ctx.accent} />
        )}
      </button>
      {(ctx.highlighted || c.renderBadges) && (
        <span className="absolute end-2 -top-2.5 flex gap-1">
          {ctx.highlighted && (
            <span className="bg-primary-600 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white uppercase shadow-sm">
              {c.labels.highlighted}
            </span>
          )}
          {c.renderBadges?.(node)}
        </span>
      )}
      {ctx.directReports > 0 && (
        <button
          type="button"
          aria-expanded={ctx.expanded}
          aria-label={
            ctx.expanded
              ? c.labels.collapse(node.name)
              : c.labels.expand(node.name, ctx.directReports)
          }
          onClick={() => c.onToggle(node.id)}
          className={cn(
            'nodrag nopan absolute z-10 flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full border px-1.5 text-[11px] font-semibold shadow-sm',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            c.horizontal
              ? '-end-3 top-1/2 -translate-y-1/2'
              : '-bottom-3 left-1/2 -translate-x-1/2',
            ctx.expanded
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-border bg-card text-foreground hover:border-primary-500'
          )}
        >
          <Chevron aria-hidden="true" className="size-3 rtl:-scale-x-100" />
          {ctx.directReports}
        </button>
      )}
      <Handle
        type="source"
        position={end}
        isConnectable={false}
        style={hiddenHandle}
      />
    </div>
  );
}

const nodeTypes = { org: OrgFlowNodeView };

// Brand tokens through xyflow's own variables, so both themes follow the brand.
const flowStyle = {
  '--xy-background-color': 'transparent',
  '--xy-background-pattern-color': 'var(--mieweb-border)',
  '--xy-edge-stroke': 'var(--mieweb-muted-foreground)',
  '--xy-edge-stroke-width': '1.25',
  '--xy-node-background-color': 'transparent',
  '--xy-node-border': 'none',
  '--xy-node-border-radius': '0.5rem',
  '--xy-node-boxshadow-hover': 'none',
  '--xy-node-boxshadow-selected': 'none',
  '--xy-node-color': 'inherit',
  '--xy-minimap-background-color': 'var(--mieweb-card)',
  '--xy-minimap-mask-background-color':
    'color-mix(in srgb, var(--mieweb-muted) 70%, transparent)',
  '--xy-minimap-node-background-color': 'var(--mieweb-muted-foreground)',
  '--xy-attribution-background-color': 'transparent',
} as React.CSSProperties;

// =============================================================================
// Canvas
// =============================================================================

export interface OrgChartCanvasProps extends OrgChartRenderSlots {
  forest: OrgForest;
  visible: VisibleNode[];
  nodeContext: (v: VisibleNode) => OrgChartNodeContext;
  focusId?: string | null;
  direction: OrgChartDirection;
  variant: OrgChartNodeVariant;
  showMinimap: boolean;
  /** Ids to frame; `null` frames everything. */
  fitTargets: readonly string[] | null;
  /** Bump to re-run fit-to-view. */
  fitRequest: number;
  labels: OrgChartLabels;
  classNames?: OrgChartClassNames;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  children?: React.ReactNode;
}

export function OrgChartCanvas(props: OrgChartCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({
  forest,
  visible,
  nodeContext,
  focusId,
  direction,
  variant,
  showMinimap,
  fitTargets,
  fitRequest,
  labels,
  classNames,
  renderNode,
  renderBadges,
  onToggle,
  onSelect,
  children,
}: OrgChartCanvasProps) {
  const { fitView } = useReactFlow();
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [rtl, setRtl] = React.useState(false);
  const [positions, setPositions] = React.useState<Map<
    string,
    LayoutBox
  > | null>(null);
  const size = ORG_CHART_NODE_SIZE[variant];
  const horizontal = direction === 'RIGHT';

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (el) setRtl(getComputedStyle(el).direction === 'rtl');
  }, []);

  const edgeList = React.useMemo(() => {
    const out: { source: string; target: string }[] = [];
    for (const v of visible) {
      const p = forest.parentOf.get(v.node.id);
      if (p != null) out.push({ source: p, target: v.node.id });
    }
    return out;
  }, [visible, forest]);

  const layoutKey = JSON.stringify([
    direction,
    variant,
    visible.map((v) => v.node.id),
  ]);
  React.useEffect(() => {
    let cancelled = false;
    void layoutOrgChart({
      ids: visible.map((v) => v.node.id),
      edges: edgeList,
      direction,
      ...size,
    }).then((p) => {
      if (!cancelled) setPositions(p);
    });
    return () => {
      cancelled = true;
    };
    // layoutKey captures every input that changes positions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  const flowNodes = React.useMemo<OrgFlowNode[]>(() => {
    if (!positions) return [];
    const out: OrgFlowNode[] = [];
    for (const v of visible) {
      const pos = positions.get(v.node.id);
      if (!pos) continue;
      out.push({
        id: v.node.id,
        type: 'org',
        position: { x: rtl ? -pos.x - size.width : pos.x, y: pos.y },
        width: size.width,
        height: size.height,
        draggable: false,
        selectable: false,
        connectable: false,
        data: {
          node: v.node,
          ctx: nodeContext(v),
          focused: v.node.id === focusId,
        },
      });
    }
    return out;
  }, [positions, visible, nodeContext, focusId, rtl, size.width, size.height]);

  const flowEdges = React.useMemo<Edge[]>(
    () =>
      positions
        ? edgeList
            .filter((e) => positions.has(e.source) && positions.has(e.target))
            .map((e) => ({
              id: `${e.source}->${e.target}`,
              source: e.source,
              target: e.target,
              type: 'smoothstep',
              focusable: false,
            }))
        : [],
    [edgeList, positions]
  );

  // Fit once the layout contains every target; layout is async, so the
  // request waits for positions rather than firing against stale ones.
  const fitKey = JSON.stringify(fitTargets);
  const pendingFit = React.useRef(true);
  React.useEffect(() => {
    pendingFit.current = true;
  }, [fitKey, fitRequest]);
  React.useEffect(() => {
    if (!pendingFit.current || !positions || positions.size === 0) return;
    const targets = fitTargets?.filter((id) => positions.has(id));
    if (fitTargets && fitTargets.length && !targets?.length) return;
    const raf = requestAnimationFrame(() => {
      pendingFit.current = false;
      void fitView({
        nodes: targets?.length ? targets.map((id) => ({ id })) : undefined,
        padding: 0.2,
        maxZoom: 1.1,
        duration: prefersReducedMotion() ? 0 : 300,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [positions, fitKey, fitRequest, fitTargets, fitView]);

  const ctxValue = React.useMemo<CanvasContextValue>(
    () => ({
      labels,
      classNames,
      horizontal,
      rtl,
      renderNode,
      renderBadges,
      onToggle,
      onSelect,
    }),
    [
      labels,
      classNames,
      horizontal,
      rtl,
      renderNode,
      renderBadges,
      onToggle,
      onSelect,
    ]
  );

  return (
    <CanvasContext.Provider value={ctxValue}>
      <div
        ref={wrapRef}
        role="region"
        aria-label={labels.chart}
        data-slot="org-chart-canvas"
        className={cn('relative h-[560px] w-full', classNames?.canvas)}
      >
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          minZoom={0.1}
          maxZoom={2}
          style={flowStyle}
          // Built-in attribution is #999 (fails contrast); credit is rendered below with tokens.
          proOptions={{ hideAttribution: true }}
          ariaLabelConfig={{
            'node.a11yDescription.default': labels.canvasHint,
            'node.a11yDescription.keyboardDisabled': labels.canvasHint,
            'edge.a11yDescription.default': labels.canvasHint,
            'minimap.ariaLabel': labels.minimap,
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Panel position={rtl ? 'bottom-right' : 'bottom-left'}>
            <a
              href="https://reactflow.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm text-[10px] focus-visible:ring-2 focus-visible:outline-none"
            >
              React Flow
            </a>
          </Panel>
          {showMinimap && (
            <MiniMap
              pannable
              zoomable
              position={rtl ? 'bottom-left' : 'bottom-right'}
              className="border-border overflow-hidden rounded-md border"
            />
          )}
        </ReactFlow>
        {children}
      </div>
    </CanvasContext.Provider>
  );
}
