/**
 * SuperChat — reply-tree helpers.
 *
 * SuperChat's thread is a flat, time-ordered list. When messages carry a
 * `parentId`, these helpers assemble the reply tree used by the threaded
 * rendering path: siblings (and roots) stay ordered by `time`, replies nest
 * under their parent, and unknown parents / cycles fall back to roots so every
 * message renders exactly once.
 */

import type { SuperChatMessage } from './types';

/** A message plus its nested replies, ready for indented rendering. */
export interface ThreadNode {
  message: SuperChatMessage;
  children: ThreadNode[];
  /** Nesting depth from the root (roots are `0`). */
  depth: number;
  /** Count of all nested replies below this node (for the collapse toggle). */
  descendantCount: number;
}

export interface ThreadTree {
  /** Top-level messages, each carrying its reply subtree. */
  roots: ThreadNode[];
  /** `true` when at least one message references an existing parent. */
  hasThreading: boolean;
}

function timeValue(time: Date | string): number {
  const ms = time instanceof Date ? time.getTime() : new Date(time).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Build the reply tree from a flat thread. Siblings and roots are ordered by
 * `time`, with the original thread order as a stable tie-breaker.
 */
export function buildThreadTree(thread: SuperChatMessage[]): ThreadTree {
  const order = new Map<string, number>();
  thread.forEach((message, index) => order.set(message.id, index));

  const byTimeThenOrder = (a: ThreadNode, b: ThreadNode): number => {
    const delta = timeValue(a.message.time) - timeValue(b.message.time);
    if (delta !== 0) return delta;
    return (order.get(a.message.id) ?? 0) - (order.get(b.message.id) ?? 0);
  };

  const nodesById = new Map<string, ThreadNode>();
  for (const message of thread) {
    nodesById.set(message.id, {
      message,
      children: [],
      depth: 0,
      descendantCount: 0,
    });
  }

  const roots: ThreadNode[] = [];
  let hasThreading = false;

  for (const message of thread) {
    const node = nodesById.get(message.id)!;
    const parentId = message.parentId;
    const parent =
      parentId && parentId !== message.id ? nodesById.get(parentId) : undefined;
    if (parent && !createsCycle(parent, node, nodesById)) {
      parent.children.push(node);
      hasThreading = true;
    } else {
      roots.push(node);
    }
  }

  const assignDepth = (node: ThreadNode, depth: number): number => {
    node.depth = depth;
    node.children.sort(byTimeThenOrder);
    let descendants = node.children.length;
    for (const child of node.children) {
      descendants += assignDepth(child, depth + 1);
    }
    node.descendantCount = descendants;
    return descendants;
  };

  roots.sort(byTimeThenOrder);
  for (const root of roots) assignDepth(root, 0);

  return { roots, hasThreading };
}

/** Walk up from `parent` to detect whether attaching `node` would form a cycle. */
function createsCycle(
  parent: ThreadNode,
  node: ThreadNode,
  nodesById: Map<string, ThreadNode>
): boolean {
  let current: ThreadNode | undefined = parent;
  const guard = new Set<string>();
  while (current) {
    if (current === node) return true;
    if (guard.has(current.message.id)) return true;
    guard.add(current.message.id);
    const parentId: string | undefined = current.message.parentId;
    current = parentId ? nodesById.get(parentId) : undefined;
  }
  return false;
}

/**
 * Flatten the tree to the visible, ordered list given a set of collapsed ids.
 * A collapsed node stays visible but its descendants are hidden. Pass
 * `reverseRoots` for feed-style (`order === 'desc'`) rendering.
 */
export function flattenThreadTree(
  roots: ThreadNode[],
  collapsedIds: ReadonlySet<string>,
  reverseRoots = false
): ThreadNode[] {
  const out: ThreadNode[] = [];
  const walk = (nodes: ThreadNode[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children.length > 0 && !collapsedIds.has(node.message.id)) {
        walk(node.children);
      }
    }
  };
  walk(reverseRoots ? [...roots].reverse() : roots);
  return out;
}

/** All ids of nodes that have replies (i.e. can be collapsed). */
export function collapsibleIds(roots: ThreadNode[]): Set<string> {
  const ids = new Set<string>();
  const walk = (nodes: ThreadNode[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) ids.add(node.message.id);
      walk(node.children);
    }
  };
  walk(roots);
  return ids;
}
