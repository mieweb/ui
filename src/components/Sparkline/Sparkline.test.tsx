import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Sparkline, type SparklinePoint } from './Sparkline';

const DATA: SparklinePoint[] = [
  { key: '2026-08-20', label: 'Aug 20', value: 4 },
  { key: '2026-08-21', label: 'Aug 21', value: 0 },
  { key: '2026-08-22', label: 'Aug 22', value: 12 },
];

describe('Sparkline', () => {
  it('renders read-only bars with accessible names', () => {
    renderWithTheme(<Sparkline data={DATA} />);
    expect(
      screen.getByRole('group', { name: 'Activity over time' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Aug 22 — 12' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('scales bars to the series maximum with a stub for zero', () => {
    renderWithTheme(<Sparkline data={DATA} />);
    expect(screen.getByRole('img', { name: 'Aug 22 — 12' })).toHaveStyle({
      height: '100%',
    });
    expect(screen.getByRole('img', { name: 'Aug 21 — 0' })).toHaveStyle({
      height: '6%',
    });
    // 4/12 = 33%
    expect(screen.getByRole('img', { name: 'Aug 20 — 4' })).toHaveStyle({
      height: '33%',
    });
  });

  it('toggles selection when interactive', () => {
    const onSelect = vi.fn();
    renderWithTheme(
      <Sparkline data={DATA} selectedKey="2026-08-22" onSelect={onSelect} />
    );
    const selected = screen.getByRole('button', { name: 'Aug 22 — 12' });
    expect(selected).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(selected);
    expect(onSelect).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole('button', { name: 'Aug 20 — 4' }));
    expect(onSelect).toHaveBeenCalledWith('2026-08-20');
  });

  it('renders the track label', () => {
    renderWithTheme(<Sparkline data={DATA} label="Calls" />);
    expect(screen.getByText('Calls')).toBeInTheDocument();
  });

  it('formats values for accessible names', () => {
    renderWithTheme(
      <Sparkline data={DATA} formatValue={(p) => `${p.value} events`} />
    );
    expect(
      screen.getByRole('img', { name: 'Aug 22 — 12 events' })
    ).toBeInTheDocument();
  });

  it('falls back to the key when label is omitted', () => {
    renderWithTheme(<Sparkline data={[{ key: 'wk-34', value: 2 }]} />);
    expect(screen.getByRole('img', { name: 'wk-34 — 2' })).toBeInTheDocument();
  });
});
