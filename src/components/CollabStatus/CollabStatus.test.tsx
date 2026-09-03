import { describe, expect, it } from 'vitest';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollabStatus } from './CollabStatus';
import { useYjsCollabStatus } from './useYjsCollabStatus';
import { LocalYjsRoom } from './storyData';

describe('CollabStatus', () => {
  it('renders the connection state and who else is editing', () => {
    render(
      <CollabStatus
        connected
        peers={[{ name: 'Ann' }, { name: 'Bo' }, { name: 'Bo' }]}
      />
    );

    expect(screen.getByRole('button')).toHaveTextContent('Live');
    // Two windows of the same person collapse into "Bo (2)".
    expect(screen.getByRole('button')).toHaveTextContent(
      'Ann, Bo (2) are editing'
    );
  });

  it('shows "Connecting…" before the initial sync', () => {
    render(<CollabStatus connected={false} />);
    expect(screen.getByRole('button')).toHaveTextContent('Connecting…');
  });

  it('renders a dot-only trigger when compact, keeping the status accessible', () => {
    render(<CollabStatus connected compact peers={[{ name: 'Ann' }]} />);

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveTextContent('');
    expect(trigger).toHaveAccessibleName(/Live — Ann is editing/);
  });

  it('lists who is in the room in the panel', async () => {
    const user = userEvent.setup();
    render(
      <CollabStatus connected peers={[{ name: 'Ann' }, { name: 'Bo' }]} />
    );

    await user.click(screen.getByRole('button', { name: /Live-sync status/ }));

    const panel = await screen.findByRole('dialog');
    expect(panel).toHaveTextContent('In the room (2)');
    expect(panel).toHaveTextContent('Ann');
    expect(panel).toHaveTextContent('Bo');
  });

  it('says so when nobody else is in the room', async () => {
    const user = userEvent.setup();
    render(<CollabStatus connected />);

    await user.click(screen.getByRole('button', { name: /Live-sync status/ }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'You are the only one here.'
    );
  });

  it('shares the dot with an app-level attention state', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CollabStatus connected compact attention="Unsaved changes" />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAccessibleName(/Live — Unsaved changes/);
    expect(
      container.querySelector('[data-slot="collab-status-dot"]')
    ).toHaveClass('bg-warning-500');

    await user.click(trigger);
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Unsaved changes'
    );
  });

  it('keeps the full text of clipped values in a hover tooltip', async () => {
    const user = userEvent.setup();
    const url = 'ws://localhost:5173/yorm/ws/Patient/p-demo?mode=editor';
    render(
      <CollabStatus
        connected
        room={{ name: 'Patient/p-demo', url }}
        log={[{ id: 'e1', at: 0, kind: 'patch', detail: 'edited family' }]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Live-sync status/ }));

    const panel = await screen.findByRole('dialog');
    expect(panel.querySelector(`[title="${url}"]`)).not.toBeNull();
    expect(panel.querySelector('[title="edited family"]')).not.toBeNull();
  });

  it('unclips every value when the wrap toggle is pressed', async () => {
    const user = userEvent.setup();
    const url = 'ws://localhost:5173/yorm/ws/Patient/p-demo?mode=editor';
    render(
      <CollabStatus
        connected
        room={{ name: 'Patient/p-demo', url }}
        log={[{ id: 'e1', at: 0, kind: 'patch', detail: 'edited family' }]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Live-sync status/ }));
    const panel = await screen.findByRole('dialog');
    expect(panel.querySelectorAll('.truncate').length).toBeGreaterThan(0);

    const wrap = screen.getByRole('button', { name: 'Wrap long values' });
    await user.click(wrap);

    expect(wrap).toHaveAttribute('aria-pressed', 'true');
    expect(panel.querySelectorAll('.truncate')).toHaveLength(0);
  });
});

describe('useYjsCollabStatus', () => {
  it('reports sync, peers and remote updates from a Yjs room', async () => {
    const room = new LocalYjsRoom('case/4');
    const self = room.join(0);
    const peer = room.join(0);

    const { result } = renderHook(() =>
      useYjsCollabStatus({
        doc: self.doc,
        provider: self.provider,
        user: { name: 'Me' },
      })
    );

    await waitFor(() => expect(result.current.connected).toBe(true));

    act(() => peer.awareness.setLocalStateField('user', { name: 'Ann' }));
    await waitFor(() =>
      expect(result.current.peers).toEqual([{ name: 'Ann', color: undefined }])
    );

    act(() => LocalYjsRoom.type(peer, 'hello'));
    await waitFor(() =>
      expect(
        result.current.log.some(
          (e) => e.kind === 'doc' && e.origin === 'remote'
        )
      ).toBe(true)
    );

    expect(result.current.room?.name).toBe('case/4');

    act(() => {
      self.leave();
      peer.leave();
    });
  });

  it('stays inert without a doc or provider', () => {
    const { result } = renderHook(() =>
      useYjsCollabStatus({ doc: null, provider: null })
    );

    expect(result.current.connected).toBe(false);
    expect(result.current.room).toBeNull();
  });
});
