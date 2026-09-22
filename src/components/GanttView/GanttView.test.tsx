import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GanttView } from './GanttView';
import {
  TODAY,
  workItemAccessors,
  workItems,
  type WorkItem,
} from '../ListView/storyData';

const base = {
  items: workItems,
  accessors: workItemAccessors,
  now: TODAY,
  timeZone: 'UTC',
};

const dated = (
  id: string,
  title: string,
  startDate: string,
  dueDate: string
): WorkItem => ({
  ...workItems[0],
  id,
  title,
  startDate,
  dueDate,
});

const bar = (name: RegExp | string) =>
  screen.getByText(name).closest('[data-slot="gantt-view-bar"]')
    ?.parentElement as HTMLElement;

describe('GanttView', () => {
  it('draws one column per cadence unit across the range', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated('A', 'A', '2026-03-02T00:00:00Z', '2026-03-20T00:00:00Z'),
        ]}
        cadence="week"
      />
    );
    // 2 Mar and 20 Mar 2026 fall in three ISO weeks.
    expect(screen.getAllByText(/^W\d+$/)).toHaveLength(3);
  });

  it('spans a bar across the columns its range covers', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated('A', 'Spans', '2026-03-02T00:00:00Z', '2026-03-20T00:00:00Z'),
        ]}
        cadence="week"
      />
    );
    expect(bar('Spans')).toHaveStyle({ gridColumn: '1 / span 3' });
  });

  it('gives a single-day item a one-column bar', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated('A', 'Early', '2026-03-02T00:00:00Z', '2026-03-02T00:00:00Z'),
          dated('B', 'Late', '2026-03-23T00:00:00Z', '2026-03-23T00:00:00Z'),
        ]}
        cadence="week"
      />
    );
    expect(bar('Early')).toHaveStyle({ gridColumn: '1 / span 1' });
    expect(bar('Late')).toHaveStyle({ gridColumn: '4 / span 1' });
  });

  it('changes column width with cadence', () => {
    const items = [
      dated('A', 'A', '2026-01-05T00:00:00Z', '2026-03-20T00:00:00Z'),
    ];
    const { rerender } = render(
      <GanttView {...base} items={items} cadence="month" />
    );
    expect(screen.getAllByText(/Jan|Feb|Mar/)).toHaveLength(3);
    rerender(<GanttView {...base} items={items} cadence="quarter" />);
    expect(screen.getAllByText(/^Q1 2026$/)).toHaveLength(1);
  });

  it('honours an explicit range over the items own extent', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated('A', 'A', '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
        ]}
        cadence="month"
        rangeStart={new Date('2026-01-01T00:00:00Z')}
        rangeEnd={new Date('2026-04-30T00:00:00Z')}
      />
    );
    expect(screen.getAllByText(/Jan|Feb|Mar|Apr/)).toHaveLength(4);
  });

  it('draws one column when an explicit range is given backwards', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated('A', 'A', '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
        ]}
        cadence="month"
        rangeStart={new Date('2026-04-30T00:00:00Z')}
        rangeEnd={new Date('2026-01-01T00:00:00Z')}
      />
    );
    expect(screen.getAllByText(/Jan|Feb|Mar|Apr/)).toHaveLength(1);
    expect(screen.queryByText('Nothing to place on the timeline')).toBeNull();
  });

  it('clamps a backwards range to one column', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated(
            'A',
            'Backwards',
            '2026-03-20T00:00:00Z',
            '2026-03-02T00:00:00Z'
          ),
        ]}
        cadence="week"
      />
    );
    expect(bar('Backwards')).toHaveStyle({ gridColumn: '1 / span 1' });
  });

  it('draws the requested range when nothing is dated yet', () => {
    render(
      <GanttView
        {...base}
        items={[]}
        cadence="month"
        rangeStart={new Date('2026-01-01T00:00:00Z')}
        rangeEnd={new Date('2026-03-31T00:00:00Z')}
      />
    );
    expect(screen.getAllByText(/Jan|Feb|Mar/)).toHaveLength(3);
  });

  it('omits a record that falls entirely outside an explicit range', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated('IN', 'Inside', '2026-02-10T00:00:00Z', '2026-02-20T00:00:00Z'),
          dated(
            'OUT',
            'Outside',
            '2025-06-01T00:00:00Z',
            '2025-06-10T00:00:00Z'
          ),
        ]}
        cadence="month"
        rangeStart={new Date('2026-01-01T00:00:00Z')}
        rangeEnd={new Date('2026-03-31T00:00:00Z')}
      />
    );
    expect(screen.getByText('Inside')).toBeInTheDocument();
    // Clamping would have drawn it on January as though it belonged there.
    expect(screen.queryByText('Outside')).toBeNull();
  });

  it('clips a record that only partly overlaps the range', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated(
            'OVER',
            'Overlaps',
            '2025-12-01T00:00:00Z',
            '2026-02-15T00:00:00Z'
          ),
        ]}
        cadence="month"
        rangeStart={new Date('2026-01-01T00:00:00Z')}
        rangeEnd={new Date('2026-03-31T00:00:00Z')}
      />
    );
    expect(bar('Overlaps')).toHaveStyle({ gridColumn: '1 / span 2' });
  });

  it('counts the records a time axis cannot place', () => {
    render(<GanttView {...base} />);
    // WGL-103 and WGL-106 have no start date.
    expect(screen.getByText('2 without dates')).toBeInTheDocument();
  });

  it('shows the empty state when nothing is dated', () => {
    render(
      <GanttView
        {...base}
        items={[{ ...workItems[0], id: 'N', startDate: null, dueDate: null }]}
      />
    );
    expect(
      screen.getByText('Nothing to place on the timeline')
    ).toBeInTheDocument();
  });

  it('groups rows into swimlanes when asked', () => {
    render(<GanttView {...base} groupByLane />);
    expect(
      screen.getByRole('heading', { name: 'Implementation' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Operations' })
    ).toBeInTheDocument();
  });

  it('does not group by default', () => {
    render(<GanttView {...base} />);
    expect(screen.queryByRole('heading', { name: 'Operations' })).toBeNull();
  });

  it('renders bars as anchors when getHref is given', () => {
    render(<GanttView {...base} getHref={(id) => `/work/${id}`} />);
    expect(screen.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/work/')
    );
  });

  it('renders inert bars when neither onOpen nor getHref is given', () => {
    render(<GanttView {...base} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('reports the opened item', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<GanttView {...base} onOpen={onOpen} />);
    await user.click(
      screen.getByRole('button', { name: /Clinic network coverage/i })
    );
    expect(onOpen).toHaveBeenCalledWith('WGL-102', workItems[1]);
  });

  it('marks the selected bar as current', () => {
    render(<GanttView {...base} selectedId="WGL-102" onOpen={() => {}} />);
    expect(
      screen.getByRole('button', { name: /Clinic network coverage/i })
    ).toHaveAttribute('aria-current', 'true');
  });

  it('shows the loading state as a status region', () => {
    render(<GanttView {...base} items={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('shows the error state as an alert, in preference to loading', () => {
    render(<GanttView {...base} items={[]} loading error={new Error('x')} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load this view'
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('overrides strings through labels', () => {
    render(
      <GanttView {...base} items={[]} labels={{ empty: 'No schedule yet' }} />
    );
    expect(screen.getByText('No schedule yet')).toBeInTheDocument();
  });

  it('caps the column count rather than drawing a decade of days', () => {
    render(
      <GanttView
        {...base}
        items={[
          dated('A', 'A', '2020-01-01T00:00:00Z', '2030-01-01T00:00:00Z'),
        ]}
        cadence="day"
      />
    );
    expect(screen.getAllByText(/\d+ \w{3}/).length).toBeLessThanOrEqual(200);
  });
});
