import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CustomizableDashboard,
  mergeColumnOrder,
  moveAcrossColumns,
  reorderOnDrop,
  consolidateColumns,
  requiredColumns,
  type DashboardColumns,
  type DashboardOrder,
} from './CustomizableDashboard';

function makeColumns(): DashboardColumns {
  return [
    [{ id: 'a', node: <div data-testid="portlet-a">A</div> }],
    [{ id: 'b', node: <div data-testid="portlet-b">B</div> }],
    [{ id: 'c', node: <div data-testid="portlet-c">C</div> }],
  ];
}

describe('drag order helpers', () => {
  const base: DashboardOrder = [['a', 'b'], ['c'], []];

  it('moveAcrossColumns inserts before the hovered item', () => {
    expect(moveAcrossColumns(base, 'a', 'c')).toEqual([['b'], ['a', 'c'], []]);
  });

  it('moveAcrossColumns appends when hovering a column', () => {
    expect(moveAcrossColumns(base, 'a', 'column-2')).toEqual([
      ['b'],
      ['c'],
      ['a'],
    ]);
  });

  it('moveAcrossColumns is a no-op within the same column', () => {
    expect(moveAcrossColumns(base, 'a', 'b')).toBe(base);
  });

  it('reorderOnDrop reorders within a column', () => {
    expect(reorderOnDrop(base, 'a', 'b', false)).toEqual([
      ['b', 'a'],
      ['c'],
      [],
    ]);
  });

  it('reorderOnDrop keeps the drag-over position for cross-column drops', () => {
    // After moveAcrossColumns placed `a` before `c`, the drop must not
    // flip it to the other side of `c`.
    const during = moveAcrossColumns(base, 'a', 'c');
    expect(reorderOnDrop(during, 'a', 'c', true)).toBe(during);
  });

  it('reorderOnDrop keeps reordering within the destination column after a cross', () => {
    // `a` crossed into column 2 (before `c`), then kept dragging past `d`:
    // the drop over `d` must still reorder, not freeze at the insertion.
    const during: DashboardOrder = [[], ['a', 'c', 'd'], []];
    expect(reorderOnDrop(during, 'a', 'd', true)).toEqual([
      [],
      ['c', 'd', 'a'],
      [],
    ]);
  });

  it('consolidateColumns folds trailing columns into the visible set', () => {
    expect(consolidateColumns([['a'], ['b'], ['c']], 2)).toEqual([
      ['a'],
      ['b', 'c'],
      [],
    ]);
    expect(consolidateColumns([['a'], ['b'], ['c']], 1)).toEqual([
      ['a', 'b', 'c'],
      [],
      [],
    ]);
  });

  it('consolidateColumns returns the same reference when nothing moves', () => {
    const fits2: DashboardOrder = [['a'], ['b'], []];
    expect(consolidateColumns(fits2, 2)).toBe(fits2);
    const fits1: DashboardOrder = [['a', 'b'], [], []];
    expect(consolidateColumns(fits1, 1)).toBe(fits1);
    expect(consolidateColumns(base, 3)).toBe(base);
  });

  it('requiredColumns counts through gaps so no item is hidden', () => {
    expect(requiredColumns([['a'], [], ['c']])).toBe(3);
    expect(requiredColumns([['a'], ['b'], []])).toBe(2);
    expect(requiredColumns([[], [], []])).toBe(1);
  });
});

describe('mergeColumnOrder', () => {
  const columns = makeColumns();

  it('keeps items in their props columns when no saved order', () => {
    expect(mergeColumnOrder(columns, null)).toEqual([['a'], ['b'], ['c']]);
  });

  it('applies saved positions', () => {
    expect(mergeColumnOrder(columns, [['c', 'a'], ['b'], []])).toEqual([
      ['c', 'a'],
      ['b'],
      [],
    ]);
  });

  it('drops saved ids no longer in props', () => {
    expect(mergeColumnOrder(columns, [['gone', 'a'], ['b'], ['c']])).toEqual([
      ['a'],
      ['b'],
      ['c'],
    ]);
  });

  it('appends new items to their props column', () => {
    expect(mergeColumnOrder(columns, [['b'], [], []])).toEqual([
      ['b', 'a'],
      [],
      ['c'],
    ]);
  });

  it('ignores duplicate saved ids', () => {
    expect(mergeColumnOrder(columns, [['a'], ['a', 'b'], ['c']])).toEqual([
      ['a'],
      ['b'],
      ['c'],
    ]);
  });
});

describe('CustomizableDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all portlets and drag handles', () => {
    renderWithTheme(<CustomizableDashboard columns={makeColumns()} />);
    expect(screen.getByTestId('portlet-a')).toBeInTheDocument();
    expect(screen.getByTestId('portlet-b')).toBeInTheDocument();
    expect(screen.getByTestId('portlet-c')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /drag to reorder/i })
    ).toHaveLength(3);
  });

  it('renders the title and layout toggle', () => {
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} title="Home" />
    );
    expect(
      screen.getByRole('heading', { name: 'Home', level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: /column layout/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: '3 column layout' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('uses a custom aria-label for the grid region', () => {
    renderWithTheme(
      <CustomizableDashboard
        columns={makeColumns()}
        ariaLabel="Patient summary dashboard"
      />
    );
    expect(
      screen.getByRole('region', { name: 'Patient summary dashboard' })
    ).toBeInTheDocument();
  });

  it('switches layout and consolidates trailing columns', () => {
    const onLayoutChange = vi.fn();
    const onOrderChange = vi.fn();
    renderWithTheme(
      <CustomizableDashboard
        columns={makeColumns()}
        onLayoutChange={onLayoutChange}
        onOrderChange={onOrderChange}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: '1 column layout' }));

    expect(onLayoutChange).toHaveBeenCalledWith(1);
    expect(onOrderChange).toHaveBeenCalledWith([['a', 'b', 'c'], [], []]);
    expect(
      screen.getByRole('radio', { name: '1 column layout' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('persists layout to localStorage under the storage key', () => {
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} storageKey="test-dash" />
    );
    fireEvent.click(screen.getByRole('radio', { name: '2 column layout' }));
    expect(localStorage.getItem('test-dash-dashboard-layout')).toBe('2');
    expect(
      JSON.parse(localStorage.getItem('test-dash-portlet-order') ?? '{}')
    ).toEqual({ 0: ['a'], 1: ['b', 'c'], 2: [] });
  });

  it('restores a saved order from localStorage', () => {
    localStorage.setItem(
      'test-dash-portlet-order',
      JSON.stringify({ 0: ['c'], 1: ['a'], 2: ['b'] })
    );
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} storageKey="test-dash" />
    );
    const groups = screen.getAllByRole('group', { name: /dashboard column/i });
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-c'));
    expect(groups[1]).toContainElement(screen.getByTestId('portlet-a'));
    expect(groups[2]).toContainElement(screen.getByTestId('portlet-b'));
  });

  it('survives corrupted saved order and falls back to props layout', () => {
    localStorage.setItem(
      'test-dash-portlet-order',
      JSON.stringify({ 0: {}, 1: 'nope', 2: ['c', 42] })
    );
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} storageKey="test-dash" />
    );
    const groups = screen.getAllByRole('group', { name: /dashboard column/i });
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-a'));
    expect(groups[1]).toContainElement(screen.getByTestId('portlet-b'));
    // 'c' survives the sanitized slot and stays in its column
    expect(groups[2]).toContainElement(screen.getByTestId('portlet-c'));
  });

  it('respects a controlled layout', () => {
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} layout={1} />
    );
    expect(
      screen.getByRole('radio', { name: '1 column layout' })
    ).toHaveAttribute('aria-checked', 'true');
    // Only one visible column in single-column mode
    expect(
      screen.getAllByRole('group', { name: /dashboard column/i })
    ).toHaveLength(1);
  });

  it('renders every portlet when mounted with a reduced defaultLayout', () => {
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} defaultLayout={1} />
    );
    const groups = screen.getAllByRole('group', { name: /dashboard column/i });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-a'));
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-b'));
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-c'));
  });

  it('renders every portlet when a controlled layout shrinks externally', () => {
    const { rerender } = renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} layout={3} />
    );
    rerender(<CustomizableDashboard columns={makeColumns()} layout={2} />);
    const groups = screen.getAllByRole('group', { name: /dashboard column/i });
    expect(groups).toHaveLength(2);
    expect(groups[1]).toContainElement(screen.getByTestId('portlet-b'));
    expect(groups[1]).toContainElement(screen.getByTestId('portlet-c'));
  });

  it('renders every portlet when a saved reduced layout is restored', () => {
    localStorage.setItem('dash-dashboard-layout', '1');
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} storageKey="dash" />
    );
    const groups = screen.getAllByRole('group', { name: /dashboard column/i });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-a'));
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-b'));
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-c'));
  });

  it('respects a controlled order', () => {
    renderWithTheme(
      <CustomizableDashboard
        columns={makeColumns()}
        order={[['b'], ['c'], ['a']]}
      />
    );
    const groups = screen.getAllByRole('group', { name: /dashboard column/i });
    expect(groups[0]).toContainElement(screen.getByTestId('portlet-b'));
    expect(groups[2]).toContainElement(screen.getByTestId('portlet-a'));
  });
});
