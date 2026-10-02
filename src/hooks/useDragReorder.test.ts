import { act, renderHook } from '@testing-library/react';
import type * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  moveIdBy,
  reorderIds,
  useDragReorder,
  type UseDragReorderOptions,
} from './useDragReorder';

const ids = ['a', 'b', 'c', 'd'];

function setup(options: Partial<UseDragReorderOptions> = {}) {
  const onReorder = vi.fn();
  const view = renderHook(
    (props: UseDragReorderOptions) => useDragReorder(props),
    {
      initialProps: { ids, onReorder, ...options },
    }
  );
  return { ...view, onReorder };
}

function keyDown(
  props: React.HTMLAttributes<HTMLElement>,
  key: string,
  altKey = true
) {
  const target = document.createElement('li');
  const event = {
    key,
    altKey,
    target,
    currentTarget: target,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLElement>;
  props.onKeyDown?.(event);
  return event;
}

afterEach(() => vi.useRealTimers());

describe('reorder helpers', () => {
  it('reorderIds inserts before/after and ignores foreign ids', () => {
    expect(reorderIds(ids, 'a', 'c', true)).toEqual(['b', 'c', 'a', 'd']);
    expect(reorderIds(ids, 'd', 'a', false)).toEqual(['d', 'a', 'b', 'c']);
    expect(reorderIds(ids, 'x', 'a', false)).toBe(ids);
  });

  it('moveIdBy clamps to the list ends', () => {
    expect(moveIdBy(ids, 'b', 1)).toEqual(['a', 'c', 'b', 'd']);
    expect(moveIdBy(ids, 'b', -5)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveIdBy(ids, 'a', -1)).toBe(ids);
  });
});

describe('useDragReorder', () => {
  it('moveBy reports the new order and announces the position', () => {
    vi.useFakeTimers();
    const { result, onReorder } = setup();
    act(() => result.current.moveBy('a', 2));
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a', 'd']);
    act(() => vi.advanceTimersByTime(60));
    expect(result.current.announcement).toBe('Moved to position 3 of 4');
  });

  it('routes announcements to a custom announce callback', () => {
    const announce = vi.fn();
    const { result } = setup({
      announce,
      labels: { moved: (p, t, id) => `${id}: ${p}/${t}` },
    });
    act(() => result.current.moveBy('d', -1));
    expect(announce).toHaveBeenCalledWith('d: 3/4');
    expect(result.current.announcement).toBe('');
  });

  it('moveButtonProps disables at the ends and moves on click', () => {
    const { result, onReorder } = setup();
    expect(result.current.moveButtonProps('a', 'up').disabled).toBe(true);
    expect(result.current.moveButtonProps('d', 'down').disabled).toBe(true);
    const down = result.current.moveButtonProps('a', 'down');
    expect(down).toMatchObject({
      type: 'button',
      disabled: false,
      'aria-label': 'Move down',
    });
    expect(
      result.current.moveButtonProps('a', 'down', 'Lower A')
    ).toMatchObject({ 'aria-label': 'Lower A' });
    act(() =>
      down.onClick({ stopPropagation: vi.fn() } as unknown as React.MouseEvent)
    );
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c', 'd']);
  });

  it('respects canDropOn boundaries for moves', () => {
    const group = (id: string) => (id < 'c' ? 1 : 2);
    const { result, onReorder } = setup({
      canDropOn: (from, to) => group(from) === group(to),
    });
    expect(result.current.moveButtonProps('b', 'down').disabled).toBe(true);
    act(() => result.current.moveBy('a', 3));
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c', 'd']);
  });

  it('is a no-op without onReorder', () => {
    const { result } = setup({ onReorder: undefined });
    expect(result.current.rowProps('a')).toEqual({});
    expect(result.current.moveButtonProps('a', 'down').disabled).toBe(true);
  });

  it('adds Alt+Arrow handling to rowProps only when keyboard is set', () => {
    const plain = setup();
    expect(plain.result.current.rowProps('b').onKeyDown).toBeUndefined();

    const { result, onReorder } = setup({ keyboard: true });
    const props = result.current.rowProps('b');
    expect(props.tabIndex).toBe(0);
    keyDown(props, 'ArrowDown', false);
    expect(onReorder).not.toHaveBeenCalled();
    const event = keyDown(props, 'ArrowUp');
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c', 'd']);
  });

  it('uses getDragPreview for the drag image', () => {
    const preview = document.createElement('div');
    const { result } = setup({ getDragPreview: () => preview });
    const setDragImage = vi.fn();
    act(() =>
      result.current.rowProps('a').onDragStart?.({
        dataTransfer: { setData: vi.fn(), setDragImage },
      } as unknown as React.DragEvent<HTMLElement>)
    );
    expect(setDragImage).toHaveBeenCalledWith(preview, 0, 0);
    expect(result.current.draggingId).toBe('a');
  });
});
