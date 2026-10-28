import { describe, expect, it } from 'vitest';
import type { SuperChatMessage } from './types';
import {
  ancestorIds,
  buildThreadTree,
  collapsibleIds,
  flattenThreadTree,
} from './thread-tree';

function msg(
  id: string,
  minute: number,
  extra: Partial<SuperChatMessage> = {}
): SuperChatMessage {
  return {
    id,
    participantId: 'u1',
    text: id,
    time: new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString(),
    ...extra,
  };
}

describe('buildThreadTree', () => {
  it('handles very deep reply chains without recursion', () => {
    const depth = 20_000;
    const thread = Array.from({ length: depth }, (_, i) =>
      msg(`m${i}`, i, i > 0 ? { parentId: `m${i - 1}` } : {})
    );
    const { roots, hasThreading } = buildThreadTree(thread);

    expect(hasThreading).toBe(true);
    expect(roots).toHaveLength(1);
    expect(roots[0].descendantCount).toBe(depth - 1);
    const visible = flattenThreadTree(roots, new Set());
    expect(visible).toHaveLength(depth);
    expect(visible.at(-1)!.depth).toBe(depth - 1);
    expect(collapsibleIds(roots).size).toBe(depth - 1);
    expect(ancestorIds(roots, `m${depth - 1}`)).toHaveLength(depth - 1);
  });

  it('falls back to roots for cycles and chains that lead into them', () => {
    const { roots } = buildThreadTree([
      msg('a', 0, { parentId: 'b' }),
      msg('b', 1, { parentId: 'a' }),
      msg('c', 2, { parentId: 'a' }),
      msg('d', 3, { parentId: 'missing' }),
      msg('e', 4, { parentId: 'd' }),
    ]);
    expect(roots.map((n) => n.message.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(roots[3].children.map((n) => n.message.id)).toEqual(['e']);
  });

  it('orders siblings by time and counts descendants', () => {
    const { roots } = buildThreadTree([
      msg('root', 0),
      msg('late', 5, { parentId: 'root' }),
      msg('early', 1, { parentId: 'root' }),
      msg('nested', 6, { parentId: 'early' }),
    ]);
    expect(roots[0].children.map((n) => n.message.id)).toEqual([
      'early',
      'late',
    ]);
    expect(roots[0].descendantCount).toBe(3);
    expect(
      flattenThreadTree(roots, new Set(['early'])).map((n) => n.message.id)
    ).toEqual(['root', 'early', 'late']);
  });
});

describe('collapsibleIds', () => {
  it('skips system and reference rows, which have no collapse control', () => {
    const { roots } = buildThreadTree([
      msg('sys', 0, { type: 'system' }),
      msg('sys-reply', 1, { parentId: 'sys' }),
      msg('ref', 2, {
        type: 'ref',
        ref: { refType: 'doc', refId: 'd1', title: 'Doc' },
      }),
      msg('ref-reply', 3, { parentId: 'ref' }),
      msg('plain', 4),
      msg('plain-reply', 5, { parentId: 'plain' }),
    ]);
    expect([...collapsibleIds(roots)]).toEqual(['plain']);
  });
});
