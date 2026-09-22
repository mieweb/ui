import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { BoardView } from './BoardView';
import {
  workItemAccessors,
  workItems,
  workItemStages,
  type WorkItem,
} from '../ListView/storyData';

const base = {
  items: workItems,
  accessors: workItemAccessors,
  stages: workItemStages,
};

/** Mirrors a real host: the move is committed to the caller's own state. */
function Board(
  props: Partial<React.ComponentProps<typeof BoardView<WorkItem>>>
) {
  const [items, setItems] = React.useState(workItems);
  return (
    <BoardView
      {...base}
      items={items}
      onMove={(id, toStage) =>
        setItems((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: toStage } : w))
        )
      }
      {...props}
    />
  );
}

const column = (name: RegExp | string) =>
  screen.getByRole('list', { name }) as HTMLElement;

// dnd-kit renders its own role="status" region, so address the board's by slot.
const announcer = () =>
  document.querySelector('[data-slot="board-view-announcer"]') as HTMLElement;

describe('BoardView', () => {
  it('renders one column per stage, in order', () => {
    render(<BoardView {...base} />);
    const headings = screen
      .getAllByRole('heading')
      .map((h) => h.textContent ?? '');
    expect(headings[0]).toContain('Backlog');
    expect(headings[3]).toContain('Done');
  });

  it('buckets items into their stage column', () => {
    render(<BoardView {...base} />);
    expect(
      within(column(/In progress/i)).getAllByRole('listitem')
    ).toHaveLength(2);
    expect(
      within(column(/Backlog/i)).getByText('Retire the legacy fax intake queue')
    ).toBeInTheDocument();
  });

  it('keeps an empty stage visible with a zero count', () => {
    render(
      <BoardView
        {...base}
        items={workItems.filter((w) => w.status !== 'done')}
      />
    );
    const heading = screen
      .getAllByRole('heading')
      .find((h) => h.textContent?.includes('Done'));
    expect(heading).toHaveTextContent('0');
  });

  it('gives items with an unknown status their own column rather than dropping them', () => {
    render(
      <BoardView
        {...base}
        items={[{ ...workItems[0], id: 'X-1', status: 'archived' }]}
      />
    );
    expect(column(/archived/i)).toBeInTheDocument();
  });

  it('labels a column whose stage id contains spaces', () => {
    // `aria-labelledby` splits on whitespace, so a raw status would unlabel it.
    render(
      <BoardView
        {...base}
        stages={[{ id: 'results ready', label: 'Results ready' }]}
        items={[{ ...workItems[0], id: 'S1', status: 'results ready' }]}
      />
    );
    expect(
      within(column(/Results ready/i)).getAllByRole('listitem')
    ).toHaveLength(1);
  });

  it('is read-only without onMove: no drag handles, no hint', () => {
    render(<BoardView {...base} />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    expect(card).not.toHaveAttribute('tabindex');
    expect(
      screen.queryByText(/Control with the arrow keys/i)
    ).not.toBeInTheDocument();
  });

  it('moves a card to the next stage with Ctrl+ArrowRight', async () => {
    const user = userEvent.setup();
    render(<Board />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    card.focus();
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    await waitFor(() =>
      expect(
        within(column(/In progress/i)).getByText(
          'Retire the legacy fax intake queue'
        )
      ).toBeInTheDocument()
    );
  });

  it('will not move past the first column', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<BoardView {...base} onMove={onMove} />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    card.focus();
    await user.keyboard('{Control>}{ArrowLeft}{/Control}');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('announces the move', async () => {
    const user = userEvent.setup();
    render(<Board />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    card.focus();
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    await waitFor(() =>
      expect(announcer()).toHaveTextContent(
        'Retire the legacy fax intake queue moved to In progress'
      )
    );
  });

  it('puts the card back and says so when onMove rejects', async () => {
    const user = userEvent.setup();
    render(<Board onMove={() => Promise.reject(new Error('nope'))} />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    card.focus();
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    await waitFor(() =>
      expect(announcer()).toHaveTextContent(
        'Could not move Retire the legacy fax intake queue'
      )
    );
    expect(
      within(column(/Backlog/i)).getByText('Retire the legacy fax intake queue')
    ).toBeInTheDocument();
  });

  it('renders cards as anchors when getHref is given, and still calls onOpen', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <BoardView {...base} getHref={(id) => `/work/${id}`} onOpen={onOpen} />
    );
    const link = screen.getByRole('link', { name: /fax intake queue/i });
    expect(link).toHaveAttribute('href', '/work/WGL-106');
    await user.click(link);
    expect(onOpen).toHaveBeenCalledWith('WGL-106', workItems[5]);
  });

  it('ignores a second move while the first is still in flight', async () => {
    const user = userEvent.setup();
    let settle: () => void = () => {};
    const onMove = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        })
    );
    render(<BoardView {...base} onMove={onMove} />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    card.focus();
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    expect(onMove).toHaveBeenCalledTimes(1);
    settle();
  });

  it('opens a card on click and on Enter', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<BoardView {...base} onOpen={onOpen} />);
    const card = screen
      .getByText('Retire the legacy fax intake queue')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    await user.click(card);
    expect(onOpen).toHaveBeenCalledWith('WGL-106', workItems[5]);
    card.focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('marks the selected card as current', () => {
    render(<BoardView {...base} selectedId="WGL-102" onOpen={() => {}} />);
    const card = screen
      .getByText('Clinic network coverage gaps in the Southeast')
      .closest('[data-slot="board-view-card"]') as HTMLElement;
    expect(card).toHaveAttribute('aria-current', 'true');
  });

  it('shows the loading state as a status region', () => {
    render(<BoardView {...base} items={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('shows the error state as an alert, in preference to loading', () => {
    render(
      <BoardView {...base} items={[]} loading error={new Error('nope')} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load this view'
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders a custom card body through renderItem', () => {
    render(
      <BoardView
        {...base}
        renderItem={(item) => <span>custom:{item.id}</span>}
      />
    );
    expect(screen.getByText('custom:WGL-106')).toBeInTheDocument();
  });

  it('overrides strings through labels', () => {
    render(
      <BoardView {...base} items={[]} labels={{ empty: 'Nothing here yet' }} />
    );
    expect(screen.getAllByText('Nothing here yet').length).toBeGreaterThan(0);
  });
});
