import {
  generateEmailBlockId,
  type EmailBlock,
  type EmailContentBlock,
} from './types';

type Edit = <B extends EmailBlock>(list: B[], index: number) => B[];

/** Apply `edit` to whichever list (top level or a column) contains `id`. */
function editContaining<B extends EmailBlock>(
  blocks: B[],
  id: string,
  edit: Edit
): B[] {
  const index = blocks.findIndex((b) => b.id === id);
  if (index !== -1) return edit(blocks, index);
  let changed = false;
  const next = blocks.map((block) => {
    if (block.type !== 'columns') return block;
    let hit = false;
    const columns = block.columns.map((column) => {
      const inner = editContaining(column.blocks, id, edit);
      if (inner === column.blocks) return column;
      hit = changed = true;
      return { ...column, blocks: inner };
    });
    return hit ? { ...block, columns } : block;
  });
  return changed ? next : blocks;
}

export function findEmailBlock(
  blocks: EmailBlock[],
  id: string | null
): EmailBlock | undefined {
  if (!id) return undefined;
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'columns') {
      for (const column of block.columns) {
        const found = findEmailBlock(column.blocks, id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

export function updateEmailBlock(
  blocks: EmailBlock[],
  id: string,
  patch: Partial<EmailBlock>
): EmailBlock[] {
  return editContaining(blocks, id, (list, i) =>
    list.map((b, j) => (j === i ? ({ ...b, ...patch } as typeof b) : b))
  );
}

export function removeEmailBlock(
  blocks: EmailBlock[],
  id: string
): EmailBlock[] {
  return editContaining(blocks, id, (list, i) =>
    list.filter((_, j) => j !== i)
  );
}

export function moveEmailBlock(
  blocks: EmailBlock[],
  id: string,
  delta: number
): EmailBlock[] {
  return editContaining(blocks, id, (list, i) => {
    const target = i + delta;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    const [moved] = next.splice(i, 1);
    next.splice(target, 0, moved);
    return next;
  });
}

function cloneWithNewIds<B extends EmailBlock>(block: B): B {
  const copy = { ...block, id: generateEmailBlockId() };
  if (copy.type === 'columns') {
    copy.columns = copy.columns.map((column) => ({
      ...column,
      id: generateEmailBlockId(),
      blocks: column.blocks.map(cloneWithNewIds),
    }));
  }
  return copy;
}

/** Returns the new list and the copy's id. */
export function duplicateEmailBlock(
  blocks: EmailBlock[],
  id: string
): { blocks: EmailBlock[]; newId: string | null } {
  let newId: string | null = null;
  const next = editContaining(blocks, id, (list, i) => {
    const copy = cloneWithNewIds(list[i]);
    newId = copy.id;
    return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
  });
  return { blocks: next, newId };
}

export function addBlockToColumn(
  blocks: EmailBlock[],
  columnsId: string,
  columnIndex: number,
  block: EmailContentBlock
): EmailBlock[] {
  return blocks.map((b) =>
    b.id === columnsId && b.type === 'columns'
      ? {
          ...b,
          columns: b.columns.map((column, i) =>
            i === columnIndex
              ? { ...column, blocks: [...column.blocks, block] }
              : column
          ),
        }
      : b
  );
}
