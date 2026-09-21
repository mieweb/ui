import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarView } from './CalendarView';
import {
  TODAY,
  workItemAccessors,
  workItems,
  type WorkItem,
} from '../ListView/storyData';

// Everything is pinned to a UTC zone and a fixed `now`, so a run in Auckland
// and a run in California place the same items on the same days.
const base = {
  items: workItems,
  accessors: workItemAccessors,
  now: TODAY,
  timeZone: 'UTC',
};

const grid = () => screen.getByRole('table');
const cellFor = (isoDate: string) =>
  screen
    .getByText(
      (_, el) =>
        el?.tagName === 'TIME' && el.getAttribute('dateTime') === isoDate
    )
    .closest('[role="cell"]') as HTMLElement;

describe('CalendarView', () => {
  it('renders a six-week grid so the height does not change between months', () => {
    render(<CalendarView {...base} />);
    expect(screen.getAllByRole('cell')).toHaveLength(42);
  });

  it('labels the grid with the month it is showing', () => {
    render(<CalendarView {...base} />);
    expect(grid()).toHaveAccessibleName('March 2026');
  });

  it('starts the week on Monday by default and honours weekStartsOn', () => {
    const { rerender } = render(<CalendarView {...base} />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent(/Mon/i);
    rerender(<CalendarView {...base} weekStartsOn={7} />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent(/Sun/i);
  });

  it('marks days outside the month and the current day', () => {
    render(<CalendarView {...base} />);
    expect(cellFor('2026-02-23')).toHaveAttribute('data-outside');
    expect(cellFor('2026-03-18')).toHaveAttribute('data-today');
    expect(cellFor('2026-03-18')).not.toHaveAttribute('data-outside');
  });

  it('repeats a multi-day item on every day it covers', () => {
    render(
      <CalendarView
        {...base}
        items={[
          {
            ...workItems[0],
            id: 'SPAN',
            title: 'Spans three days',
            startDate: '2026-03-10T00:00:00Z',
            dueDate: '2026-03-12T00:00:00Z',
          },
        ]}
      />
    );
    for (const date of ['2026-03-10', '2026-03-11', '2026-03-12']) {
      expect(
        within(cellFor(date)).getByText('Spans three days')
      ).toBeInTheDocument();
    }
    expect(
      within(cellFor('2026-03-13')).queryByText('Spans three days')
    ).toBeNull();
  });

  it('puts the range in the accessible name of a multi-day entry', () => {
    render(
      <CalendarView
        {...base}
        onOpen={() => {}}
        items={[
          {
            ...workItems[0],
            id: 'SPAN',
            title: 'Spans three days',
            startDate: '2026-03-10T00:00:00Z',
            dueDate: '2026-03-12T00:00:00Z',
          },
        ]}
      />
    );
    expect(
      screen.getAllByRole('button', {
        name: 'Spans three days, 2026-03-10 to 2026-03-12',
      })
    ).toHaveLength(3);
  });

  it('clamps a backwards range to a single day instead of vanishing', () => {
    render(
      <CalendarView
        {...base}
        items={[
          {
            ...workItems[0],
            id: 'BACKWARDS',
            title: 'Backwards',
            startDate: '2026-03-12T00:00:00Z',
            dueDate: '2026-03-10T00:00:00Z',
          },
        ]}
      />
    );
    expect(
      within(cellFor('2026-03-12')).getByText('Backwards')
    ).toBeInTheDocument();
    expect(within(cellFor('2026-03-11')).queryByText('Backwards')).toBeNull();
  });

  it('skips items with no start date', () => {
    render(
      <CalendarView
        {...base}
        items={[
          {
            ...workItems[0],
            id: 'NODATE',
            title: 'No date',
            startDate: null,
            dueDate: null,
          },
        ]}
      />
    );
    expect(screen.queryByText('No date')).toBeNull();
    expect(screen.getByText('Nothing this month')).toBeInTheDocument();
  });

  it('collapses past maxPerDay into an overflow count', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...workItems[0],
      id: `M-${i}`,
      title: `Item ${i}`,
      startDate: '2026-03-10T00:00:00Z',
      dueDate: '2026-03-10T00:00:00Z',
    }));
    render(<CalendarView {...base} items={many} maxPerDay={2} />);
    const cell = cellFor('2026-03-10');
    expect(within(cell).getByText('3 more')).toBeInTheDocument();
    expect(within(cell).queryByText('Item 4')).toBeNull();
  });

  it('moves between months and back to today', async () => {
    const user = userEvent.setup();
    render(<CalendarView {...base} />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(grid()).toHaveAccessibleName('April 2026');
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(grid()).toHaveAccessibleName('February 2026');
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(grid()).toHaveAccessibleName('March 2026');
  });

  it('reports month changes and stays controlled when `month` is given', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <CalendarView
        {...base}
        month={new Date('2026-03-01T00:00:00Z')}
        onMonthChange={onMonthChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onMonthChange).toHaveBeenCalledOnce();
    expect(grid()).toHaveAccessibleName('March 2026');
  });

  it('renders entries as anchors when getHref is given', () => {
    render(<CalendarView {...base} getHref={(id) => `/work/${id}`} />);
    const link = screen.getAllByRole('link')[0];
    expect(link).toHaveAttribute('href', expect.stringContaining('/work/'));
  });

  it('renders inert entries when neither onOpen nor getHref is given', () => {
    render(<CalendarView {...base} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: /WGL-/i })).toHaveLength(0);
  });

  it('reports the opened item', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<CalendarView {...base} onOpen={onOpen} />);
    await user.click(
      within(cellFor('2026-03-16')).getByRole('button', {
        name: /Clinic network coverage/i,
      })
    );
    expect(onOpen).toHaveBeenCalledWith('WGL-102', workItems[1]);
  });

  it('hides the toolbar when the host renders its own', () => {
    render(<CalendarView {...base} hideToolbar />);
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('shows the loading state as a status region', () => {
    render(<CalendarView {...base} items={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('shows the error state as an alert, in preference to loading', () => {
    render(
      <CalendarView {...base} items={[]} loading error={new Error('x')} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load this view'
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('overrides strings through labels', () => {
    render(
      <CalendarView {...base} items={[]} labels={{ empty: 'Clear month' }} />
    );
    expect(screen.getByText('Clear month')).toBeInTheDocument();
  });

  it('stays on the right month in a zone behind UTC', () => {
    render(<CalendarView {...base} timeZone="America/New_York" />);
    expect(grid()).toHaveAccessibleName('March 2026');
  });

  it('draws a different day boundary in a different zone', () => {
    const item: WorkItem = {
      ...workItems[0],
      id: 'TZ',
      title: 'Late night',
      startDate: '2026-03-10T23:30:00Z',
      dueDate: '2026-03-10T23:30:00Z',
    };
    const { rerender } = render(<CalendarView {...base} items={[item]} />);
    expect(
      within(cellFor('2026-03-10')).getByText('Late night')
    ).toBeInTheDocument();
    rerender(
      <CalendarView {...base} items={[item]} timeZone="Pacific/Auckland" />
    );
    expect(
      within(cellFor('2026-03-11')).getByText('Late night')
    ).toBeInTheDocument();
  });
});
