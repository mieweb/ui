import type { ELK, ElkNode } from 'elkjs/lib/elk-api';

export type OrgChartDirection = 'DOWN' | 'RIGHT';

export interface LayoutBox {
  x: number;
  y: number;
}

export interface LayoutRequest {
  ids: readonly string[];
  edges: readonly { source: string; target: string }[];
  direction: OrgChartDirection;
  width: number;
  height: number;
}

/**
 * `considerModelOrder` keeps siblings in input order, so expanding one branch
 * never reshuffles its neighbours.
 */
export const ORG_CHART_LAYOUT_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.spacing.nodeNodeBetweenLayers': '64',
  'elk.spacing.nodeNode': '28',
  'elk.spacing.componentComponent': '64',
  'elk.edgeRouting': 'ORTHOGONAL',
};

let elkPromise: Promise<ELK> | null = null;

function getElk(): Promise<ELK> {
  elkPromise ??= import('elkjs/lib/elk.bundled.js').then(
    (m) => new m.default()
  );
  return elkPromise;
}

/** Positions for the visible nodes; falls back to a depth grid if elk fails. */
export async function layoutOrgChart(
  req: LayoutRequest
): Promise<Map<string, LayoutBox>> {
  const graph: ElkNode = {
    id: 'org-chart-root',
    layoutOptions: {
      ...ORG_CHART_LAYOUT_OPTIONS,
      'elk.direction': req.direction,
    },
    children: req.ids.map((id) => ({
      id,
      width: req.width,
      height: req.height,
    })),
    edges: req.edges.map((e) => ({
      id: JSON.stringify([e.source, e.target]),
      sources: [e.source],
      targets: [e.target],
    })),
  };
  try {
    const elk = await getElk();
    const out = await elk.layout(graph);
    return new Map(
      (out.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }])
    );
  } catch {
    return gridLayout(req);
  }
}

function gridLayout(req: LayoutRequest): Map<string, LayoutBox> {
  const parent = new Map(req.edges.map((e) => [e.target, e.source]));
  const perDepth = new Map<number, number>();
  const out = new Map<string, LayoutBox>();
  for (const id of req.ids) {
    let depth = 0;
    for (let p = parent.get(id); p != null; p = parent.get(p)) depth++;
    const slot = perDepth.get(depth) ?? 0;
    perDepth.set(depth, slot + 1);
    const along =
      slot * (req.direction === 'DOWN' ? req.width + 28 : req.height + 28);
    const across =
      depth * (req.direction === 'DOWN' ? req.height + 64 : req.width + 64);
    out.set(
      id,
      req.direction === 'DOWN'
        ? { x: along, y: across }
        : { x: across, y: along }
    );
  }
  return out;
}
