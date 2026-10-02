import * as React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { OrgChart } from './OrgChart';
import { defaultOrgChartLabels } from './shared';
import { layoutOrgChart, ORG_CHART_LAYOUT_OPTIONS } from './layout';
import { orgLocations, orgPeople } from './storyData';
import {
  ancestorsOf,
  buildOrgForest,
  distinctGroups,
  initialExpanded,
  matchesQuery,
  visibleNodes,
  type OrgChartNode,
} from './tree';

const elk = vi.hoisted(() => ({ fail: false, calls: [] as unknown[] }));
let originalResizeObserver: typeof ResizeObserver;

// Deterministic layout: one row, in input order.
vi.mock('elkjs/lib/elk.bundled.js', () => ({
  default: class {
    layout(g: { children: { id: string }[] }) {
      elk.calls.push(g);
      if (elk.fail) return Promise.reject(new Error('elk failed'));
      return Promise.resolve({
        ...g,
        children: g.children.map((c, i) => ({ ...c, x: i * 300, y: 0 })),
      });
    }
  },
}));

beforeAll(() => {
  // React Flow needs these in jsdom; the shared ResizeObserver stub fires
  // entries without a contentRect, which React Flow's pan-zoom reads.
  originalResizeObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  class DOMMatrixReadOnly {
    m22: number;
    constructor(transform?: string) {
      const scale = transform?.match(/scale\(([0-9.]+)\)/)?.[1];
      this.m22 = scale !== undefined ? +scale : 1;
    }
  }
  Object.defineProperty(window, 'DOMMatrixReadOnly', {
    configurable: true,
    value: DOMMatrixReadOnly,
  });
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 100 },
    offsetWidth: { configurable: true, get: () => 100 },
  });
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

afterEach(() => {
  elk.fail = false;
  elk.calls.length = 0;
});

const treeItems = () => screen.getAllByRole('treeitem');
const item = (name: string) =>
  treeItems().find((el) => el.textContent?.includes(name))!;

// =============================================================================
// Pure helpers
// =============================================================================

describe('buildOrgForest', () => {
  it('builds roots, depth and org size', () => {
    const f = buildOrgForest(orgPeople);
    expect(f.roots.map((r) => r.id)).toEqual(['ceo']);
    expect(f.depth.get('eng-1')).toBe(3);
    expect(f.orgSize.get('ceo')).toBe(24);
    expect(f.orgSize.get('cto')).toBe(8);
    expect(ancestorsOf(f, 'eng-1')).toEqual(['eng-plat', 'cto', 'ceo']);
  });

  it('handles forests, unknown parents, duplicates and cycles', () => {
    const nodes: OrgChartNode[] = [
      { id: 'a', parentId: 'b', name: 'A' },
      { id: 'b', parentId: 'a', name: 'B' },
      { id: 'c', parentId: 'b', name: 'C' },
      { id: 'd', parentId: 'missing', name: 'D' },
      { id: 'd', parentId: null, name: 'D duplicate' },
      { id: 'e', parentId: 'e', name: 'E' },
    ];
    const f = buildOrgForest(nodes);
    expect(f.byId.get('d')?.name).toBe('D');
    expect(f.roots.map((r) => r.id)).toEqual(['d', 'e', 'a']);
    const ids = visibleNodes(f, new Set(['a', 'b'])).map((v) => v.node.id);
    expect(ids).toEqual(['d', 'e', 'a', 'b', 'c']);
  });

  it('expands to the initial depth', () => {
    const f = buildOrgForest(orgPeople);
    expect([...initialExpanded(f, 2)]).toEqual(['ceo']);
    expect(visibleNodes(f, initialExpanded(f, 2))).toHaveLength(4);
    expect(visibleNodes(f, initialExpanded(f, 1))).toHaveLength(1);
  });

  it('matches name, title, subtitle and group', () => {
    const n = orgPeople[1];
    expect(matchesQuery(n, 'jordan')).toBe(true);
    expect(matchesQuery(n, 'technology')).toBe(true);
    expect(matchesQuery(n, 'engineering')).toBe(true);
    expect(matchesQuery(n, '   ')).toBe(false);
    expect(matchesQuery(orgLocations[4], 'fort wayne, in')).toBe(true);
    expect(distinctGroups(orgPeople)).toEqual([
      'Engineering',
      'Operations',
      'Sales',
    ]);
  });
});

describe('layoutOrgChart', () => {
  const req = {
    ids: ['a', 'b', 'c'],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ],
    direction: 'RIGHT' as const,
    width: 100,
    height: 50,
  };

  it('runs a layered elk layout in the requested direction', async () => {
    const out = await layoutOrgChart(req);
    expect(out.get('c')).toEqual({ x: 600, y: 0 });
    const graph = elk.calls[0] as { layoutOptions: Record<string, string> };
    expect(graph.layoutOptions).toMatchObject({
      ...ORG_CHART_LAYOUT_OPTIONS,
      'elk.direction': 'RIGHT',
    });
  });

  it('falls back to a depth grid when elk fails', async () => {
    elk.fail = true;
    const right = await layoutOrgChart(req);
    expect(right.get('c')).toEqual({ x: 328, y: 0 });
    const down = await layoutOrgChart({ ...req, direction: 'DOWN' });
    expect(down.get('c')).toEqual({ x: 0, y: 228 });
  });
});

// =============================================================================
// List view (the accessible tree)
// =============================================================================

describe('OrgChart list view', () => {
  it('renders a tree with levels and initial depth', () => {
    render(<OrgChart nodes={orgPeople} defaultView="list" />);
    const tree = screen.getByRole('tree', { name: 'Organization' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(4);
    expect(item('Avery Morgan')).toHaveAttribute('aria-level', '1');
    expect(item('Avery Morgan')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Jordan Patel')).toHaveAttribute('aria-level', '2');
    expect(item('Jordan Patel')).toHaveAttribute('aria-posinset', '1');
    expect(item('Jordan Patel')).toHaveAttribute('aria-setsize', '3');
    expect(item('Jordan Patel')).toHaveAttribute('aria-expanded', 'false');
    expect(item('Avery Morgan')).toHaveAttribute('tabindex', '0');
  });

  it('navigates and expands with the keyboard', async () => {
    const user = userEvent.setup();
    render(<OrgChart nodes={orgPeople} defaultView="list" />);
    act(() => item('Avery Morgan').focus());
    await user.keyboard('{ArrowDown}');
    expect(item('Jordan Patel')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(item('Jordan Patel')).toHaveAttribute('aria-expanded', 'true');
    expect(treeItems()).toHaveLength(6);
    await user.keyboard('{ArrowRight}');
    expect(item('Diego Alvarez')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(item('Jordan Patel')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(treeItems()).toHaveLength(4);
    await user.keyboard('{End}');
    expect(item('Samira Okafor')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('Avery Morgan')).toHaveFocus();
    await user.keyboard('{ArrowUp}{a}');
    expect(item('Avery Morgan')).toHaveFocus();
  });

  it('expands from the chevron and opens details', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onSelect = vi.fn();
    render(
      <OrgChart
        nodes={orgPeople}
        defaultView="list"
        onOpen={onOpen}
        onSelect={onSelect}
      />
    );
    const chevron = item('Riley Chen').querySelector('[aria-hidden="true"]')!;
    await user.click(chevron);
    expect(item('Riley Chen')).toHaveAttribute('aria-expanded', 'true');

    act(() => item('Riley Chen').focus());
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: 'Riley Chen' });
    expect(dialog).toHaveFocus();
    expect(onSelect).toHaveBeenLastCalledWith('cro', orgPeople[2]);
    expect(within(dialog).getByText('2 direct reports')).toBeInTheDocument();
    expect(within(dialog).getByText('7 in organization')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Reports to Avery Morgan')
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Open' }));
    expect(onOpen).toHaveBeenCalledWith('cro', orgPeople[2]);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenLastCalledWith(null, null);
    expect(item('Riley Chen')).toHaveFocus();
  });

  it('renders the Open action as a link with getHref', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <OrgChart
        nodes={orgPeople}
        defaultView="list"
        getHref={(id) => `/people/${id}`}
        onOpen={onOpen}
      />
    );
    await user.click(item('Avery Morgan'));
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', '/people/ceo');
    fireEvent.click(link, { metaKey: true });
    expect(onOpen).not.toHaveBeenCalled();
    await user.click(link);
    expect(onOpen).toHaveBeenCalledWith('ceo', orgPeople[0]);
    await user.click(screen.getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses renderDetail and renderBadges', async () => {
    const user = userEvent.setup();
    render(
      <OrgChart
        nodes={orgPeople}
        defaultView="list"
        renderBadges={(n) => (n.id === 'ceo' ? <span>Founder</span> : null)}
        renderDetail={(n, ctx) => (
          <button type="button" onClick={ctx.close}>
            Custom {n.name} {ctx.orgSize}
          </button>
        )}
      />
    );
    expect(
      within(item('Avery Morgan')).getByText('Founder')
    ).toBeInTheDocument();
    await user.click(item('Avery Morgan'));
    await user.click(
      screen.getByRole('button', { name: 'Custom Avery Morgan 24' })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('searches, reveals matches and announces the count', async () => {
    const user = userEvent.setup();
    render(<OrgChart nodes={orgPeople} defaultView="list" />);
    await user.type(screen.getByLabelText('Search'), 'priya');
    expect(screen.getByRole('status')).toHaveTextContent('1 match');
    expect(item('Priya Raman')).toHaveAttribute('data-matched', 'true');
    expect(item('Priya Raman')).toHaveAttribute('aria-level', '4');
    await user.clear(screen.getByLabelText('Search'));
    await user.type(screen.getByLabelText('Search'), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('No matches');
  });

  it('filters by group with a colour per group', async () => {
    const user = userEvent.setup();
    render(<OrgChart nodes={orgPeople} defaultView="list" />);
    const select = screen.getByRole('combobox', { name: 'Filter by group' });
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['All groups', 'Engineering', 'Operations', 'Sales']);
    await user.selectOptions(select, 'Sales');
    expect(item('Grace Liu')).not.toHaveClass('opacity-50');
    expect(item('Jordan Patel')).toHaveClass('opacity-50');
  });

  it('treats an unknown group as no filter', () => {
    render(
      <OrgChart nodes={orgPeople} defaultView="list" defaultGroup="Gone" />
    );
    expect(
      screen.getByRole('combobox', { name: 'Filter by group' })
    ).toHaveValue('');
    expect(item('Jordan Patel')).not.toHaveClass('opacity-50');
  });

  it('expands and collapses everything', async () => {
    const user = userEvent.setup();
    render(<OrgChart nodes={orgPeople} defaultView="list" />);
    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(treeItems()).toHaveLength(25);
    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(treeItems()).toHaveLength(1);
  });

  it('expands to and marks the highlighted node', () => {
    render(
      <OrgChart
        nodes={orgPeople}
        defaultView="list"
        highlightedId="ops-4"
        labels={{ highlighted: 'You' }}
      />
    );
    expect(item('Kwame Mensah')).toHaveAttribute('aria-current', 'true');
    expect(within(item('Kwame Mensah')).getByText('You')).toBeInTheDocument();
  });

  it('defaults to the list on narrow screens', () => {
    const spy = vi.spyOn(window, 'matchMedia').mockImplementation(
      (q) =>
        ({
          matches: q.includes('max-width'),
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList
    );
    render(<OrgChart nodes={orgLocations} nodeVariant="location" />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(item('North Region')).toHaveTextContent('4 clinics');
    spy.mockRestore();
  });
});

// =============================================================================
// States
// =============================================================================

describe('OrgChart states', () => {
  it('shows loading, then seeds expansion when data arrives', () => {
    const { rerender } = render(
      <OrgChart nodes={[]} loading defaultView="list" />
    );
    expect(screen.getByText('Loading organization')).toBeInTheDocument();
    rerender(<OrgChart nodes={orgPeople} defaultView="list" />);
    expect(treeItems()).toHaveLength(4);
  });

  it('shows empty and a custom empty state', () => {
    const { rerender } = render(<OrgChart nodes={[]} />);
    expect(screen.getByText(defaultOrgChartLabels.empty)).toBeInTheDocument();
    rerender(<OrgChart nodes={[]} emptyState={<p>Nobody yet</p>} />);
    expect(screen.getByText('Nobody yet')).toBeInTheDocument();
  });

  it('shows the error with retry and overridable labels', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <OrgChart
        nodes={[]}
        error={new Error('x')}
        onRetry={onRetry}
        labels={{ error: 'Kaputt', retry: 'Nochmal' }}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Kaputt');
    await user.click(screen.getByRole('button', { name: 'Nochmal' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

// =============================================================================
// Chart view
// =============================================================================

describe('OrgChart chart view', () => {
  it('lays out visible nodes and toggles reports', async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLDivElement>();
    render(
      <OrgChart
        ref={ref}
        nodes={orgPeople}
        defaultView="chart"
        className="custom"
      />
    );
    expect(ref.current).toHaveClass('custom');
    expect(
      screen.getByRole('region', { name: 'Organization chart' })
    ).toBeInTheDocument();
    expect(await screen.findByText('Jordan Patel')).toBeInTheDocument();
    expect(elk.calls).toHaveLength(1);

    const toggle = screen.getByRole('button', {
      name: 'Expand Jordan Patel, 2 reports',
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(await screen.findByText('Diego Alvarez')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Collapse Jordan Patel' })
    ).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByText('Diego Alvarez'));
    expect(
      screen.getByRole('dialog', { name: 'Diego Alvarez' })
    ).toBeInTheDocument();
  });

  it('toggles minimap, fullscreen fallback, fit and view', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const { container } = render(
      <OrgChart
        nodes={orgPeople}
        defaultView="chart"
        onViewChange={onViewChange}
        direction="RIGHT"
        focusId="eng-5"
      />
    );
    await screen.findByText('Omar Haddad');
    const minimap = screen.getByRole('button', { name: 'Minimap' });
    await user.click(minimap);
    expect(minimap).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Fit to view' }));

    const full = screen.getByRole('button', { name: 'Full screen' });
    await user.click(full);
    expect(full).toHaveAttribute('aria-pressed', 'true');
    expect(container.firstChild).toHaveClass('fixed');
    fireEvent.keyDown(full, { key: 'Escape' });
    expect(container.firstChild).not.toHaveClass('fixed');

    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(onViewChange).toHaveBeenCalledWith('list');
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('uses the native Fullscreen API when available', async () => {
    const user = userEvent.setup();
    const request = vi.fn(function (this: HTMLElement) {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: this,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
    const exit = vi.fn(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: null,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
    HTMLElement.prototype.requestFullscreen = request;
    document.exitFullscreen = exit;
    try {
      render(<OrgChart nodes={orgPeople} defaultView="list" />);
      const full = screen.getByRole('button', { name: 'Full screen' });
      await user.click(full);
      expect(request).toHaveBeenCalled();
      expect(full).toHaveAttribute('aria-pressed', 'true');
      await user.click(full);
      expect(exit).toHaveBeenCalled();
      expect(full).toHaveAttribute('aria-pressed', 'false');
    } finally {
      // @ts-expect-error jsdom has no Fullscreen API
      delete HTMLElement.prototype.requestFullscreen;
      // @ts-expect-error jsdom has no Fullscreen API
      delete document.exitFullscreen;
    }
  });

  it('renders location cards, custom nodes and the highlighted marker', async () => {
    const { rerender } = render(
      <OrgChart
        nodes={orgLocations}
        nodeVariant="location"
        defaultView="chart"
        highlightedId="c-1"
      />
    );
    expect(await screen.findByText('Fort Wayne, IN')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();

    rerender(
      <OrgChart
        nodes={orgLocations}
        nodeVariant="location"
        defaultView="chart"
        renderNode={(n, ctx) => (
          <span>{`${n.name} (${ctx.directReports})`}</span>
        )}
      />
    );
    expect(await screen.findByText('North Region (4)')).toBeInTheDocument();
    await act(async () => {});
  });
});
