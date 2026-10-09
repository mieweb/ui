import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RadialExplorer, type RadialSpoke } from './RadialExplorer';

const spokes: RadialSpoke[] = [
  {
    id: 'a',
    label: 'Alpha',
    icon: <i />,
    description: 'Alpha body',
    href: '/a',
  },
  {
    id: 'b',
    label: 'Beta',
    icon: <i />,
    title: 'Beta title',
    cta: { label: 'Go', href: '/go' },
  },
  { id: 'c', label: 'Gamma', icon: <i /> },
];

describe('RadialExplorer', () => {
  it('shows the welcome panel until a spoke is chosen, then the spoke detail', () => {
    renderWithTheme(
      <RadialExplorer
        spokes={spokes}
        center={<span />}
        attractMs={0}
        welcome={{ title: 'Welcome' }}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Welcome' })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Beta', pressed: false })[0]
    );
    expect(
      screen.getByRole('heading', { name: 'Beta title' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go/ })).toHaveAttribute(
      'href',
      '/go'
    );
  });

  it('marks the active spoke pressed in ring, chip grid, and dot nav', () => {
    renderWithTheme(
      <RadialExplorer
        spokes={spokes}
        center={<span />}
        attractMs={0}
        defaultActiveId="a"
      />
    );
    // Ring node, mobile chip, and dot all reflect the active spoke.
    expect(
      screen.getAllByRole('button', { name: 'Alpha', pressed: true })
    ).toHaveLength(3);
    expect(
      screen.getAllByRole('button', { name: 'Beta', pressed: false })
    ).toHaveLength(3);
    expect(
      screen.getByRole('link', { name: 'Explore module' })
    ).toHaveAttribute('href', '/a');
  });

  it('supports controlled mode', () => {
    const onActiveChange = vi.fn();
    renderWithTheme(
      <RadialExplorer
        spokes={spokes}
        center={<span />}
        attractMs={0}
        activeId="c"
        onActiveChange={onActiveChange}
      />
    );
    expect(screen.getByRole('heading', { name: 'Gamma' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Alpha' })[0]);
    expect(onActiveChange).toHaveBeenCalledWith('a');
    // still controlled — heading unchanged
    expect(screen.getByRole('heading', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('auto-advances until the visitor engages', () => {
    vi.useFakeTimers();
    try {
      renderWithTheme(
        <RadialExplorer spokes={spokes} center={<span />} attractMs={500} />
      );
      act(() => vi.advanceTimersByTime(500));
      expect(
        screen.getAllByRole('button', { name: 'Alpha', pressed: true })
      ).toHaveLength(3);
      act(() => vi.advanceTimersByTime(500));
      expect(
        screen.getAllByRole('button', { name: 'Beta', pressed: true })
      ).toHaveLength(3);
      fireEvent.click(screen.getAllByRole('button', { name: 'Gamma' })[0]);
      act(() => vi.advanceTimersByTime(2000));
      expect(
        screen.getAllByRole('button', { name: 'Gamma', pressed: true })
      ).toHaveLength(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('draws the tracer ray only when a spoke is active', () => {
    const { container, rerender } = renderWithTheme(
      <RadialExplorer spokes={spokes} center={<span />} attractMs={0} />
    );
    expect(
      container.querySelector('[data-slot="radial-explorer-ray"]')
    ).toBeNull();
    rerender(
      <RadialExplorer
        spokes={spokes}
        center={<span />}
        attractMs={0}
        activeId="b"
      />
    );
    const ray = container.querySelector<HTMLElement>(
      '[data-slot="radial-explorer-ray"]'
    );
    expect(ray?.style.transform).toContain('rotate(30deg)'); // index 1 of 3 → 120° − 90°
  });
});
