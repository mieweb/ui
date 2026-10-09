import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityFeed } from './ActivityFeed';
import {
  activities,
  activityAccessors,
  activityCategories,
  activityNow,
  activityZone,
} from './storyData';

const base = {
  items: activities,
  ...activityAccessors,
  categories: activityCategories,
  now: activityNow,
  timeZone: activityZone,
  locale: 'en-US',
};

afterEach(() => window.localStorage.clear());

describe('ActivityFeed', () => {
  it('groups by day, newest first, with Today and Yesterday headers', () => {
    render(<ActivityFeed {...base} />);
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings).toEqual(['Today', 'Yesterday', 'Monday, March 9']);
    const today = screen.getByRole('region', { name: 'Today' });
    expect(within(today).getAllByRole('listitem')).toHaveLength(2);
  });

  it('adds the year to dates outside the current year', () => {
    render(
      <ActivityFeed
        {...base}
        items={[{ ...activities[0], at: '2025-12-30T15:00:00Z' }]}
      />
    );
    expect(screen.getByRole('heading')).toHaveTextContent('2025');
  });

  it('filters by category and announces the count', async () => {
    render(<ActivityFeed {...base} />);
    await userEvent.click(screen.getByRole('button', { name: 'Calls' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(await screen.findByText('2 activities shown')).toBeInTheDocument();
  });

  it('offers to clear filters when none match', async () => {
    render(<ActivityFeed {...base} items={[activities[0]]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Notes' }));
    expect(
      screen.getByText('No activity matches these filters')
    ).toBeInTheDocument();
    const clears = screen.getAllByRole('button', { name: 'All' });
    await userEvent.click(clears[clears.length - 1]);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('persists filters and density under storageKey', async () => {
    const { unmount } = render(<ActivityFeed {...base} storageKey="feed" />);
    await userEvent.click(screen.getByRole('button', { name: 'Emails' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compact view' }));
    expect(JSON.parse(window.localStorage.getItem('feed')!)).toEqual({
      categories: ['email'],
      density: 'compact',
    });
    unmount();

    render(<ActivityFeed {...base} storageKey="feed" />);
    expect(screen.getByRole('button', { name: 'Emails' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('ignores malformed stored preferences', () => {
    window.localStorage.setItem('feed', '{"categories":[1],"density":"x"}');
    render(<ActivityFeed {...base} storageKey="feed" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(activities.length);
    window.localStorage.setItem('bad', 'not json');
    render(<ActivityFeed {...base} storageKey="bad" />);
  });

  it('ignores persisted category ids that no longer exist', () => {
    window.localStorage.setItem(
      'feed',
      JSON.stringify({ categories: ['removed-category'] })
    );
    render(<ActivityFeed {...base} storageKey="feed" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(activities.length);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('hides descriptions in compact density', async () => {
    render(<ActivityFeed {...base} />);
    expect(screen.getByText(/SOC 2 report shared/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Compact view' }));
    expect(screen.queryByText(/SOC 2 report shared/)).not.toBeInTheDocument();
  });

  it('shows pinned items in their own section only', () => {
    render(<ActivityFeed {...base} pinnedIds={['a3']} />);
    const pinned = screen.getByRole('region', { name: 'Pinned' });
    expect(within(pinned).getByText(/Champion moving/)).toBeInTheDocument();
    expect(screen.getAllByText(/Champion moving/)).toHaveLength(1);
  });

  it('pins optimistically and restores on rejection', async () => {
    let reject!: (e: Error) => void;
    const onTogglePin = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<ActivityFeed {...base} onTogglePin={onTogglePin} />);
    const today = screen.getByRole('region', { name: 'Today' });
    const [pin] = within(today).getAllByRole('button', { name: 'Pin' });
    await userEvent.click(pin);
    expect(onTogglePin).toHaveBeenCalledWith('a1', true);
    expect(screen.getByRole('region', { name: 'Pinned' })).toBeInTheDocument();
    await act(async () => reject(new Error('nope')));
    expect(
      screen.queryByRole('region', { name: 'Pinned' })
    ).not.toBeInTheDocument();
  });

  it('opens rows by click, and anchors on Space', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(<ActivityFeed {...base} onOpen={onOpen} />);
    await userEvent.click(screen.getByText('Security review'));
    expect(onOpen).toHaveBeenCalledWith('a4', activities[3]);

    rerender(
      <ActivityFeed {...base} onOpen={onOpen} getHref={(id) => `/a/${id}`} />
    );
    const link = screen.getByRole('link', { name: /Left voicemail/ });
    expect(link).toHaveAttribute('href', '/a/a6');
    link.focus();
    await userEvent.keyboard(' ');
    expect(onOpen).toHaveBeenLastCalledWith('a6', activities[5]);
  });

  it('scrolls the highlighted row into view', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<ActivityFeed {...base} highlightedId="a4" />);
    expect(scroll).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'center' })
    );
    expect(screen.getByText('Security review').closest('li')).toHaveAttribute(
      'data-highlighted',
      'true'
    );
  });

  it('shows load-more pending until the promise settles', async () => {
    let resolve!: () => void;
    const onLoadMore = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<ActivityFeed {...base} hasMore onLoadMore={onLoadMore} />);
    const button = screen.getByRole('button', { name: 'Load more' });
    await userEvent.click(button);
    expect(button).toBeDisabled();
    await act(async () => resolve());
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('renders the slots', () => {
    render(
      <ActivityFeed
        {...base}
        renderItemMeta={(a) => <span>meta-{a.id}</span>}
        renderDaySummary={(day, items) => (
          <p>
            {day}:{items.length}
          </p>
        )}
      />
    );
    expect(screen.getByText('meta-a1')).toBeInTheDocument();
    expect(screen.getByText('2026-03-12:2')).toBeInTheDocument();
  });

  it('replaces the row body with renderItem', () => {
    render(
      <ActivityFeed
        {...base}
        renderItem={(a, ctx) => <span>{`${a.id}-${ctx.category?.id}`}</span>}
      />
    );
    expect(screen.getByText('a1-call')).toBeInTheDocument();
  });

  it('keeps each pin button described by its item with renderItem', () => {
    render(
      <ActivityFeed
        {...base}
        onTogglePin={vi.fn()}
        renderItem={(a) => <span>{a.id}</span>}
      />
    );
    const pins = screen.getAllByRole('button', { name: 'Pin' });
    const descriptions = pins.map((p) => p.getAttribute('aria-describedby'));
    expect(new Set(descriptions).size).toBe(pins.length);
    for (const id of descriptions) {
      expect(document.getElementById(id!)?.textContent).toBeTruthy();
    }
  });

  it('renders the load states', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ActivityFeed {...base} items={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading activity');

    rerender(
      <ActivityFeed
        {...base}
        items={[]}
        error={new Error('x')}
        onRetry={onRetry}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load activity'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<ActivityFeed {...base} items={[]} />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('groups undated items last and forwards the ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ActivityFeed
        ref={ref}
        {...base}
        categories={undefined}
        items={[{ ...activities[0], at: 'not a date' }, activities[1]]}
      />
    );
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings).toEqual(['Today', 'Undated']);
    expect(ref.current).toHaveAttribute('data-slot', 'activity-feed');
  });
});
