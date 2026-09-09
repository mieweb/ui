import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  FreshnessBadge,
  FreshnessDot,
  freshnessLevel,
  daysSince,
} from './FreshnessBadge';

const NOW = new Date('2026-08-22T12:00:00Z');

describe('FreshnessBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buckets dates by the default thresholds', () => {
    expect(freshnessLevel('2026-08-01')).toBe('fresh');
    expect(freshnessLevel('2026-04-01')).toBe('aging');
    expect(freshnessLevel('2025-08-01')).toBe('stale');
  });

  it('respects custom thresholds', () => {
    const t = { fresh: 1, aging: 7 };
    expect(freshnessLevel('2026-08-22', t)).toBe('fresh');
    expect(freshnessLevel('2026-08-19', t)).toBe('aging');
    expect(freshnessLevel('2026-08-01', t)).toBe('stale');
  });

  it('computes whole days since, clamped at zero', () => {
    expect(daysSince('2026-08-20')).toBe(2);
    expect(daysSince('2026-09-01')).toBe(0);
  });

  it('renders today / yesterday / Nd ago text', () => {
    const { rerender } = renderWithTheme(<FreshnessBadge date="2026-08-22" />);
    expect(screen.getByText(/reviewed today/i)).toBeInTheDocument();
    rerender(<FreshnessBadge date="2026-08-21" />);
    expect(screen.getByText(/reviewed yesterday/i)).toBeInTheDocument();
    rerender(<FreshnessBadge date="2026-08-10" />);
    expect(screen.getByText(/reviewed 12d ago/i)).toBeInTheDocument();
  });

  it('uses a custom label verb', () => {
    renderWithTheme(<FreshnessBadge date="2026-08-20" label="Synced" />);
    expect(screen.getByText(/synced 2d ago/i)).toBeInTheDocument();
  });

  it('accepts Date objects', () => {
    renderWithTheme(<FreshnessBadge date={new Date('2026-08-15T00:00:00Z')} />);
    expect(screen.getByText(/reviewed 7d ago/i)).toBeInTheDocument();
  });

  it('dot exposes level and age to assistive tech', () => {
    renderWithTheme(<FreshnessDot date="2025-01-01" />);
    const dot = screen.getByRole('img');
    expect(dot).toHaveAccessibleName(/stale — reviewed \d+d ago/i);
  });

  it('treats unparseable dates as unknown instead of fresh or stale', () => {
    expect(freshnessLevel('not-a-date')).toBe('unknown');
    expect(freshnessLevel(new Date('invalid'))).toBe('unknown');
    expect(daysSince('not-a-date')).toBeNull();

    renderWithTheme(<FreshnessBadge date="not-a-date" />);
    expect(screen.getByText(/reviewed date unknown/i)).toBeInTheDocument();
  });
});
