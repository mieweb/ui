import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { OrbitRing } from './OrbitRing';

const onBeta = vi.fn();
const rings = [
  {
    radius: 0.25,
    satellites: [
      { id: 'a', name: 'Alpha', href: '/a' },
      { id: 'b', name: 'Beta', onClick: onBeta },
      { id: 'c', name: 'Gamma' },
    ],
  },
  {
    radius: 0.4,
    durationSec: 30,
    satellites: [{ id: 'd', name: 'Delta', href: '/d' }],
  },
];

describe('OrbitRing', () => {
  it('renders links, buttons and decorative chips by satellite shape', () => {
    renderWithTheme(<OrbitRing rings={rings} center={<span>core</span>} />);
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute(
      'href',
      '/a'
    );
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gamma' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onBeta).toHaveBeenCalled();
  });

  it('places satellites evenly around each ring', () => {
    const { container } = renderWithTheme(<OrbitRing rings={rings} />);
    const sats = container.querySelectorAll<HTMLElement>(
      '[data-slot="orbit-ring-satellite"]'
    );
    expect(sats).toHaveLength(4);
    // three on the inner ring: 0°, 120°, 240° at radius 25cqmin
    expect(sats[0].style.transform).toContain(
      'translate(25.00cqmin, 0.00cqmin)'
    );
    expect(sats[1].style.transform).toContain(
      'translate(-12.50cqmin, 21.65cqmin)'
    );
    expect(sats[3].style.transform).toContain(
      'translate(40.00cqmin, 0.00cqmin)'
    );
  });

  it('alternates ring direction and applies per-ring duration', () => {
    const { container } = renderWithTheme(<OrbitRing rings={rings} />);
    const tracks = container.querySelectorAll<HTMLElement>(
      '[data-slot="orbit-ring-track"]'
    );
    expect(tracks[0].style.animationDirection).toBe('normal');
    expect(tracks[1].style.animationDirection).toBe('reverse');
    expect(tracks[1].style.getPropertyValue('--dur')).toBe('30s');
  });

  it('falls back to a lettermark when a satellite has no content', () => {
    renderWithTheme(<OrbitRing rings={rings} />);
    expect(screen.getByText('Ga')).toBeInTheDocument();
  });
});
