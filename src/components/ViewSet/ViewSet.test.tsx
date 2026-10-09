import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewSet } from './ViewSet';
import {
  TODAY,
  workItemAccessors,
  workItems,
  workItemStages,
} from '../ListView/storyData';

const base = {
  items: workItems,
  accessors: workItemAccessors,
  stages: workItemStages,
  now: TODAY,
  views: ['overview', 'list', 'board', 'calendar', 'gantt', 'table'] as const,
};

const pick = (name: string) => screen.getByRole('radio', { name });

describe('ViewSet', () => {
  beforeEach(() => globalThis.localStorage?.clear());

  it('renders the switcher and starts on the first view', () => {
    render(<ViewSet {...base} views={['list', 'board']} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(pick('List')).toBeChecked();
  });

  it('honours defaultView', () => {
    render(<ViewSet {...base} defaultView="board" />);
    expect(pick('Board')).toBeChecked();
  });

  it('swaps the rendered view', async () => {
    const user = userEvent.setup();
    render(<ViewSet {...base} views={['list', 'board']} />);
    expect(screen.getByRole('list', { name: /Backlog/i })).toBeInTheDocument();
    await user.click(pick('Board'));
    // The board labels its column lists the same way, but adds headings.
    expect(
      screen.getByRole('heading', { name: /In progress/i })
    ).toBeInTheDocument();
  });

  it('stays controlled when `view` is given and reports the request', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<ViewSet {...base} view="list" onViewChange={onViewChange} />);
    await user.click(pick('Board'));
    expect(onViewChange).toHaveBeenCalledWith('board');
    expect(pick('List')).toBeChecked();
  });

  it('remembers the view under storageKey', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ViewSet {...base} storageKey="vs-test" />);
    await user.click(pick('Calendar'));
    expect(globalThis.localStorage.getItem('vs-test')).toBe('calendar');
    unmount();
    render(<ViewSet {...base} storageKey="vs-test" />);
    expect(pick('Calendar')).toBeChecked();
  });

  it('ignores a stored view that is no longer offered', () => {
    globalThis.localStorage.setItem('vs-test', 'gantt');
    render(
      <ViewSet {...base} views={['list', 'board']} storageKey="vs-test" />
    );
    expect(pick('List')).toBeChecked();
  });

  it('does not write to storage while controlled', async () => {
    const user = userEvent.setup();
    render(
      <ViewSet
        {...base}
        view="list"
        storageKey="vs-test"
        onViewChange={() => {}}
      />
    );
    await user.click(pick('Board'));
    expect(globalThis.localStorage.getItem('vs-test')).toBeNull();
  });

  it('renders the overview and table slots rather than a view component', async () => {
    const user = userEvent.setup();
    render(
      <ViewSet
        {...base}
        overview={<p>Overview content</p>}
        table={<p>Grid goes here</p>}
      />
    );
    await user.click(pick('Overview'));
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    await user.click(pick('Table'));
    expect(screen.getByText('Grid goes here')).toBeInTheDocument();
  });

  it('renders the roadmap id as a coarse Gantt', async () => {
    const user = userEvent.setup();
    render(<ViewSet {...base} views={['list', 'roadmap']} />);
    await user.click(pick('Roadmap'));
    expect(screen.getAllByText(/^Q\d 20\d\d$/).length).toBeGreaterThan(0);
  });

  it('keeps the roadmap coarse even when ganttProps sets a fine cadence', async () => {
    // `ganttProps` is shared with the plain `gantt` view, so a cadence meant
    // for that one must not redefine what the Roadmap option means.
    const user = userEvent.setup();
    render(
      <ViewSet
        {...base}
        views={['list', 'roadmap']}
        ganttProps={{ cadence: 'day', groupByLane: false }}
      />
    );
    await user.click(pick('Roadmap'));
    expect(screen.getAllByText(/^Q\d 20\d\d$/).length).toBeGreaterThan(0);
  });

  it('renders toolbar, filters and detail slots', () => {
    render(
      <ViewSet
        {...base}
        toolbar={<button type="button">New</button>}
        filters={<p>Filter bar</p>}
        detail={<p>Detail pane</p>}
      />
    );
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
    expect(screen.getByText('Filter bar')).toBeInTheDocument();
    expect(screen.getByText('Detail pane')).toBeInTheDocument();
  });

  it('does not offer overview or table without their slot', () => {
    render(<ViewSet {...base} />);
    expect(screen.queryByRole('radio', { name: 'Overview' })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Table' })).toBeNull();
    expect(pick('List')).toBeChecked();
  });

  it('falls back off a view that stops being offered', () => {
    const { rerender } = render(
      <ViewSet
        {...base}
        overview={<p>Overview content</p>}
        defaultView="overview"
      />
    );
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    rerender(<ViewSet {...base} defaultView="overview" />);
    expect(pick('List')).toBeChecked();
  });

  it('passes the shared load states down to the active view', () => {
    render(<ViewSet {...base} items={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('forwards per-view overrides', () => {
    render(
      <ViewSet {...base} views={['list']} listProps={{ groupBy: 'group' }} />
    );
    expect(
      screen.getByRole('button', { name: /Implementation/i })
    ).toBeInTheDocument();
  });

  it('does not seed status stages when a view groups by group', () => {
    // The shell always passes its shared `stages`, so grouping by group used to
    // print an empty heading for every status above the real buckets.
    render(
      <ViewSet {...base} views={['list']} listProps={{ groupBy: 'group' }} />
    );
    expect(
      screen.queryByRole('button', { name: /Backlog/i })
    ).not.toBeInTheDocument();
  });

  it('lets a caller rename the switcher group', () => {
    render(
      <ViewSet
        {...base}
        views={['list', 'board']}
        labels={{ viewSwitcher: 'Affichage' }}
      />
    );
    expect(
      screen.getByRole('radiogroup', { name: 'Affichage' })
    ).toBeInTheDocument();
  });

  it('carries labels a single layout adds, not just the shared ones', () => {
    // Each view extends ViewLabels with its own strings. They are shared props,
    // so the per-view escape hatches cannot reach them — the shell has to be
    // able to carry them or a non-English host could translate the common
    // strings and nothing else.
    render(
      <ViewSet
        {...base}
        defaultView="calendar"
        labels={{ nextMonth: 'Mois suivant' }}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Mois suivant' })
    ).toBeInTheDocument();
  });

  it('gives the board its move handler', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<ViewSet {...base} defaultView="board" onMove={onMove} />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    card.focus();
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    expect(onMove).toHaveBeenCalledWith('WGL-106', 'in-progress', workItems[5]);
  });
});
