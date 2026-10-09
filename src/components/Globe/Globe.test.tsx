import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';

// jsdom has no WebGL — stub the globe with a probe that exposes the props we
// pass and lets tests fire point clicks.
vi.mock('react-globe.gl', () => ({
  default: React.forwardRef(function GlobeStub(
    props: Record<string, unknown>,
    _ref
  ) {
    const pts = props.pointsData as Array<{ name: string }>;
    const arcs = props.arcsData as unknown[];
    return (
      <div
        data-testid="globe-stub"
        data-arcs={arcs.length}
        data-points={pts.length}
      >
        {pts.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => (props.onPointClick as (d: object) => void)(p)}
          >
            {p.name}
          </button>
        ))}
      </div>
    );
  }),
}));
vi.mock('three', () => ({ MeshPhongMaterial: class {} }));

import { Globe, buildArcs, type GlobePoint } from './Globe';

const points: GlobePoint[] = [
  { id: 'h1', lat: 41, lng: -85, name: 'Fort Wayne', hub: true },
  {
    id: 'h2',
    lat: 51.5,
    lng: 0,
    name: 'London',
    hub: true,
    timeZone: 'Europe/London',
    flag: '🇬🇧',
    sub: 'EMEA hub',
  },
  { id: 'c1', lat: -23.5, lng: -46.6, name: 'São Paulo' },
  { id: 'c2', lat: 50.1, lng: 8.7, name: 'Frankfurt' },
];

describe('buildArcs', () => {
  it('spokes each city to its nearest hub and rings the hubs', () => {
    const arcs = buildArcs(points);
    const spokes = arcs.filter((a) => a.kind === 'spoke');
    const ring = arcs.filter((a) => a.kind === 'backbone');
    expect(spokes).toHaveLength(2);
    expect(ring).toHaveLength(2); // 2 hubs → h1→h2, h2→h1
    // São Paulo → Fort Wayne, Frankfurt → London
    expect(spokes[0]).toMatchObject({ endLat: 41, endLng: -85 });
    expect(spokes[1]).toMatchObject({ endLat: 51.5, endLng: 0 });
  });

  it('returns nothing without hubs and skips the ring when asked', () => {
    expect(buildArcs(points.map((p) => ({ ...p, hub: false })))).toEqual([]);
    expect(buildArcs(points, false).every((a) => a.kind === 'spoke')).toBe(
      true
    );
  });
});

describe('Globe', () => {
  const mountSized = () => {
    // The globe mounts only once the frame has a measured size.
    const ro = vi.fn((cb: globalThis.ResizeObserverCallback) => ({
      observe: () =>
        cb(
          [
            {
              contentRect: { width: 800, height: 500 },
            } as globalThis.ResizeObserverEntry,
          ],
          {} as globalThis.ResizeObserver
        ),
      disconnect: () => {},
      unobserve: () => {},
    }));
    vi.stubGlobal('ResizeObserver', ro);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ json: () => Promise.resolve({ features: [] }) })
      )
    );
  };

  it('passes points and auto-built arcs to the globe', () => {
    mountSized();
    renderWithTheme(<Globe points={points} />);
    const stub = screen.getByTestId('globe-stub');
    expect(stub).toHaveAttribute('data-points', '4');
    expect(stub).toHaveAttribute('data-arcs', '4');
  });

  it('opens a callout with flag, sub and local clock on point click, and dismisses', () => {
    mountSized();
    const onSelect = vi.fn();
    renderWithTheme(<Globe points={points} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'London' }));
    const callout = screen.getByRole('status');
    expect(callout).toHaveTextContent('🇬🇧');
    expect(callout).toHaveTextContent('London');
    expect(callout).toHaveTextContent('EMEA hub');
    expect(callout).toHaveTextContent(/\d{2}:\d{2}/);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'h2' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('respects controlled selection', () => {
    mountSized();
    renderWithTheme(<Globe points={points} selectedId="c1" />);
    expect(screen.getByRole('status')).toHaveTextContent('São Paulo');
    fireEvent.click(screen.getByRole('button', { name: 'London' }));
    expect(screen.getByRole('status')).toHaveTextContent('São Paulo');
  });
});
