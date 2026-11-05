import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MCPToolCallGroup } from './MCPToolCallGroup';
import type { MCPToolCall, MCPToolStatus } from './types';

function call(
  id: string,
  status: MCPToolStatus,
  extra: Partial<MCPToolCall> = {}
): MCPToolCall {
  return {
    id,
    toolName: `tool_${id}`,
    parameters: [{ name: 'path', type: 'string', value: '/' }],
    status,
    startedAt: new Date('2026-01-01T10:00:00Z'),
    ...extra,
  };
}

const header = () =>
  screen.getByRole('button', { name: /^(Used|Running) \d+ tools?/ });
const rows = () => screen.queryAllByRole('listitem');
const announcements = () =>
  screen.getAllByRole('status').map((region) => region.textContent);

describe('MCPToolCallGroup', () => {
  it('stays expanded while calls are running', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'running')]}
      />
    );

    expect(header()).toHaveAccessibleName(/Running 2 tools/);
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    expect(rows()).toHaveLength(2);
  });

  it('collapses to one line once every call has finished', async () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'running')]}
      />
    );
    rerender(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'success')]}
      />
    );

    expect(header()).toHaveAccessibleName(/Used 2 tools/);
    expect(header()).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(rows()).toHaveLength(0));
  });

  it('holds the rows open under focus and collapses once focus leaves', async () => {
    const { rerender } = renderWithTheme(
      <>
        <MCPToolCallGroup
          toolCalls={[call('a', 'success'), call('b', 'running')]}
        />
        <button type="button">Elsewhere</button>
      </>
    );
    const rowTrigger = screen.getByRole('button', { name: /tool_a/ });
    act(() => rowTrigger.focus());

    rerender(
      <>
        <MCPToolCallGroup
          toolCalls={[call('a', 'success'), call('b', 'success')]}
        />
        <button type="button">Elsewhere</button>
      </>
    );

    expect(header()).toHaveAccessibleName(/Used 2 tools/);
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    expect(rows()).toHaveLength(2);
    expect(rowTrigger).toHaveFocus();

    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());
    expect(header()).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(rows()).toHaveLength(0));
  });

  it('lets the header collapse a group held open by focus', () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'running')]}
      />
    );
    act(() => screen.getByRole('button', { name: /tool_a/ }).focus());
    rerender(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'success')]}
      />
    );

    // Pressing the header moves focus there before the click lands.
    act(() => header().focus());
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(header());
    expect(header()).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a focused pinned row when the user had collapsed the group', () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'awaiting-approval')]}
      />
    );
    fireEvent.click(header());
    const pinnedTrigger = screen.getByRole('button', { name: /tool_b/ });
    act(() => pinnedTrigger.focus());

    rerender(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'expired')]}
      />
    );

    expect(pinnedTrigger).toBeInTheDocument();
    expect(pinnedTrigger).toHaveFocus();
  });

  it('moves focus to the row when its approval buttons go', async () => {
    const calls = (status: MCPToolStatus) => [
      call('a', 'success'),
      call('b', status),
    ];
    const { rerender } = renderWithTheme(
      <>
        <MCPToolCallGroup
          toolCalls={calls('awaiting-approval')}
          onApprove={vi.fn()}
        />
        <button type="button">Elsewhere</button>
      </>
    );
    act(() => screen.getByRole('button', { name: 'Allow once' }).focus());

    rerender(
      <>
        <MCPToolCallGroup toolCalls={calls('running')} onApprove={vi.fn()} />
        <button type="button">Elsewhere</button>
      </>
    );
    expect(screen.getByRole('button', { name: /tool_b/ })).toHaveFocus();

    // Focus leaving after the run settles still collapses the group.
    rerender(
      <>
        <MCPToolCallGroup toolCalls={calls('success')} onApprove={vi.fn()} />
        <button type="button">Elsewhere</button>
      </>
    );
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());
    expect(header()).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(rows()).toHaveLength(0));
  });

  it('starts collapsed for a finished run loaded from history', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call('a', 'success'),
          call('b', 'success'),
          call('c', 'success'),
        ]}
      />
    );

    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(rows()).toHaveLength(0);
  });

  it('keeps failed calls and their error visible while collapsed', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call('a', 'success'),
          call('b', 'error', { error: 'Permission denied' }),
        ]}
      />
    );

    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(header()).toHaveAccessibleName(/1 failed/);
    const [row] = rows();
    expect(rows()).toHaveLength(1);
    expect(within(row).getByText('tool_b')).toBeInTheDocument();
    expect(within(row).getByText('Permission denied')).toBeInTheDocument();
  });

  it('treats an error result as the failure text', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call('a', 'success'),
          call('b', 'error', {
            result: { type: 'error', data: 'Rate limit exceeded' },
          }),
        ]}
      />
    );

    const [row] = rows();
    expect(within(row).getByText('Rate limit exceeded')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: /tool_b/ }));
    expect(
      within(row).getByRole('button', { name: 'Show error' })
    ).toBeInTheDocument();
  });

  it('prefers an error result’s detail over its summary', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call('a', 'error', {
            result: {
              type: 'error',
              summary: 'Request failed',
              data: 'HTTP 502 from upstream: connection reset',
            },
          }),
          call('b', 'error', {
            result: { type: 'error', summary: 'Timed out', data: null },
          }),
        ]}
      />
    );

    expect(
      screen.getByText('HTTP 502 from upstream: connection reset')
    ).toBeInTheDocument();
    expect(screen.getByText('Timed out')).toBeInTheDocument();
  });

  it('offers the full error alongside a partial result', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call('a', 'error', {
            result: { type: 'text', data: '3 of 10 rows written' },
            error: 'Disk quota exceeded',
          }),
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /tool_a/ }));
    expect(
      screen.getByRole('button', { name: 'Show result' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show error' }));
    expect(screen.getAllByText('Disk quota exceeded')).toHaveLength(2);
  });

  it('keeps approval controls visible when the user collapses the group', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'awaiting-approval')]}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />
    );

    fireEvent.click(header());

    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', { name: 'Allow once' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deny' })).toBeInTheDocument();
  });

  it('hands the call to onApprove and onDeny', async () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    const pending = call('a', 'awaiting-approval');
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[pending]}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Always allow' }));
    expect(onApprove).toHaveBeenCalledWith(pending, { always: true });

    // The row stays busy until the callback settles.
    const deny = screen.getByRole('button', { name: 'Deny' });
    await waitFor(() => expect(deny).toBeEnabled());
    fireEvent.click(deny);
    expect(onDeny).toHaveBeenCalledWith(pending);
    await waitFor(() => expect(deny).toBeEnabled());
  });

  it('re-enables the controls when a callback rejects', async () => {
    const onDeny = vi.fn().mockRejectedValue(new Error('Network down'));
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'awaiting-approval')]}
        onDeny={onDeny}
      />
    );

    const deny = screen.getByRole('button', { name: 'Deny' });
    fireEvent.click(deny);
    await waitFor(() => expect(deny).toBeEnabled());
    expect(onDeny).toHaveBeenCalledTimes(1);
  });

  it('shows no approval controls without callbacks', () => {
    renderWithTheme(
      <MCPToolCallGroup toolCalls={[call('a', 'awaiting-approval')]} />
    );

    expect(screen.queryByRole('button', { name: 'Allow once' })).toBeNull();
  });

  it('honours a manual expand until the group changes again', () => {
    const settled = [call('a', 'success'), call('b', 'success')];
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup toolCalls={settled} />
    );

    fireEvent.click(header());
    expect(header()).toHaveAttribute('aria-expanded', 'true');

    rerender(<MCPToolCallGroup toolCalls={[...settled]} />);
    expect(header()).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <MCPToolCallGroup toolCalls={[...settled, call('c', 'running')]} />
    );
    rerender(
      <MCPToolCallGroup toolCalls={[...settled, call('c', 'success')]} />
    );
    expect(header()).toHaveAttribute('aria-expanded', 'false');
  });

  it('announces status changes in a live region', () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'running'), call('b', 'awaiting-approval')]}
      />
    );
    expect(announcements()).toEqual(['1 tool call needs your approval', '']);

    rerender(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'error')]}
      />
    );
    expect(announcements()).toEqual(['Used 2 tools', '1 tool call failed']);
  });

  it('announces a failure while other calls are still active', () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'running'), call('b', 'running')]}
      />
    );

    rerender(
      <MCPToolCallGroup
        toolCalls={[call('a', 'error'), call('b', 'running')]}
      />
    );
    expect(announcements()).toEqual(['Running 2 tools', '1 tool call failed']);

    rerender(
      <MCPToolCallGroup
        toolCalls={[call('a', 'error'), call('b', 'awaiting-approval')]}
      />
    );
    expect(announcements()).toEqual([
      '1 tool call needs your approval',
      '1 tool call failed',
    ]);
  });

  it('re-announces a new approval request when the count is unchanged', () => {
    const { rerender } = renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'awaiting-approval'), call('b', 'pending')]}
      />
    );
    const [progress] = screen.getAllByRole('status');
    const before = progress.firstElementChild;

    rerender(
      <MCPToolCallGroup
        toolCalls={[call('a', 'running'), call('b', 'awaiting-approval')]}
      />
    );

    expect(progress).toHaveTextContent('1 tool call needs your approval');
    expect(progress.firstElementChild).not.toBe(before);
  });

  it('renders result links in the row and hands clicks to onLinkClick', () => {
    const onLinkClick = vi.fn();
    const link = {
      href: '/patients/42',
      label: 'Jane Doe',
      type: 'patient' as const,
    };
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call('a', 'success', {
            result: {
              type: 'link',
              data: null,
              summary: 'Created patient',
              link,
              resources: [{ id: 'r1', type: 'document', name: 'Intake form' }],
            },
          }),
        ]}
        onLinkClick={onLinkClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /tool_a/ }));
    fireEvent.click(screen.getByRole('link', { name: /Jane Doe/ }));

    expect(onLinkClick).toHaveBeenCalledWith(link);
    expect(
      screen.getByRole('link', { name: /Intake form/ })
    ).toBeInTheDocument();
  });

  it('keeps parameter JSON left-to-right and lets output pick its direction', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[
          call('a', 'success', { result: { type: 'text', data: 'done' } }),
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /tool_a/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Show result' }));
    expect(screen.getByText(/"path": "\/"/)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('done')).toHaveAttribute('dir', 'auto');
  });

  it('renders a lone call as a bare row with no header', () => {
    renderWithTheme(<MCPToolCallGroup toolCalls={[call('a', 'success')]} />);

    expect(
      screen.queryByRole('button', { name: /^(Used|Running)/ })
    ).toBeNull();
    expect(rows()).toHaveLength(1);
  });

  it('shows the display name and keeps the tool id in the details', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success', { displayName: 'Read notes.md' })]}
      />
    );

    const [row] = rows();
    expect(within(row).getByRole('group')).toHaveAccessibleName(
      'Tool call: Read notes.md'
    );
    expect(within(row).queryByText('tool_a')).toBeNull();

    fireEvent.click(within(row).getByRole('button', { name: /Read notes.md/ }));
    expect(
      row.querySelector('[data-slot="ai-tool-call-display-name"]')
    ).toHaveTextContent('Read notes.md');
    expect(within(row).getByText('Tool ID')).toBeInTheDocument();
    expect(within(row).getByText('tool_a')).toBeInTheDocument();
  });

  it('shows the tool id in the row when there is no display name', () => {
    renderWithTheme(<MCPToolCallGroup toolCalls={[call('a', 'success')]} />);

    const [row] = rows();
    expect(within(row).getByText('tool_a')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: /tool_a/ }));
    expect(within(row).queryByText('Tool ID')).toBeNull();
  });

  it('treats an empty display name as unset', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success', { displayName: '' })]}
      />
    );

    const [row] = rows();
    expect(within(row).getByRole('group')).toHaveAccessibleName(
      'Tool call: tool_a'
    );
    expect(within(row).getByText('tool_a')).toBeInTheDocument();
  });

  it('uses label overrides, merging status labels per key', () => {
    renderWithTheme(
      <MCPToolCallGroup
        toolCalls={[call('a', 'success'), call('b', 'success')]}
        labels={{
          used: (count) => `${count} herramientas usadas`,
          status: { success: 'Hecho' },
        }}
      />
    );

    expect(
      screen.getByRole('button', { name: '2 herramientas usadas' })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: '2 herramientas usadas' })
    );
    expect(screen.getAllByText('Hecho')).toHaveLength(2);
  });
});
