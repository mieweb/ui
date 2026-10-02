/** One person, team or place in the chart. The caller owns the collection. */
export interface OrgChartNode {
  id: string;
  /** Parent id, or `null` for a root. An unknown parent makes the node a root. */
  parentId: string | null;
  name: string;
  /** Job title (person) — matched by search. */
  title?: string;
  /** Secondary line (location: address, type) — matched by search. */
  subtitle?: string;
  /** Department, region or any grouping — drives the filter and the colour. */
  group?: string;
  avatarUrl?: string;
  /** Anything else the caller's render slots need. Never read by the chart. */
  meta?: Record<string, unknown>;
}

export interface OrgForest {
  byId: Map<string, OrgChartNode>;
  roots: OrgChartNode[];
  /** Effective children: each node appears under exactly one parent. */
  children: Map<string, OrgChartNode[]>;
  /** Effective parent; `null` for roots. */
  parentOf: Map<string, string | null>;
  depth: Map<string, number>;
  /** Everyone under a node, at any depth. */
  orgSize: Map<string, number>;
}

export interface VisibleNode {
  node: OrgChartNode;
  depth: number;
}

const EMPTY: OrgChartNode[] = [];

/**
 * Builds a forest that is always a tree: duplicate ids keep the first, unknown
 * parents become roots, and a cycle is broken by promoting its first node.
 */
export function buildOrgForest(nodes: readonly OrgChartNode[]): OrgForest {
  const byId = new Map<string, OrgChartNode>();
  for (const n of nodes) if (!byId.has(n.id)) byId.set(n.id, n);

  const declared = new Map<string, OrgChartNode[]>();
  const roots: OrgChartNode[] = [];
  for (const n of byId.values()) {
    const p = n.parentId;
    if (p != null && p !== n.id && byId.has(p)) {
      const list = declared.get(p);
      if (list) list.push(n);
      else declared.set(p, [n]);
    } else {
      roots.push(n);
    }
  }

  const children = new Map<string, OrgChartNode[]>();
  const parentOf = new Map<string, string | null>();
  const depth = new Map<string, number>();
  const order: string[] = [];

  const walk = (root: OrgChartNode) => {
    parentOf.set(root.id, null);
    depth.set(root.id, 0);
    const stack = [root];
    while (stack.length) {
      const u = stack.pop()!;
      order.push(u.id);
      const kids: OrgChartNode[] = [];
      for (const c of declared.get(u.id) ?? EMPTY) {
        if (depth.has(c.id)) continue;
        depth.set(c.id, depth.get(u.id)! + 1);
        parentOf.set(c.id, u.id);
        kids.push(c);
      }
      if (kids.length) children.set(u.id, kids);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
  };

  for (const r of roots) walk(r);
  for (const n of byId.values()) {
    if (depth.has(n.id)) continue;
    roots.push(n);
    walk(n);
  }

  const orgSize = new Map<string, number>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    let size = 0;
    for (const c of children.get(id) ?? EMPTY) size += 1 + orgSize.get(c.id)!;
    orgSize.set(id, size);
  }

  return { byId, roots, children, parentOf, depth, orgSize };
}

export function childrenOf(forest: OrgForest, id: string): OrgChartNode[] {
  return forest.children.get(id) ?? EMPTY;
}

export function ancestorsOf(forest: OrgForest, id: string): string[] {
  const out: string[] = [];
  let p = forest.parentOf.get(id) ?? null;
  while (p != null) {
    out.push(p);
    p = forest.parentOf.get(p) ?? null;
  }
  return out;
}

/** Expanded ids that show `levels` levels from each root. */
export function initialExpanded(
  forest: OrgForest,
  levels: number
): Set<string> {
  const out = new Set<string>();
  for (const [id, d] of forest.depth) {
    if (d < levels - 1 && forest.children.has(id)) out.add(id);
  }
  return out;
}

export function allExpandable(forest: OrgForest): Set<string> {
  return new Set(forest.children.keys());
}

/** Pre-order list of what is on screen given the expanded set. */
export function visibleNodes(
  forest: OrgForest,
  expanded: ReadonlySet<string>
): VisibleNode[] {
  const out: VisibleNode[] = [];
  const visit = (n: OrgChartNode, depth: number) => {
    out.push({ node: n, depth });
    if (!expanded.has(n.id)) return;
    for (const c of childrenOf(forest, n.id)) visit(c, depth + 1);
  };
  for (const r of forest.roots) visit(r, 0);
  return out;
}

export function matchesQuery(node: OrgChartNode, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return false;
  return [node.name, node.title, node.subtitle, node.group].some((v) =>
    v?.toLocaleLowerCase().includes(q)
  );
}

export function distinctGroups(nodes: readonly OrgChartNode[]): string[] {
  const set = new Set<string>();
  for (const n of nodes) if (n.group) set.add(n.group);
  return [...set].sort((a, b) => a.localeCompare(b));
}
