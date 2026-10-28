/**
 * SuperChat — reply-tree helpers.
 *
 * SuperChat's thread is a flat, time-ordered list. When messages carry a
 * `parentId`, these helpers assemble the reply tree used by the threaded
 * rendering path: siblings (and roots) stay ordered by `time`, replies nest
 * under their parent, and unknown parents / cycles fall back to roots so every
 * message renders exactly once. All traversals are iterative and linear, so
 * arbitrarily deep reply chains are safe.
 */

import type { SuperChatMessage } from './types';

/** A message plus its nested replies, ready for indented rendering. */
export interface ThreadNode {
  message: SuperChatMessage;
  children: ThreadNode[];
  /** The message this one replies to (absent for roots). */
  parent?: ThreadNode;
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

  // A message nests under its parent unless its ancestor chain loops; those
  // chains (and anything hanging off them) fall back to roots.
  const parentOf = (node: ThreadNode): ThreadNode | undefined => {
    const parentId = node.message.parentId;
    return parentId && parentId !== node.message.id
      ? nodesById.get(parentId)
      : undefined;
  };
  const cyclic = findCyclicChains(nodesById, parentOf);

  const roots: ThreadNode[] = [];
  let hasThreading = false;
  for (const message of thread) {
    const node = nodesById.get(message.id)!;
    const parent = parentOf(node);
    if (parent && !cyclic.has(message.id)) {
      node.parent = parent;
      parent.children.push(node);
      hasThreading = true;
    } else {
      roots.push(node);
    }
  }

  // Iterative (no recursion, so arbitrarily deep chains are safe): assign
  // depths and sort children top-down, then total descendants bottom-up.
  roots.sort(byTimeThenOrder);
  const preorder: ThreadNode[] = [];
  const stack = [...roots].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    preorder.push(node);
    node.children.sort(byTimeThenOrder);
    for (let i = node.children.length - 1; i >= 0; i--) {
      node.children[i].depth = node.depth + 1;
      stack.push(node.children[i]);
    }
  }
  for (let i = preorder.length - 1; i >= 0; i--) {
    const node = preorder[i];
    node.descendantCount = node.children.reduce(
      (sum, child) => sum + 1 + child.descendantCount,
      0
    );
  }

  return { roots, hasThreading };
}

/**
 * Ids of messages whose ancestor chain loops (including those on the loop).
 * Each chain is walked once and its result memoized, so this is linear in the
 * thread length.
 */
function findCyclicChains(
  nodesById: Map<string, ThreadNode>,
  parentOf: (node: ThreadNode) => ThreadNode | undefined
): Set<string> {
  const resolved = new Map<string, boolean>();
  for (const start of nodesById.values()) {
    const path: ThreadNode[] = [];
    const onPath = new Set<string>();
    let current: ThreadNode | undefined = start;
    let loops = false;
    while (current && !resolved.has(current.message.id)) {
      if (onPath.has(current.message.id)) {
        loops = true;
        break;
      }
      onPath.add(current.message.id);
      path.push(current);
      current = parentOf(current);
    }
    if (!loops && current) loops = resolved.get(current.message.id)!;
    for (const node of path) resolved.set(node.message.id, loops);
  }
  const ids = new Set<string>();
  for (const [id, loops] of resolved) if (loops) ids.add(id);
  return ids;
}

/**
 * Whether a message's row can show the collapse control. System notices and
 * reference chips render without the message chrome that carries it (see
 * `MessageRow`), so they never collapse.
 */
export function canToggleReplies(message: SuperChatMessage): boolean {
  return message.type !== 'system' && !(message.type === 'ref' && message.ref);
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
  const stack = reverseRoots ? [...roots] : [...roots].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    out.push(node);
    if (node.children.length > 0 && !collapsedIds.has(node.message.id)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }
  return out;
}

/** Ids of nodes that have replies and can show the collapse control. */
export function collapsibleIds(roots: ThreadNode[]): Set<string> {
  const ids = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.children.length > 0 && canToggleReplies(node.message)) {
      ids.add(node.message.id);
    }
    stack.push(...node.children);
  }
  return ids;
}

/** Ids of every ancestor of `id` (nearest first), for revealing a message. */
export function ancestorIds(roots: ThreadNode[], id: string): string[] {
  const parentById = new Map<string, string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const node = stack.pop()!;
    for (const child of node.children) {
      parentById.set(child.message.id, node.message.id);
      stack.push(child);
    }
  }
  const ids: string[] = [];
  for (let p = parentById.get(id); p !== undefined; p = parentById.get(p)) {
    ids.push(p);
  }
  return ids;
}

/** A tree with no messages, for when threading cannot be used. */
export const EMPTY_THREAD_TREE: ThreadTree = { roots: [], hasThreading: false };
