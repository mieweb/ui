import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CustomizableDashboard,
  type DashboardColumns,
} from './CustomizableDashboard';
import {
  DashboardCustomizePanel,
  type WidgetDefinition,
} from './DashboardCustomizePanel';

const WIDGETS: WidgetDefinition[] = [
  {
    id: 'a',
    title: 'Alpha',
    description: 'First widget',
    category: 'Clinical',
  },
  { id: 'b', title: 'Beta', category: 'Clinical' },
  { id: 'c', title: 'Gamma', category: 'Admin' },
];

function makeColumns(): DashboardColumns {
  return [
    [{ id: 'a', node: <div data-testid="portlet-a">A</div> }],
    [{ id: 'b', node: <div data-testid="portlet-b">B</div> }],
    [{ id: 'c', node: <div data-testid="portlet-c">C</div> }],
  ];
}

describe('DashboardCustomizePanel', () => {
  it('lists widgets grouped by category with visibility switches', () => {
    renderWithTheme(
      <DashboardCustomizePanel
        open
        onOpenChange={() => {}}
        widgets={WIDGETS}
        hiddenIds={['b']}
        onToggleWidget={() => {}}
      />
    );

    expect(screen.getByText('Clinical')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 widgets shown')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Show Alpha' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Show Beta' })).not.toBeChecked();
  });

  it('reports toggle intent with the new visibility', () => {
    const onToggleWidget = vi.fn();
    renderWithTheme(
      <DashboardCustomizePanel
        open
        onOpenChange={() => {}}
        widgets={WIDGETS}
        hiddenIds={['b']}
        onToggleWidget={onToggleWidget}
      />
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Show Alpha' }));
    expect(onToggleWidget).toHaveBeenCalledWith('a', false);

    fireEvent.click(screen.getByRole('switch', { name: 'Show Beta' }));
    expect(onToggleWidget).toHaveBeenCalledWith('b', true);
  });

  it('renders the reset action only when onReset is provided', () => {
    const onReset = vi.fn();
    const { rerender } = renderWithTheme(
      <DashboardCustomizePanel
        open
        onOpenChange={() => {}}
        widgets={WIDGETS}
        hiddenIds={[]}
        onToggleWidget={() => {}}
      />
    );
    expect(
      screen.queryByRole('button', { name: /reset layout/i })
    ).not.toBeInTheDocument();

    rerender(
      <DashboardCustomizePanel
        open
        onOpenChange={() => {}}
        widgets={WIDGETS}
        hiddenIds={[]}
        onToggleWidget={() => {}}
        onReset={onReset}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /reset layout/i }));
    expect(onReset).toHaveBeenCalled();
  });
});

describe('CustomizableDashboard with widgets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a Customize button that opens the panel', () => {
    renderWithTheme(
      <CustomizableDashboard columns={makeColumns()} widgets={WIDGETS} />
    );
    fireEvent.click(screen.getByRole('button', { name: /customize/i }));
    expect(screen.getByText('Customize dashboard')).toBeInTheDocument();
  });

  it('hides and restores widgets from the panel', () => {
    const onHiddenChange = vi.fn();
    renderWithTheme(
      <CustomizableDashboard
        columns={makeColumns()}
        widgets={WIDGETS}
        storageKey="test-dash"
        onHiddenChange={onHiddenChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /customize/i }));
    fireEvent.click(screen.getByRole('switch', { name: 'Show Alpha' }));

    expect(screen.queryByTestId('portlet-a')).not.toBeInTheDocument();
    expect(onHiddenChange).toHaveBeenCalledWith(['a']);
    expect(
      JSON.parse(localStorage.getItem('test-dash-dashboard-hidden') ?? '[]')
    ).toEqual(['a']);

    fireEvent.click(screen.getByRole('switch', { name: 'Show Alpha' }));
    expect(screen.getByTestId('portlet-a')).toBeInTheDocument();
    expect(onHiddenChange).toHaveBeenLastCalledWith([]);
  });

  it('respects defaultHiddenIds and restored hidden state', () => {
    localStorage.setItem('test-dash-dashboard-hidden', JSON.stringify(['b']));
    renderWithTheme(
      <CustomizableDashboard
        columns={makeColumns()}
        widgets={WIDGETS}
        storageKey="test-dash"
      />
    );
    expect(screen.queryByTestId('portlet-b')).not.toBeInTheDocument();
    expect(screen.getByTestId('portlet-a')).toBeInTheDocument();
  });

  it('respects controlled hiddenIds', () => {
    renderWithTheme(
      <CustomizableDashboard
        columns={makeColumns()}
        widgets={WIDGETS}
        hiddenIds={['c']}
      />
    );
    expect(screen.queryByTestId('portlet-c')).not.toBeInTheDocument();
  });

  it('resets order, layout, and visibility', () => {
    localStorage.setItem('test-dash-dashboard-hidden', JSON.stringify(['a']));
    localStorage.setItem('test-dash-dashboard-layout', '1');
    const onHiddenChange = vi.fn();
    const onLayoutChange = vi.fn();

    renderWithTheme(
      <CustomizableDashboard
        columns={makeColumns()}
        widgets={WIDGETS}
        storageKey="test-dash"
        onHiddenChange={onHiddenChange}
        onLayoutChange={onLayoutChange}
      />
    );
    expect(screen.queryByTestId('portlet-a')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /customize/i }));
    fireEvent.click(screen.getByRole('button', { name: /reset layout/i }));

    expect(screen.getByTestId('portlet-a')).toBeInTheDocument();
    expect(onHiddenChange).toHaveBeenCalledWith([]);
    expect(onLayoutChange).toHaveBeenCalledWith(3);
    expect(localStorage.getItem('test-dash-dashboard-hidden')).toBeNull();
    expect(localStorage.getItem('test-dash-dashboard-layout')).toBeNull();
  });
});
