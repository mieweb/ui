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

  it('marks the active spoke pressed in both ring and chip grid and selects the tab dot', () => {
    renderWithTheme(
      <RadialExplorer
        spokes={spokes}
        center={<span />}
        attractMs={0}
        defaultActiveId="a"
      />
    );
    expect(
      screen.getAllByRole('button', { name: 'Alpha', pressed: true })
    ).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
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
    fireEvent.click(screen.getByRole('tab', { name: 'Alpha' }));
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
      expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      act(() => vi.advanceTimersByTime(500));
      expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Gamma' }));
      act(() => vi.advanceTimersByTime(2000));
      expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
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
