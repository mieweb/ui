import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListView } from './ListView';
import { workItemAccessors, workItems, workItemStages } from './storyData';

const base = { items: workItems, accessors: workItemAccessors };

describe('ListView', () => {
  it('renders one row per item', () => {
    render(<ListView {...base} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(workItems.length);
    expect(
      screen.getByText('Retire the legacy fax intake queue')
    ).toBeInTheDocument();
  });

  it('groups by stage in the stages order, keeping empty stages', () => {
    render(<ListView {...base} stages={workItemStages} />);
    const headers = screen
      .getAllByRole('button', { expanded: true })
      .map((b) => b.textContent);
    expect(headers?.[0]).toContain('Backlog');
    expect(headers?.[1]).toContain('In progress');
    expect(headers?.[3]).toContain('Done');
  });

  it('labels each group list by its header', () => {
    render(<ListView {...base} stages={workItemStages} />);
    const list = screen.getByRole('list', { name: /In review/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });

  it('collapses and reopens a group', async () => {
    render(<ListView {...base} stages={workItemStages} />);
    const header = screen.getByRole('button', { name: /Backlog/i });
    await userEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText('Retire the legacy fax intake queue')
    ).not.toBeInTheDocument();
    await userEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('honours defaultCollapsedGroups', () => {
    render(
      <ListView
        {...base}
        stages={workItemStages}
        defaultCollapsedGroups={['done']}
      />
    );
    expect(screen.getByRole('button', { name: /Done/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('groups by getGroup when asked', () => {
    render(<ListView {...base} groupBy="group" />);
    expect(
      screen.getByRole('button', { name: /Implementation/i })
    ).toBeInTheDocument();
  });

  it('renders rows as plain content when neither onOpen nor getHref is given', () => {
    render(<ListView {...base} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('renders rows as buttons and reports the opened item', async () => {
    const onOpen = vi.fn();
    render(<ListView {...base} onOpen={onOpen} />);
    await userEvent.click(
      screen.getByRole('button', { name: /fax intake queue/i })
    );
    expect(onOpen).toHaveBeenCalledWith('WGL-106', workItems[5]);
  });

  it('renders rows as anchors when getHref is given, and still calls onOpen', async () => {
    const onOpen = vi.fn();
    render(
      <ListView {...base} getHref={(id) => `/work/${id}`} onOpen={onOpen} />
    );
    const link = screen.getByRole('link', { name: /fax intake queue/i });
    expect(link).toHaveAttribute('href', '/work/WGL-106');
    await userEvent.click(link);
    expect(onOpen).toHaveBeenCalledWith('WGL-106', workItems[5]);
  });

  it('leaves modified clicks to the browser', async () => {
    // One session, so the held modifier is still down at the click.
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <ListView {...base} getHref={(id) => `/work/${id}`} onOpen={onOpen} />
    );
    await user.keyboard('{Meta>}');
    await user.click(screen.getByRole('link', { name: /fax intake queue/i }));
    await user.keyboard('{/Meta}');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('marks the selected row as current', () => {
    render(<ListView {...base} selectedId="WGL-102" onOpen={() => {}} />);
    expect(
      screen.getByRole('button', { name: /Clinic network coverage/i })
    ).toHaveAttribute('aria-current', 'true');
  });

  it('shows the empty state instead of rows', () => {
    render(<ListView {...base} items={[]} />);
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('shows the loading state as a status region', () => {
    render(<ListView {...base} items={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('shows the error state as an alert and offers retry only when handled', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <ListView {...base} items={[]} error={new Error('nope')} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load this view'
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();

    rerender(
      <ListView
        {...base}
        items={[]}
        error={new Error('nope')}
        onRetry={onRetry}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('prefers the error state over loading', () => {
    render(<ListView {...base} items={[]} loading error={new Error('nope')} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('overrides the state strings through labels', () => {
    render(
      <ListView {...base} items={[]} labels={{ empty: 'No work items yet' }} />
    );
    expect(screen.getByText('No work items yet')).toBeInTheDocument();
  });

  it('renders a custom row body through renderItem', () => {
    render(
      <ListView
        {...base}
        renderItem={(item) => <span>custom:{item.id}</span>}
      />
    );
    expect(screen.getByText('custom:WGL-106')).toBeInTheDocument();
  });
});
