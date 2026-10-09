import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { CalendarHeatmap } from './CalendarHeatmap';

const data = [
  { date: '2026-09-08', value: 2 },
  { date: '2026-09-08T10:00', value: 1 },
  { date: '2026-09-10', value: 1 },
  { date: '2026-10-30', value: 9 },
];
const range = { start: '2026-09-06', end: '2026-09-19', locale: 'en-US' };

describe('CalendarHeatmap', () => {
  it('survives an invalid or reversed range', () => {
    const { rerender } = render(
      <CalendarHeatmap data={data} start="not-a-date" end="2026-09-19" />
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    rerender(
      <CalendarHeatmap data={data} start="2026-09-19" end="2026-09-06" />
    );
    expect(screen.getByRole('table')).toHaveTextContent(
      '4 total across 2 active days'
    );
  });

  it('renders a labelled table with a summary and named day cells', () => {
    render(<CalendarHeatmap data={data} {...range} />);

    const table = screen.getByRole('table', { name: 'Activity calendar' });
    expect(table).toHaveTextContent('4 total across 2 active days');
    expect(within(table).getByText('Tue, Sep 8, 2026: 3')).toBeInTheDocument();
    expect(
      within(table).getByTitle('Sat, Sep 19, 2026: 0')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(8);
    expect(
      screen.getByRole('columnheader', { name: 'Sep' })
    ).toBeInTheDocument();
  });

  it('pads partial weeks when the week starts on another day', () => {
    const { container } = render(
      <CalendarHeatmap data={[]} {...range} weekStartsOn={1} />
    );
    expect(container.querySelectorAll('tbody td')).toHaveLength(21);
    expect(container.querySelectorAll('tbody td [title]')).toHaveLength(14);
    expect(screen.getByRole('table')).toHaveTextContent(
      '0 total across 0 active days'
    );
  });

  it('keeps a tab stop when the range drops the active day', () => {
    const props = { data, locale: 'en-US', onDayClick: vi.fn() };
    const { rerender } = render(
      <CalendarHeatmap {...props} start="2026-09-06" end="2026-09-19" />
    );
    act(() => screen.getByRole('button', { name: /Sep 8,/ }).focus());
    rerender(
      <CalendarHeatmap {...props} start="2026-09-13" end="2026-09-19" />
    );
    expect(
      screen.getByRole('button', { name: 'Sat, Sep 19, 2026: 0' })
    ).toHaveAttribute('tabindex', '0');
  });

  it('is an arrow-key navigable grid when interactive', () => {
    const onDayClick = vi.fn();
    render(<CalendarHeatmap data={data} {...range} onDayClick={onDayClick} />);

    const grid = screen.getByRole('grid');
    const buttons = within(grid).getAllByRole('button');
    expect(buttons).toHaveLength(14);
    const last = screen.getByRole('button', { name: 'Sat, Sep 19, 2026: 0' });
    expect(last).toHaveAttribute('tabindex', '0');

    act(() => last.focus());
    const press = (key: string) =>
      fireEvent.keyDown(document.activeElement!, { key });
    press('ArrowDown');
    expect(last).toHaveFocus();
    press('ArrowLeft');
    expect(screen.getByRole('button', { name: /Sep 12/ })).toHaveFocus();
    press('ArrowUp');
    expect(screen.getByRole('button', { name: /Sep 11/ })).toHaveFocus();

    fireEvent.click(
      screen.getByRole('button', { name: 'Tue, Sep 8, 2026: 3' })
    );
    expect(onDayClick).toHaveBeenCalledWith('2026-09-08');
  });

  it('accepts label overrides', () => {
    render(
      <CalendarHeatmap
        data={data}
        {...range}
        labels={{
          title: 'Engagement',
          cellLabel: (_d, v, iso) => `${iso}=${v}`,
        }}
      />
    );
    expect(
      screen.getByRole('table', { name: 'Engagement' })
    ).toBeInTheDocument();
    expect(screen.getByText('2026-09-10=1')).toBeInTheDocument();
  });

  it('defaults to the last 12 weeks', () => {
    const { container } = render(<CalendarHeatmap data={[]} />);
    expect(container.querySelectorAll('tbody td [title]')).toHaveLength(84);
  });
});
