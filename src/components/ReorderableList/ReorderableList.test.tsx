import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReorderableList, type ReorderableListProps } from './ReorderableList';
import { inOrder, storyTasks, type StoryTask } from './storyData';

type Props = Partial<ReorderableListProps<StoryTask>>;

/** Owns the order like a host app, and reports every new order to `spy`. */
function Harness({
  spy,
  ...props
}: Props &
  React.RefAttributes<HTMLElement> & { spy?: (ids: string[]) => void }) {
  const [tasks, setTasks] = React.useState(storyTasks);
  return (
    <ReorderableList
      aria-label="Tasks"
      items={tasks}
      getId={(task) => task.id}
      onReorder={(ids) => {
        spy?.(ids);
        setTasks((prev) => inOrder(prev, ids));
      }}
      renderItem={(task, { handle, moveButtons, index }) => (
        <div>
          {handle}
          <span>{task.title}</span>
          <span data-testid="index">{index}</span>
          {moveButtons}
        </div>
      )}
      {...props}
    />
  );
}

const rows = () => screen.getAllByRole('listitem');
const titles = () =>
  rows().map((row) => row.querySelector('span:not([data-slot])')?.textContent);
const order = (...ids: string[]) =>
  ids.map((id) => storyTasks.find((t) => t.id === id)!.title);

describe('ReorderableList', () => {
  it('renders the rows in the given order as a labelled list', () => {
    render(<Harness />);
    expect(screen.getByRole('list', { name: 'Tasks' })).toBeInTheDocument();
    expect(titles()).toEqual(storyTasks.map((t) => t.title));
    expect(screen.getAllByTestId('index').map((n) => n.textContent)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
    ]);
  });

  it('moves a focused row with Alt+Arrow keys and announces it', async () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    const first = rows()[0];
    expect(first).toHaveAttribute('tabindex', '0');
    expect(first).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+ArrowUp Alt+ArrowDown'
    );

    fireEvent.keyDown(first, { key: 'ArrowDown', altKey: true });
    expect(spy).toHaveBeenLastCalledWith(['t2', 't1', 't3', 't4', 't5']);
    expect(titles()).toEqual(order('t2', 't1', 't3', 't4', 't5'));
    expect(
      await screen.findByText('Moved to position 2 of 5')
    ).toBeInTheDocument();

    fireEvent.keyDown(rows()[1], { key: 'ArrowUp', altKey: true });
    expect(spy).toHaveBeenLastCalledWith(['t1', 't2', 't3', 't4', 't5']);
  });

  it('ignores arrows without Alt, and keys from controls inside a row', () => {
    const spy = vi.fn();
    render(
      <Harness
        spy={spy}
        renderItem={(task) => (
          <div>
            <span>{task.title}</span>
            <button type="button">Open {task.id}</button>
          </div>
        )}
      />
    );
    fireEvent.keyDown(rows()[0], { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open t1' }), {
      key: 'ArrowDown',
      altKey: true,
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('does nothing at the ends of the list', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    fireEvent.keyDown(rows()[0], { key: 'ArrowUp', altKey: true });
    fireEvent.keyDown(rows()[4], { key: 'ArrowDown', altKey: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it('turns the keyboard off with keyboard={false}', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} keyboard={false} />);
    expect(rows()[0]).not.toHaveAttribute('tabindex');
    fireEvent.keyDown(rows()[0], { key: 'ArrowDown', altKey: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it('moves rows with the move buttons, disabled at the ends', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Harness spy={spy} showMoveButtons />);

    const firstRow = within(rows()[0]);
    expect(firstRow.getByRole('button', { name: 'Move up' })).toBeDisabled();
    expect(
      within(rows()[4]).getByRole('button', { name: 'Move down' })
    ).toBeDisabled();

    await user.click(firstRow.getByRole('button', { name: 'Move down' }));
    expect(spy).toHaveBeenLastCalledWith(['t2', 't1', 't3', 't4', 't5']);
    expect(
      await screen.findByText('Moved to position 2 of 5')
    ).toBeInTheDocument();
  });

  it('renders no move buttons unless asked', () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Move up' })).toBeNull();
  });

  it('keeps moves inside the groups canDropOn allows', () => {
    const spy = vi.fn();
    const group = (id: string) => (['t1', 't2'].includes(id) ? 'a' : 'b');
    render(
      <Harness
        spy={spy}
        showMoveButtons
        canDropOn={(dragged, target) => group(dragged) === group(target)}
      />
    );
    // t2 is the last of group a, t3 the first of group b.
    fireEvent.keyDown(rows()[1], { key: 'ArrowDown', altKey: true });
    fireEvent.keyDown(rows()[2], { key: 'ArrowUp', altKey: true });
    expect(spy).not.toHaveBeenCalled();
    expect(
      within(rows()[1]).getByRole('button', { name: 'Move down' })
    ).toBeDisabled();

    fireEvent.keyDown(rows()[2], { key: 'ArrowDown', altKey: true });
    expect(spy).toHaveBeenLastCalledWith(['t1', 't2', 't4', 't3', 't5']);
  });

  it('turns reordering off without onReorder', () => {
    render(
      <ReorderableList
        items={storyTasks}
        getId={(task) => task.id}
        handle
        showMoveButtons
        renderItem={(task, { handle, moveButtons }) => (
          <div>
            {handle}
            {task.title}
            {moveButtons}
          </div>
        )}
      />
    );
    expect(rows()[0]).not.toHaveAttribute('tabindex');
    expect(
      document.querySelector('[data-slot="reorderable-list-handle"]')
    ).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a grip with the handle title, hidden from assistive tech', () => {
    render(<Harness handle />);
    const grips = document.querySelectorAll(
      '[data-slot="reorderable-list-handle"]'
    );
    expect(grips).toHaveLength(5);
    expect(grips[0]).toHaveAttribute('title', 'Drag to reorder');
    expect(grips[0].querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('blocks panning on the grip only when it is the drag handle', () => {
    const grip = () =>
      document.querySelector('[data-slot="reorderable-list-handle"]');
    const { rerender } = render(<Harness handle />);
    expect(grip()).toHaveClass('touch-none');
    rerender(<Harness />);
    expect(grip()).not.toHaveClass('touch-none');
  });

  it('takes translated labels', async () => {
    render(
      <Harness
        handle
        showMoveButtons
        labels={{
          moveUp: 'Subir',
          moveDown: 'Bajar',
          handle: 'Arrastrar',
          moved: (position, total) => `Posición ${position} de ${total}`,
        }}
      />
    );
    expect(
      document.querySelector('[data-slot="reorderable-list-handle"]')
    ).toHaveAttribute('title', 'Arrastrar');
    expect(
      within(rows()[0]).getByRole('button', { name: 'Subir' })
    ).toBeDisabled();
    fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Bajar' }));
    expect(await screen.findByText('Posición 2 de 5')).toBeInTheDocument();
  });

  it.each([
    ['ul', 'UL', 'LI'],
    ['ol', 'OL', 'LI'],
    ['div', 'DIV', 'DIV'],
  ] as const)('renders as=%s', (as, listTag, itemTag) => {
    const { container } = render(<Harness as={as} />);
    const list = container.querySelector('[data-slot="reorderable-list"]')!;
    expect(list.tagName).toBe(listTag);
    expect(
      list.querySelector('[data-slot="reorderable-list-item"]')!.tagName
    ).toBe(itemTag);
  });

  it('applies className and slot classNames, and forwards the ref', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(
      <Harness
        ref={ref}
        handle
        showMoveButtons
        className="outer"
        classNames={{
          list: 'list-x',
          item: 'item-x',
          handle: 'handle-x',
          moveButtons: 'buttons-x',
          announcement: 'live-x',
        }}
      />
    );
    const list = container.querySelector('[data-slot="reorderable-list"]')!;
    expect(ref.current).toBe(list);
    expect(list).toHaveClass('outer', 'list-x');
    for (const [slot, cls] of [
      ['reorderable-list-item', 'item-x'],
      ['reorderable-list-handle', 'handle-x'],
      ['reorderable-list-move-buttons', 'buttons-x'],
      ['reorderable-list-announcement', 'live-x'],
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).toHaveClass(cls);
    }
  });

  describe('pointer drag', () => {
    const ROW = 40;
    let restore: () => void;

    beforeEach(() => {
      // jsdom has no layout: stack each row ROW px tall so dnd-kit can measure.
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function (this: Element) {
        const item = this.closest('[data-slot="reorderable-list-item"]');
        const top = item
          ? Array.from(item.parentElement!.children).indexOf(item) * ROW
          : 0;
        return {
          x: 0,
          y: top,
          top,
          left: 0,
          right: 300,
          bottom: top + ROW,
          width: 300,
          height: ROW,
          toJSON: () => ({}),
        } as ReturnType<typeof original>;
      };
      restore = () => {
        Element.prototype.getBoundingClientRect = original;
      };
    });
    afterEach(() => restore());

    // One act per step: dnd-kit measures the rows in an effect after the drag starts.
    const drag = (from: Element, toY: number, end = true) => {
      act(() => {
        fireEvent.mouseDown(from, { button: 0, clientX: 10, clientY: 10 });
      });
      act(() => {
        fireEvent.mouseMove(document, { clientX: 10, clientY: 20 });
      });
      act(() => {
        fireEvent.mouseMove(document, { clientX: 10, clientY: toY });
      });
      if (end)
        act(() => {
          fireEvent.mouseUp(document, { clientX: 10, clientY: toY });
        });
    };

    it('drops a dragged row in its new place', () => {
      const spy = vi.fn();
      render(<Harness spy={spy} />);
      drag(rows()[0], 10 + ROW * 2);
      expect(spy).toHaveBeenLastCalledWith(['t2', 't3', 't1', 't4', 't5']);
    });

    it('announces a pointer drop like a keyboard move', async () => {
      render(<Harness />);
      drag(rows()[0], 10 + ROW * 2);
      expect(
        await screen.findByText('Moved to position 3 of 5')
      ).toBeInTheDocument();
    });

    it('marks the dragged row and drops nothing when cancelled', () => {
      const spy = vi.fn();
      render(<Harness spy={spy} />);
      drag(rows()[0], 10 + ROW * 2, false);
      expect(rows()[0]).toHaveAttribute('data-dragging', 'true');
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      });
      expect(rows()[0]).not.toHaveAttribute('data-dragging');
      expect(spy).not.toHaveBeenCalled();
    });

    it('never drops on a row canDropOn rejects', () => {
      const spy = vi.fn();
      render(<Harness spy={spy} canDropOn={(_, target) => target !== 't3'} />);
      drag(rows()[0], 10 + ROW * 2);
      // t3 is locked, so the drop lands on a neighbour instead.
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].indexOf('t1')).not.toBe(2);

      spy.mockClear();
      render(<Harness spy={spy} canDropOn={() => false} />);
      drag(rows()[5], 10 + ROW * 2);
      expect(spy).not.toHaveBeenCalled();
    });

    it('refuses a drop that crosses a row canDropOn rejects', () => {
      // Groups that aren't contiguous: t1 and t3 are "a", t2 is "b".
      const group = (id: string) => (id === 't2' ? 'b' : 'a');
      const spy = vi.fn();
      render(
        <Harness
          spy={spy}
          canDropOn={(dragged, target) => group(dragged) === group(target)}
        />
      );
      drag(rows()[0], 10 + ROW * 2);
      expect(spy).not.toHaveBeenCalled();
    });

    it('never picks up a fixed row, but drops others past it', () => {
      const spy = vi.fn();
      render(<Harness spy={spy} canDrag={(task) => task.id !== 't1'} />);
      drag(rows()[0], 10 + ROW * 2);
      expect(spy).not.toHaveBeenCalled();
      drag(rows()[1], 10 - ROW);
      expect(spy).toHaveBeenLastCalledWith(['t2', 't1', 't3', 't4', 't5']);
    });

    it('starts a drag from the grip only when handle is on', () => {
      const spy = vi.fn();
      render(<Harness spy={spy} handle />);
      drag(screen.getByText(storyTasks[0].title), 10 + ROW * 2);
      expect(spy).not.toHaveBeenCalled();
      const grip = rows()[0].querySelector(
        '[data-slot="reorderable-list-handle"]'
      )!;
      drag(grip, 10 + ROW * 2);
      expect(spy).toHaveBeenLastCalledWith(['t2', 't3', 't1', 't4', 't5']);
    });
  });

  describe('canDrag', () => {
    // t3 stands in for a section header that stays put.
    const fixed = (task: StoryTask) => task.id !== 't3';

    it('gives a fixed row no grip, focus or move buttons', () => {
      render(<Harness handle showMoveButtons canDrag={fixed} />);
      const header = rows()[2];
      expect(header).not.toHaveAttribute('tabindex');
      expect(
        header.querySelector('[data-slot="reorderable-list-handle"]')
      ).toBeNull();
      expect(within(header).queryByRole('button')).toBeNull();
      expect(rows()[1]).toHaveAttribute('tabindex', '0');
    });

    it('lets other rows move past a fixed row by keyboard', () => {
      const spy = vi.fn();
      render(<Harness spy={spy} canDrag={fixed} />);
      fireEvent.keyDown(rows()[2], { key: 'ArrowUp', altKey: true });
      expect(spy).not.toHaveBeenCalled();
      // t4 crosses the header into the section above it.
      fireEvent.keyDown(rows()[3], { key: 'ArrowUp', altKey: true });
      expect(spy).toHaveBeenLastCalledWith(['t1', 't2', 't4', 't3', 't5']);
    });
  });

  describe('storageKey', () => {
    const KEY = 'reorderable-list-test';
    beforeEach(() => localStorage.removeItem(KEY));

    const Saved = (props: Props) => (
      <ReorderableList
        items={storyTasks}
        getId={(task) => task.id}
        storageKey={KEY}
        renderItem={(task) => <span>{task.title}</span>}
        {...props}
      />
    );

    it('reorders without onReorder and saves the order', async () => {
      render(<Saved />);
      expect(rows()[0]).toHaveAttribute('tabindex', '0');
      fireEvent.keyDown(rows()[0], { key: 'ArrowDown', altKey: true });
      expect(titles()).toEqual(order('t2', 't1', 't3', 't4', 't5'));
      await waitFor(() =>
        expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([
          't2',
          't1',
          't3',
          't4',
          't5',
        ])
      );
    });

    it('restores a saved order, appending new rows and dropping gone ones', async () => {
      localStorage.setItem(KEY, JSON.stringify(['t3', 'gone', 't1']));
      render(<Saved />);
      await waitFor(() =>
        expect(titles()).toEqual(order('t3', 't1', 't2', 't4', 't5'))
      );
    });

    it('still reports each new order to onReorder', () => {
      const spy = vi.fn();
      render(<Saved onReorder={spy} />);
      fireEvent.keyDown(rows()[4], { key: 'ArrowUp', altKey: true });
      expect(spy).toHaveBeenLastCalledWith(['t1', 't2', 't3', 't5', 't4']);
    });
  });

  it('renders the announcement region outside the list', () => {
    const { container } = render(<Harness />);
    const live = container.querySelector(
      '[data-slot="reorderable-list-announcement"]'
    )!;
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live.closest('[data-slot="reorderable-list"]')).toBeNull();
  });
});
